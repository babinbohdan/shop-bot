"""
handlers/admin.py — адміністративні команди (доступні лише ADMIN_CHAT_ID).

Команди:
  /admin             — показати панель адміна
  /add_product       — додати новий товар (FSM)
  /list_products     — список усіх товарів
  /toggle_stock <id> — увімк/вимк наявність товару
  /set_post_time HH:MM — змінити час щоденної публікації
  /stats             — статистика (замовлення, юзери)

Обробники inline-кнопок з моніторингу цін:
  price_accept:<id>:<new_price>  — оновити ціну на вітрині
  price_keep:<id>                — залишити стару ціну
"""

import logging

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import func, select

from config import settings
from database.db import get_session
from database.models import Order, Product, User
from database.repo import (
    get_all_active_products, set_product_stock, update_product_price,
)

logger = logging.getLogger(__name__)
router = Router(name="admin")


# ─── Фільтр: тільки для адміна ───────────────────────────────────────────────

def is_admin(message_or_callback) -> bool:
    uid = (
        message_or_callback.from_user.id
        if hasattr(message_or_callback, "from_user")
        else None
    )
    return uid == settings.ADMIN_CHAT_ID


# ─── FSM для додавання товару ────────────────────────────────────────────────

class AddProductStates(StatesGroup):
    category_id = State()
    name = State()
    description = State()
    price = State()
    photo = State()
    supplier_url = State()


# ─── /admin ──────────────────────────────────────────────────────────────────

@router.message(Command("admin"))
async def admin_panel(message: Message) -> None:
    if not is_admin(message):
        return

    text = (
        "🔧 <b>Адмін-панель</b>\n\n"
        "/add_product — додати товар\n"
        "/list_products — список товарів\n"
        "/toggle_stock &lt;id&gt; — змінити наявність\n"
        "/set_post_time HH:MM — змінити час публікації\n"
        "/stats — статистика"
    )
    await message.answer(text)


# ─── /stats ──────────────────────────────────────────────────────────────────

@router.message(Command("stats"))
async def cmd_stats(message: Message) -> None:
    if not is_admin(message):
        return

    async with get_session() as session:
        users_count = (await session.execute(select(func.count()).select_from(User))).scalar()
        orders_count = (await session.execute(select(func.count()).select_from(Order))).scalar()
        revenue = (await session.execute(select(func.sum(Order.total_price)))).scalar() or 0

    await message.answer(
        f"📊 <b>Статистика</b>\n\n"
        f"👥 Користувачів: {users_count}\n"
        f"📦 Замовлень: {orders_count}\n"
        f"💰 Загальний дохід: {float(revenue):.2f} грн"
    )


# ─── /list_products ──────────────────────────────────────────────────────────

@router.message(Command("list_products"))
async def cmd_list_products(message: Message) -> None:
    if not is_admin(message):
        return

    async with get_session() as session:
        products = await get_all_active_products(session)

    if not products:
        await message.answer("Товарів немає.")
        return

    lines = ["<b>Список товарів:</b>\n"]
    for p in products:
        stock = "✅" if p.in_stock else "❌"
        lines.append(f"{stock} [{p.id}] {p.name} — {p.price} грн")

    await message.answer("\n".join(lines))


# ─── /toggle_stock <id> ──────────────────────────────────────────────────────

@router.message(Command("toggle_stock"))
async def cmd_toggle_stock(message: Message) -> None:
    if not is_admin(message):
        return

    args = message.text.split()
    if len(args) < 2 or not args[1].isdigit():
        await message.answer("Використання: /toggle_stock <id>")
        return

    product_id = int(args[1])
    async with get_session() as session:
        product = await session.get(Product, product_id)
        if not product:
            await message.answer(f"Товар #{product_id} не знайдено.")
            return
        new_stock = not product.in_stock
        await set_product_stock(session, product_id, new_stock)

    status = "є в наявності ✅" if new_stock else "відсутній ❌"
    await message.answer(f"Товар <b>{product.name}</b> тепер {status}.")


# ─── /add_product FSM ────────────────────────────────────────────────────────

@router.message(Command("add_product"))
async def cmd_add_product_start(message: Message, state: FSMContext) -> None:
    if not is_admin(message):
        return
    await message.answer("Введіть <b>ID категорії</b> для нового товару:")
    await state.set_state(AddProductStates.category_id)


@router.message(AddProductStates.category_id, F.text)
async def add_product_category(message: Message, state: FSMContext) -> None:
    if not message.text.isdigit():
        await message.answer("ID має бути числом. Спробуйте ще раз:")
        return
    await state.update_data(category_id=int(message.text))
    await message.answer("Введіть <b>назву товару</b>:")
    await state.set_state(AddProductStates.name)


@router.message(AddProductStates.name, F.text)
async def add_product_name(message: Message, state: FSMContext) -> None:
    await state.update_data(name=message.text.strip())
    await message.answer("Введіть <b>опис товару</b>:")
    await state.set_state(AddProductStates.description)


@router.message(AddProductStates.description, F.text)
async def add_product_desc(message: Message, state: FSMContext) -> None:
    await state.update_data(description=message.text.strip())
    await message.answer("Введіть <b>ціну</b> (наприклад: 299.90):")
    await state.set_state(AddProductStates.price)


@router.message(AddProductStates.price, F.text)
async def add_product_price(message: Message, state: FSMContext) -> None:
    try:
        price = float(message.text.replace(",", "."))
    except ValueError:
        await message.answer("Невірний формат ціни. Введіть число, наприклад: 299.90")
        return
    await state.update_data(price=price)
    await message.answer("Надішліть <b>фото товару</b> (або /skip щоб пропустити):")
    await state.set_state(AddProductStates.photo)


@router.message(AddProductStates.photo, F.photo)
async def add_product_photo(message: Message, state: FSMContext) -> None:
    file_id = message.photo[-1].file_id  # беремо найбільший розмір
    await state.update_data(photo_file_id=file_id)
    await message.answer("Введіть <b>URL товару у постачальника</b> (або /skip):")
    await state.set_state(AddProductStates.supplier_url)


@router.message(AddProductStates.photo, Command("skip"))
async def add_product_photo_skip(message: Message, state: FSMContext) -> None:
    await state.update_data(photo_file_id=None)
    await message.answer("Введіть <b>URL товару у постачальника</b> (або /skip):")
    await state.set_state(AddProductStates.supplier_url)


@router.message(AddProductStates.supplier_url)
async def add_product_supplier_url(message: Message, state: FSMContext) -> None:
    url = None if message.text == "/skip" else message.text.strip()
    await state.update_data(supplier_url=url)
    data = await state.get_data()

    async with get_session() as session:
        from database.models import Category
        category = await session.get(Category, data["category_id"])
        if not category:
            await message.answer(f"Категорія #{data['category_id']} не знайдена. Спробуйте /add_product знову.")
            await state.clear()
            return

        new_product = Product(
            category_id=data["category_id"],
            name=data["name"],
            description=data["description"],
            price=data["price"],
            photo_file_id=data.get("photo_file_id"),
            supplier_url=data.get("supplier_url"),
        )
        session.add(new_product)
        await session.flush()
        product_id = new_product.id

    await state.clear()
    await message.answer(
        f"✅ Товар <b>{data['name']}</b> (ID: {product_id}) успішно додано до категорії «{category.name}»!"
    )


# ─── Обробка рішення адміна щодо ціни ────────────────────────────────────────

@router.callback_query(F.data.startswith("price_accept:"))
async def price_accept(callback: CallbackQuery) -> None:
    """Адмін погодився оновити ціну на нову."""
    if not is_admin(callback):
        await callback.answer("Доступ заборонено", show_alert=True)
        return

    _, product_id_str, new_price_str = callback.data.split(":")
    product_id = int(product_id_str)
    new_price = float(new_price_str)

    async with get_session() as session:
        product = await session.get(Product, product_id)
        old_price = float(product.price) if product else 0
        await update_product_price(session, product_id, new_price)

    await callback.message.edit_text(
        callback.message.text + f"\n\n✅ <b>Ціну оновлено:</b> {old_price} → {new_price} грн"
    )
    await callback.answer("Ціну оновлено!")
    logger.info(f"Admin updated price for product {product_id}: {old_price} → {new_price}")


@router.callback_query(F.data.startswith("price_keep:"))
async def price_keep(callback: CallbackQuery) -> None:
    """Адмін вирішив залишити стару ціну."""
    if not is_admin(callback):
        await callback.answer("Доступ заборонено", show_alert=True)
        return

    await callback.message.edit_text(
        callback.message.text + "\n\n⏸ <b>Ціну залишено без змін.</b>"
    )
    await callback.answer("Ціну залишено без змін")


logger.info("Admin router loaded")
