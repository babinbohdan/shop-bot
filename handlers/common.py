"""
handlers/common.py — загальні хендлери: /help, навігація головного меню.
"""

import logging

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from keyboards.main_menu import main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router(name="common")


@router.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "ℹ️ <b>Довідка</b>\n\n"
        "🛍 Цей бот — ваш особистий магазин.\n\n"
        "Команди:\n"
        "/start — головне меню\n"
        "/help — ця довідка\n\n"
        "Для навігації використовуйте кнопки у меню.",
        reply_markup=main_menu_keyboard(),
    )


@router.callback_query(F.data == "main_menu")
async def show_main_menu(callback: CallbackQuery) -> None:
    await callback.message.edit_text(
        "🏠 <b>Головне меню</b>\n\nОберіть дію:",
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


# Обробка кнопки "🛒 Мій кошик" з ReplyKeyboard → перенаправляємо на inline
@router.message(F.text == "🛒 Кошик")
async def reply_cart(message: Message) -> None:
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    builder.button(text="Відкрити кошик", callback_data="cart")
    await message.answer("Натисніть кнопку нижче:", reply_markup=builder.as_markup())


@router.message(F.text == "🗂 Каталог")
async def reply_catalog(message: Message) -> None:
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    builder.button(text="Відкрити каталог", callback_data="catalog")
    await message.answer("Натисніть кнопку нижче:", reply_markup=builder.as_markup())


logger.info("Common router loaded")
