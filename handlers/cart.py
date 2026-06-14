"""
handlers/cart.py — кошик: перегляд, редагування, оформлення замовлення.

FSM OrderStates:
  waiting_comment — очікуємо коментар перед підтвердженням

Виправлення: Bot передається через aiogram DI (data["bot"]), а не Bot.get_current()
"""

import logging
from datetime import datetime

from aiogram import Bot, F, Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import settings
from database.db import get_session
from database.repo import (
    clear_cart, create_order, get_cart, get_order_with_items,
    get_user_by_tg_id, remove_from_cart, update_cart_quantity,
)
from utils.formatters import format_order_for_admin

logger = logging.getLogger(__name__)
router = Router(name="cart")


class OrderStates(StatesGroup):
    waiting_comment = State()


# ─── Хелпер: текстове представлення кошика ──────────────────────────────────

def format_cart_text(cart_items) -> tuple[str, float]:
    """Повертає (текст, загальна_сума)."""
    if not cart_items:
        return "🛒 Ваш кошик порожній.", 0.0

    lines = ["🛒 <b>Ваш кошик:</b>\n"]
    total = 0.0
    for item in cart_items:
        subtotal = float(item.product.price) * item.quantity
        total += subtotal
        lines.append(f"• {item.product.name} × {item.quantity} = {subtotal:.2f} грн")

    lines.append(f"\n💰 <b>Разом: {total:.2f} грн</b>")
    return "\n".join(lines), total


# ─── Показати кошик ──────────────────────────────────────────────────────────

@router.callback_query(F.data == "cart")
async def show_cart(callback: CallbackQuery) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, callback.from_user.id)
        cart_items = await get_cart(session, user.id) if user else []

    text, total = format_cart_text(cart_items)

    builder = InlineKeyboardBuilder()
    if cart_items:
        builder.button(text="✅ Оформити замовлення", callback_data="order:checkout")
        builder.button(text="✏️ Редагувати", callback_data="order:edit")
        builder.button(text="🗑 Очистити кошик", callback_data="order:clear")
    builder.button(text="🛍 До каталогу", callback_data="catalog")
    builder.adjust(1)

    try:
        await callback.message.edit_text(text, reply_markup=builder.as_markup())
    except Exception:
        await callback.message.answer(text, reply_markup=builder.as_markup())
    await callback.answer()


# ─── Редагувати кошик ────────────────────────────────────────────────────────

@router.callback_query(F.data == "order:edit")
async def edit_cart(callback: CallbackQuery) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, callback.from_user.id)
        cart_items = await get_cart(session, user.id) if user else []

    if not cart_items:
        await callback.answer("Кошик порожній", show_alert=True)
        return

    builder = InlineKeyboardBuilder()
    for item in cart_items:
        # Назва товару + кількість — рядок-заголовок (не натискається)
        builder.button(
            text=f"❌ {item.product.name} (×{item.quantity})",
            callback_data=f"cart_remove:{item.id}",
        )
        builder.button(text="➖", callback_data=f"cart_qty:{item.id}:dec")
        builder.button(text="➕", callback_data=f"cart_qty:{item.id}:inc")

    builder.button(text="⬅️ Назад до кошика", callback_data="cart")
    builder.adjust(3)

    await callback.message.edit_text(
        "✏️ <b>Редагування кошика</b>\n"
        "Натисніть ❌ щоб видалити товар, або ➖/➕ для зміни кількості:",
        reply_markup=builder.as_markup(),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("cart_remove:"))
async def remove_cart_item(callback: CallbackQuery) -> None:
    item_id = int(callback.data.split(":")[1])
    async with get_session() as session:
        await remove_from_cart(session, item_id)
    await callback.answer("Товар видалено")
    # Перемалюємо список редагування
    await edit_cart(callback)


@router.callback_query(F.data.startswith("cart_qty:"))
async def change_cart_qty(callback: CallbackQuery) -> None:
    _, item_id_str, action = callback.data.split(":")
    item_id = int(item_id_str)

    async with get_session() as session:
        from database.models import CartItem
        item = await session.get(CartItem, item_id)
        if not item:
            await callback.answer("Товар не знайдено", show_alert=True)
            return
        new_qty = item.quantity + (1 if action == "inc" else -1)
        await update_cart_quantity(session, item_id, new_qty)

    await callback.answer()
    await edit_cart(callback)


# ─── Очистити кошик ──────────────────────────────────────────────────────────

@router.callback_query(F.data == "order:clear")
async def clear_cart_handler(callback: CallbackQuery) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, callback.from_user.id)
        if user:
            await clear_cart(session, user.id)

    builder = InlineKeyboardBuilder()
    builder.button(text="🛍 До каталогу", callback_data="catalog")

    await callback.message.edit_text("🗑 Кошик очищено.", reply_markup=builder.as_markup())
    await callback.answer()


# ─── Оформлення: запит коментаря ─────────────────────────────────────────────

@router.callback_query(F.data == "order:checkout")
async def checkout_ask_comment(callback: CallbackQuery, state: FSMContext) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, callback.from_user.id)
        cart_items = await get_cart(session, user.id) if user else []

    if not cart_items:
        await callback.answer("Кошик порожній!", show_alert=True)
        return

    await state.update_data(checkout_tg_id=callback.from_user.id)
    await state.set_state(OrderStates.waiting_comment)

    builder = InlineKeyboardBuilder()
    builder.button(text="⏩ Пропустити", callback_data="order:no_comment")

    await callback.message.edit_text(
        "💬 Залиште коментар до замовлення\n"
        "(наприклад: побажання щодо пакування, зручний час доставки тощо).\n\n"
        "Або натисніть <b>«Пропустити»</b>, якщо коментар не потрібен:",
        reply_markup=builder.as_markup(),
    )
    await callback.answer()


# ─── Оформлення: без коментаря ───────────────────────────────────────────────

@router.callback_query(OrderStates.waiting_comment, F.data == "order:no_comment")
async def checkout_no_comment(callback: CallbackQuery, state: FSMContext, bot: Bot) -> None:
    # bot тут — aiogram 3.x DI-ін'єкція, працює автоматично
    await _finalize_order(
        reply_target=callback.message,
        tg_id=callback.from_user.id,
        state=state,
        bot=bot,
        comment="",
    )
    await callback.answer()


# ─── Оформлення: з коментарем ────────────────────────────────────────────────

@router.message(OrderStates.waiting_comment, F.text)
async def checkout_with_comment(message: Message, state: FSMContext, bot: Bot) -> None:
    await _finalize_order(
        reply_target=message,
        tg_id=message.from_user.id,
        state=state,
        bot=bot,
        comment=message.text.strip(),
    )


# ─── Фінальна обробка замовлення ─────────────────────────────────────────────

async def _finalize_order(
    reply_target: Message,
    tg_id: int,
    state: FSMContext,
    bot: Bot,
    comment: str,
) -> None:
    """
    Зберігає замовлення в БД, надсилає підтвердження клієнту
    та миттєве сповіщення адміну. Очищає кошик.
    """
    async with get_session() as session:
        user = await get_user_by_tg_id(session, tg_id)
        if not user:
            await reply_target.answer("❌ Помилка авторизації. Спробуйте /start")
            await state.clear()
            return

        cart_items = await get_cart(session, user.id)
        if not cart_items:
            await reply_target.answer("❌ Кошик порожній. Замовлення не оформлено.")
            await state.clear()
            return

        order = await create_order(
            session, user_id=user.id, cart_items=cart_items, comment=comment
        )
        order_id = order.id
        await clear_cart(session, user.id)

    # Перечитуємо замовлення зі всіма зв'язками для форматування
    async with get_session() as session:
        full_order = await get_order_with_items(session, order_id)
        full_user = await get_user_by_tg_id(session, tg_id)

    await state.clear()

    # ── Підтвердження клієнту ─────────────────────────────────────────────────
    builder = InlineKeyboardBuilder()
    builder.button(text="🛍 Продовжити покупки", callback_data="catalog")
    await reply_target.answer(
        f"✅ <b>Замовлення #{full_order.id} оформлено!</b>\n\n"
        f"Ми зв'яжемося з вами найближчим часом. Дякуємо! 🙏",
        reply_markup=builder.as_markup(),
    )

    # ── Сповіщення адміну ────────────────────────────────────────────────────
    admin_text = format_order_for_admin(full_order, full_user)
    try:
        await bot.send_message(chat_id=settings.ADMIN_CHAT_ID, text=admin_text)
    except Exception as e:
        logger.error(f"Не вдалося надіслати замовлення #{order_id} адміну: {e}")


logger.info("Cart router loaded")
