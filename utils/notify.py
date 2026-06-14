"""
utils/notify.py — утиліти для надсилання повідомлень адміну.
Використовується з різних модулів (cart, scheduler, parser).
"""

import logging

from aiogram import Bot
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import settings

logger = logging.getLogger(__name__)


async def notify_admin(bot: Bot, text: str, keyboard=None) -> bool:
    """
    Надсилає повідомлення адміну.
    Повертає True при успіху, False — при помилці.
    """
    try:
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=text,
            reply_markup=keyboard,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to notify admin: {e}")
        return False


async def notify_admin_price_change(
    bot: Bot,
    product_id: int,
    product_name: str,
    old_price: float,
    new_price: float,
) -> None:
    """Сповіщення адміна про зміну ціни постачальника з кнопками вибору."""
    builder = InlineKeyboardBuilder()
    builder.button(
        text="✅ Оновити ціну на вітрині",
        callback_data=f"price_accept:{product_id}:{new_price}",
    )
    builder.button(
        text="⏸ Залишити стару ціну",
        callback_data=f"price_keep:{product_id}",
    )
    builder.adjust(1)

    text = (
        f"⚠️ <b>Зміна ціни постачальника</b>\n\n"
        f"🏷 Товар: <b>{product_name}</b>\n"
        f"💰 Стара ціна: <b>{old_price:.2f} грн</b>\n"
        f"💰 Нова ціна: <b>{new_price:.2f} грн</b>\n\n"
        f"Оновити ціну на вітрині магазину?"
    )
    await notify_admin(bot, text, keyboard=builder.as_markup())


async def notify_admin_stock_change(
    bot: Bot,
    product_name: str,
    in_stock: bool,
) -> None:
    """Сповіщення адміна про зміну наявності товару."""
    icon = "✅" if in_stock else "❌"
    status = "з'явився в наявності" if in_stock else "закінчився"
    await notify_admin(
        bot,
        f"{icon} <b>Зміна наявності</b>\n\nТовар <b>{product_name}</b> {status} у постачальника.",
    )


async def notify_admin_new_order(bot: Bot, order_text: str) -> None:
    """Надсилає адміну інформацію про нове замовлення."""
    await notify_admin(bot, order_text)
