"""
database/repo.py — репозиторій: всі запити до БД в одному місці.
Жоден хендлер не повинен писати SQL напряму — тільки через ці функції.
"""

import logging
from datetime import datetime
from decimal import Decimal

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.models import CartItem, Category, Order, OrderItem, Product, PromoCode, User, WishlistItem

logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════════════
#  USERS
# ════════════════════════════════════════════════════════════════════════

async def get_user_by_tg_id(session: AsyncSession, telegram_id: int) -> User | None:
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, telegram_id: int, phone: str) -> User:
    user = User(telegram_id=telegram_id, phone=phone, full_name="", city="", delivery_type="")
    session.add(user)
    await session.flush()   # щоб отримати id без commit
    return user


async def update_user_registration(
    session: AsyncSession,
    telegram_id: int,
    full_name: str,
    city: str,
    delivery_type: str,
) -> None:
    await session.execute(
        update(User)
        .where(User.telegram_id == telegram_id)
        .values(full_name=full_name, city=city, delivery_type=delivery_type, is_registered=True)
    )


# ════════════════════════════════════════════════════════════════════════
#  CATEGORIES
# ════════════════════════════════════════════════════════════════════════

async def get_root_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(
        select(Category).where(Category.parent_id.is_(None), Category.is_active == True)
    )
    return list(result.scalars())


async def get_subcategories(session: AsyncSession, parent_id: int) -> list[Category]:
    result = await session.execute(
        select(Category).where(Category.parent_id == parent_id, Category.is_active == True)
    )
    return list(result.scalars())


async def get_category(session: AsyncSession, category_id: int) -> Category | None:
    return await session.get(Category, category_id)


# ════════════════════════════════════════════════════════════════════════
#  PRODUCTS
# ════════════════════════════════════════════════════════════════════════

async def get_products_by_category(session: AsyncSession, category_id: int) -> list[Product]:
    result = await session.execute(
        select(Product).where(
            Product.category_id == category_id,
            Product.is_active == True,
            Product.in_stock == True,
        )
    )
    return list(result.scalars())


async def get_products_paginated(
    session: AsyncSession, category_id: int, offset: int = 0, limit: int = 8
) -> tuple[list[Product], int]:
    """Повертає (список товарів, загальну кількість) для пагінації."""
    from sqlalchemy import func as sa_func
    base = select(Product).where(
        Product.category_id == category_id,
        Product.is_active == True,
        Product.in_stock == True,
    )
    total_result = await session.execute(select(sa_func.count()).select_from(base.subquery()))
    total = total_result.scalar_one()
    result = await session.execute(base.offset(offset).limit(limit))
    return list(result.scalars()), total


async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    return await session.get(Product, product_id)


async def get_all_active_products(session: AsyncSession) -> list[Product]:
    result = await session.execute(select(Product).where(Product.is_active == True))
    return list(result.scalars())


async def update_product_price(session: AsyncSession, product_id: int, new_price: float) -> None:
    await session.execute(
        update(Product).where(Product.id == product_id).values(price=Decimal(str(new_price)))
    )


async def update_product_supplier_price(
    session: AsyncSession, product_id: int, supplier_price: float
) -> None:
    await session.execute(
        update(Product)
        .where(Product.id == product_id)
        .values(supplier_price=Decimal(str(supplier_price)))
    )


async def set_product_stock(session: AsyncSession, product_id: int, in_stock: bool) -> None:
    await session.execute(
        update(Product).where(Product.id == product_id).values(in_stock=in_stock)
    )


# ════════════════════════════════════════════════════════════════════════
#  CART
# ════════════════════════════════════════════════════════════════════════

async def get_cart(session: AsyncSession, user_id: int) -> list[CartItem]:
    result = await session.execute(
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product))
    )
    return list(result.scalars())


async def add_to_cart(session: AsyncSession, user_id: int, product_id: int, quantity: int = 1) -> None:
    # Якщо товар вже є — збільшуємо кількість
    result = await session.execute(
        select(CartItem).where(CartItem.user_id == user_id, CartItem.product_id == product_id)
    )
    item = result.scalar_one_or_none()
    if item:
        item.quantity += quantity
    else:
        session.add(CartItem(user_id=user_id, product_id=product_id, quantity=quantity))


async def remove_from_cart(session: AsyncSession, cart_item_id: int) -> None:
    await session.execute(delete(CartItem).where(CartItem.id == cart_item_id))


async def update_cart_quantity(session: AsyncSession, cart_item_id: int, quantity: int) -> None:
    if quantity <= 0:
        await remove_from_cart(session, cart_item_id)
    else:
        await session.execute(
            update(CartItem).where(CartItem.id == cart_item_id).values(quantity=quantity)
        )


async def clear_cart(session: AsyncSession, user_id: int) -> None:
    await session.execute(delete(CartItem).where(CartItem.user_id == user_id))


# ════════════════════════════════════════════════════════════════════════
#  ORDERS
# ════════════════════════════════════════════════════════════════════════

async def create_order(
    session: AsyncSession,
    user_id: int,
    cart_items: list[CartItem],
    comment: str,
) -> Order:
    total = sum(item.product.price * item.quantity for item in cart_items)
    order = Order(user_id=user_id, total_price=total, comment=comment)
    session.add(order)
    await session.flush()  # отримуємо order.id

    for item in cart_items:
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_order=item.product.price,
            )
        )
    return order


# ════════════════════════════════════════════════════════════════════════
#  ABANDONED CART REMINDER
# ════════════════════════════════════════════════════════════════════════

async def get_users_with_abandoned_carts(session: AsyncSession) -> list[tuple[User, list[CartItem]]]:
    """
    Повертає користувачів, у яких є товари в кошику ≥ 2 год і яким ще
    не надсилали нагадування (або надсилали > 24 год тому).
    """
    from datetime import timedelta, timezone
    from sqlalchemy import and_, or_

    threshold = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2)
    remind_cooldown = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)

    result = await session.execute(
        select(User)
        .join(CartItem, CartItem.user_id == User.id)
        .where(
            CartItem.added_at <= threshold,
            or_(CartItem.notified_at.is_(None), CartItem.notified_at <= remind_cooldown),
            User.is_blocked == False,
        )
        .options(selectinload(User.cart_items).selectinload(CartItem.product))
        .distinct()
    )
    users = result.scalars().all()
    return [(u, u.cart_items) for u in users if u.cart_items]


async def mark_cart_notified(session: AsyncSession, user_id: int) -> None:
    """Ставить notified_at = зараз для всіх позицій кошика користувача."""
    from datetime import timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    await session.execute(
        update(CartItem).where(CartItem.user_id == user_id).values(notified_at=now)
    )


# ════════════════════════════════════════════════════════════════════════
#  PROMO CODES
# ════════════════════════════════════════════════════════════════════════

async def get_promo_code(session: AsyncSession, code: str) -> PromoCode | None:
    from datetime import timezone
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    result = await session.execute(
        select(PromoCode).where(
            PromoCode.code == code.upper().strip(),
            PromoCode.is_active == True,
        )
    )
    promo = result.scalar_one_or_none()
    if promo is None:
        return None
    # Перевіряємо термін дії
    if promo.expires_at and promo.expires_at < now:
        return None
    # Перевіряємо ліміт використань
    if promo.max_uses is not None and promo.used_count >= promo.max_uses:
        return None
    return promo


async def use_promo_code(session: AsyncSession, code_id: int) -> None:
    await session.execute(
        update(PromoCode)
        .where(PromoCode.id == code_id)
        .values(used_count=PromoCode.used_count + 1)
    )


# ════════════════════════════════════════════════════════════════════════
#  WISHLIST
# ════════════════════════════════════════════════════════════════════════

async def get_wishlist(session: AsyncSession, user_id: int) -> list[WishlistItem]:
    result = await session.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .options(selectinload(WishlistItem.product))
        .order_by(WishlistItem.added_at.desc())
    )
    return list(result.scalars())


async def get_wishlist_product_ids(session: AsyncSession, user_id: int) -> set[int]:
    result = await session.execute(
        select(WishlistItem.product_id).where(WishlistItem.user_id == user_id)
    )
    return set(result.scalars())


async def add_to_wishlist(session: AsyncSession, user_id: int, product_id: int) -> bool:
    """Повертає True якщо додано, False якщо вже є."""
    result = await session.execute(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    )
    if result.scalar_one_or_none():
        return False
    session.add(WishlistItem(user_id=user_id, product_id=product_id))
    return True


async def remove_from_wishlist(session: AsyncSession, user_id: int, product_id: int) -> None:
    await session.execute(
        delete(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    )


# ════════════════════════════════════════════════════════════════════════
#  ORDERS (продовження)
# ════════════════════════════════════════════════════════════════════════

async def get_order_with_items(session: AsyncSession, order_id: int) -> Order | None:
    result = await session.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
    )
    return result.scalar_one_or_none()
