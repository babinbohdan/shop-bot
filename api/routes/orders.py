"""
api/routes/orders.py — оформлення замовлення з Mini App.

POST /api/orders — приймає замовлення, перевіряє підпис Telegram,
                   записує в БД, сповіщає адміна через бота.

Безпека:
  Telegram підписує initData HMAC-SHA256. Ми перевіряємо підпис
  перед будь-яким записом у БД — це захист від підроблених запитів.
"""

import hashlib
import hmac
import json
import logging
import urllib.parse
from datetime import datetime

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from config import settings
from database.db import get_session
from database.models import Order, OrderItem, Product, User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["orders"])


# ─── Pydantic схеми ──────────────────────────────────────────────────────────

class CartItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=100)


class OrderIn(BaseModel):
    items: list[CartItemIn] = Field(min_length=1)
    comment: str = Field(default="", max_length=500)


class OrderOut(BaseModel):
    order_id: int
    total: float
    message: str


# ─── Валідація підпису Telegram initData ─────────────────────────────────────

def validate_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Перевіряє підпис initData від Telegram.WebApp.
    Якщо підпис невірний — піднімає HTTPException 401.

    Документація: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
    """
    # Розбираємо рядок initData
    parsed = dict(urllib.parse.parse_qsl(init_data, strict_parsing=True))
    received_hash = parsed.pop("hash", None)

    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash in initData")

    # Будуємо data_check_string: відсортовані пари key=value через \n
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(parsed.items())
    )

    # HMAC-SHA256 з ключем = HMAC("WebAppData", bot_token)
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    # Розбираємо user JSON
    user_data = {}
    if "user" in parsed:
        try:
            user_data = json.loads(parsed["user"])
        except json.JSONDecodeError:
            pass

    return user_data


# ─── POST /api/orders ────────────────────────────────────────────────────────

@router.post("/orders", response_model=OrderOut)
async def create_order(
    order_in: OrderIn,
    x_telegram_init_data: str = Header(default="", description="Telegram WebApp.initData"),
):
    """
    Оформлення замовлення з Mini App.

    1. Перевіряємо підпис Telegram (initData у заголовку)
    2. Знаходимо або помилка якщо юзер не зареєстрований в боті
    3. Перевіряємо наявність товарів і рахуємо суму
    4. Записуємо замовлення в БД
    5. Надсилаємо сповіщення адміну
    """
    # ── Крок 1: валідація підпису ─────────────────────────────────────────────
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="Telegram initData відсутній. Відкрийте магазин через бота.")

    tg_user = validate_telegram_init_data(x_telegram_init_data, settings.BOT_TOKEN)
    tg_id = tg_user.get("id")

    if not tg_id:
        raise HTTPException(status_code=401, detail="Не вдалося отримати ID користувача з Telegram")

    # ── Крок 2: знайти юзера в БД ────────────────────────────────────────────
    async with get_session() as session:
        user_result = await session.execute(
            select(User).where(User.telegram_id == tg_id)
        )
        user = user_result.scalar_one_or_none()

    if not user or not user.is_registered:
        raise HTTPException(
            status_code=403,
            detail="Спочатку зареєструйтесь у боті командою /start"
        )

    # ── Крок 3: перевірка товарів і підрахунок суми ───────────────────────────
    product_ids = [item.product_id for item in order_in.items]

    async with get_session() as session:
        products_result = await session.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.is_active == True,
            )
        )
        products_map = {p.id: p for p in products_result.scalars().all()}

    # Перевіряємо що всі товари знайдено
    missing = [pid for pid in product_ids if pid not in products_map]
    if missing:
        raise HTTPException(status_code=400, detail=f"Товари не знайдені: {missing}")

    # Перевіряємо наявність
    out_of_stock = [
        products_map[item.product_id].name
        for item in order_in.items
        if not products_map[item.product_id].in_stock
    ]
    if out_of_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Немає в наявності: {', '.join(out_of_stock[:3])}"
        )

    # Рахуємо суму
    total = sum(
        float(products_map[item.product_id].price) * item.quantity
        for item in order_in.items
    )

    # ── Крок 4: запис у БД ───────────────────────────────────────────────────
    async with get_session() as session:
        order = Order(
            user_id=user.id,
            total_price=total,
            comment=order_in.comment,
            status="new",
            source="mini_app",
        )
        session.add(order)
        await session.flush()

        for item in order_in.items:
            product = products_map[item.product_id]
            session.add(OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_order=product.price,
            ))

        order_id = order.id

    logger.info(f"Order #{order_id} created from Mini App | user tg_id={tg_id} | total={total:.2f}")

    # ── Крок 5: сповіщення адміну ────────────────────────────────────────────
    await _notify_admin_new_order(order_id, user, order_in, products_map, total)

    return OrderOut(
        order_id=order_id,
        total=total,
        message="Замовлення прийнято! Менеджер зателефонує вам найближчим часом.",
    )


async def _notify_admin_new_order(order_id, user, order_in, products_map, total) -> None:
    """Відправляє адміну повідомлення про нове замовлення."""
    try:
        from aiogram import Bot
        from aiogram.client.default import DefaultBotProperties
        from aiogram.enums import ParseMode

        delivery_label = "🚚 Доставка" if user.delivery_type == "delivery" else "🏪 Самовивіз"

        items_text = "\n".join(
            f"  • {products_map[item.product_id].name[:60]} × {item.quantity} = "
            f"{float(products_map[item.product_id].price) * item.quantity:.2f} грн"
            for item in order_in.items
        )

        text = (
            f"🛒 <b>НОВЕ ЗАМОВЛЕННЯ #{order_id}</b> (Mini App)\n"
            f"📅 {datetime.now().strftime('%d.%m.%Y %H:%M')}\n"
            f"{'─' * 28}\n"
            f"👤 {user.full_name}\n"
            f"📱 {user.phone}\n"
            f"🏙 {user.city} | {delivery_label}\n"
            f"{'─' * 28}\n"
            f"{items_text}\n"
            f"{'─' * 28}\n"
            f"💰 <b>Разом: {total:.2f} грн</b>\n"
            f"💬 {order_in.comment or '—'}"
        )

        bot = Bot(
            token=settings.BOT_TOKEN,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML),
        )
        await bot.send_message(chat_id=settings.ADMIN_CHAT_ID, text=text)
        await bot.session.close()

    except Exception as e:
        logger.error(f"Failed to notify admin about order #{order_id}: {e}")
