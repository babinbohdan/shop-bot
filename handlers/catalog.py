"""
handlers/catalog.py — перегляд каталогу: категорії → підкатегорії → товари.
Навігація реалізована виключно через Inline-кнопки.
"""

import logging

from aiogram import F, Router
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from database.db import get_session
from database.repo import (
    get_category, get_products_by_category, get_products_paginated,
    get_root_categories, get_subcategories, add_to_cart, get_user_by_tg_id,
)

logger = logging.getLogger(__name__)
router = Router(name="catalog")


# ─── Хелпер: клавіатура з категоріями ───────────────────────────────────────

def build_categories_keyboard(categories, back_callback: str | None = None) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for cat in categories:
        builder.button(text=cat.name, callback_data=f"cat:{cat.id}")
    builder.adjust(2)
    if back_callback:
        builder.row()
        builder.button(text="⬅️ Назад", callback_data=back_callback)
    return builder.as_markup()


# ─── Відкрити каталог (головні категорії) ────────────────────────────────────

@router.callback_query(F.data == "catalog")
async def show_catalog(callback: CallbackQuery) -> None:
    async with get_session() as session:
        categories = await get_root_categories(session)

    if not categories:
        await callback.answer("Каталог порожній 😔", show_alert=True)
        return

    await callback.message.edit_text(
        "🗂 <b>Каталог товарів</b>\n\nОберіть категорію:",
        reply_markup=build_categories_keyboard(categories),
    )
    await callback.answer()


# ─── Натиснули на категорію ───────────────────────────────────────────────────

@router.callback_query(F.data.startswith("cat:"))
async def show_category(callback: CallbackQuery) -> None:
    category_id = int(callback.data.split(":")[1])

    async with get_session() as session:
        category = await get_category(session, category_id)
        subcategories = await get_subcategories(session, category_id)
        products = await get_products_by_category(session, category_id)

    if not category:
        await callback.answer("Категорію не знайдено", show_alert=True)
        return

    # Якщо є підкатегорії — показуємо їх
    if subcategories:
        parent_back = f"cat:{category.parent_id}" if category.parent_id else "catalog"
        await callback.message.edit_text(
            f"📁 <b>{category.name}</b>\n\nОберіть підкатегорію:",
            reply_markup=build_categories_keyboard(subcategories, back_callback=parent_back),
        )
        await callback.answer()
        return

    # Якщо підкатегорій немає — показуємо товари з пагінацією
    await _show_products_page(callback, category, page=0)


# ─── Допоміжна функція: сторінка товарів ────────────────────────────────────

PAGE_SIZE = 8

async def _show_products_page(callback: CallbackQuery, category, page: int) -> None:
    offset = page * PAGE_SIZE
    async with get_session() as session:
        products, total = await get_products_paginated(session, category.id, offset=offset, limit=PAGE_SIZE)

    if not products:
        await callback.answer("В цій категорії немає товарів 😔", show_alert=True)
        return

    total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE

    builder = InlineKeyboardBuilder()
    for p in products:
        builder.button(text=f"{p.name[:40]} — {p.price} грн", callback_data=f"product:{p.id}")
    builder.adjust(1)

    # Кнопки навігації між сторінками
    nav_buttons = []
    if page > 0:
        nav_buttons.append(("◀️", f"page:{category.id}:{page - 1}"))
    nav_buttons.append((f"{page + 1}/{total_pages}", "noop"))
    if (page + 1) < total_pages:
        nav_buttons.append(("▶️", f"page:{category.id}:{page + 1}"))
    builder.row(*[
        InlineKeyboardButton(text=t, callback_data=c)
        for t, c in nav_buttons
    ])

    back_cat = f"cat:{category.parent_id}" if category.parent_id else "catalog"
    builder.row()
    builder.button(text="⬅️ Назад", callback_data=back_cat)

    await callback.message.edit_text(
        f"🛒 <b>{category.name}</b>\n\nТоварів: {total} | Сторінка {page + 1}/{total_pages}\n\nОберіть товар:",
        reply_markup=builder.as_markup(),
    )
    await callback.answer()


# ─── Пагінація товарів ───────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("page:"))
async def paginate_products(callback: CallbackQuery) -> None:
    _, cat_id_str, page_str = callback.data.split(":")
    category_id = int(cat_id_str)
    page = int(page_str)
    async with get_session() as session:
        category = await get_category(session, category_id)
    if not category:
        await callback.answer("Категорію не знайдено", show_alert=True)
        return
    await _show_products_page(callback, category, page)


@router.callback_query(F.data == "noop")
async def noop_handler(callback: CallbackQuery) -> None:
    await callback.answer()


# ─── Картка товару ───────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("product:"))
async def show_product(callback: CallbackQuery) -> None:
    product_id = int(callback.data.split(":")[1])

    async with get_session() as session:
        from database.models import Product
        product = await session.get(Product, product_id)

    if not product:
        await callback.answer("Товар не знайдено", show_alert=True)
        return

    stock_text = "✅ Є в наявності" if product.in_stock else "❌ Немає в наявності"

    caption = (
        f"<b>{product.name}</b>\n\n"
        f"{product.description}\n\n"
        f"💰 Ціна: <b>{product.price} грн</b>\n"
        f"{stock_text}"
    )

    builder = InlineKeyboardBuilder()
    if product.in_stock:
        builder.button(text="🛒 Додати до кошика", callback_data=f"add_cart:{product.id}")
    builder.button(text="⬅️ До категорії", callback_data=f"cat:{product.category_id}")
    builder.adjust(1)

    # Якщо є фото — відправляємо з фото, інакше тільки текст
    if product.photo_file_id:
        try:
            await callback.message.delete()
            await callback.message.answer_photo(
                photo=product.photo_file_id,
                caption=caption,
                reply_markup=builder.as_markup(),
            )
        except Exception:
            await callback.message.edit_text(caption, reply_markup=builder.as_markup())
    else:
        await callback.message.edit_text(caption, reply_markup=builder.as_markup())

    await callback.answer()


# ─── Додати до кошика ────────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("add_cart:"))
async def add_product_to_cart(callback: CallbackQuery) -> None:
    product_id = int(callback.data.split(":")[1])

    async with get_session() as session:
        user = await get_user_by_tg_id(session, callback.from_user.id)
        if not user:
            await callback.answer("Помилка: користувача не знайдено", show_alert=True)
            return
        await add_to_cart(session, user_id=user.id, product_id=product_id)

    await callback.answer("✅ Товар додано до кошика!", show_alert=False)


logger.info("Catalog router loaded")
