"""
keyboards/main_menu.py — головне меню у вигляді Inline-клавіатури.
Якщо MINI_APP_URL заданий у .env — перша кнопка відкриває Mini App.
"""

from aiogram.types import InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import settings


def main_menu_keyboard() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    if settings.MINI_APP_URL:
        builder.button(
            text="🛍 Відкрити магазин",
            web_app=WebAppInfo(url=settings.MINI_APP_URL),
        )
    else:
        builder.button(text="🗂 Каталог товарів", callback_data="catalog")
        builder.button(text="🛒 Кошик", callback_data="cart")

    builder.adjust(1)
    return builder.as_markup()
