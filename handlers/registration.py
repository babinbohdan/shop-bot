"""
handlers/registration.py — покрокова реєстрація нового користувача (FSM).

Кроки:
  1. /start → просимо поділитися контактом (кнопка request_contact)
  2. Отримали контакт → зберігаємо телефон, питаємо ПІБ
  3. Ввели ПІБ → питаємо місто
  4. Ввели місто → питаємо спосіб доставки (inline-кнопки)
  5. Обрали доставку → реєстрація завершена, показуємо меню
"""

import logging

from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    KeyboardButton, Message, ReplyKeyboardMarkup, ReplyKeyboardRemove,
    CallbackQuery,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder

from database.db import get_session
from database.repo import create_user, get_user_by_tg_id, update_user_registration
from keyboards.main_menu import main_menu_keyboard

logger = logging.getLogger(__name__)
router = Router(name="registration")


# ─── FSM стани ───────────────────────────────────────────────────────────────

class RegistrationStates(StatesGroup):
    waiting_contact = State()
    waiting_name = State()
    waiting_city = State()
    waiting_delivery = State()


# ─── /start ──────────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, message.from_user.id)

    if user and user.is_registered:
        # Уже зареєстрований — показуємо головне меню
        await message.answer(
            f"👋 З поверненням, <b>{user.full_name}</b>!\nОберіть дію з меню нижче:",
            reply_markup=main_menu_keyboard(),
        )
        await state.clear()
        return

    # Новий користувач — починаємо реєстрацію
    contact_btn = KeyboardButton(text="📱 Поділитися номером телефону", request_contact=True)
    kb = ReplyKeyboardMarkup(keyboard=[[contact_btn]], resize_keyboard=True, one_time_keyboard=True)

    await message.answer(
        "👋 Вітаємо в магазині!\n\n"
        "Для початку роботи необхідно пройти швидку реєстрацію.\n"
        "Натисніть кнопку нижче, щоб поділитися номером телефону:",
        reply_markup=kb,
    )
    await state.set_state(RegistrationStates.waiting_contact)


# ─── Крок 1: Отримання контакту ──────────────────────────────────────────────

@router.message(RegistrationStates.waiting_contact, F.contact)
async def handle_contact(message: Message, state: FSMContext) -> None:
    phone = message.contact.phone_number
    # Нормалізуємо номер (прибираємо зайві символи)
    phone = "+" + phone.lstrip("+")

    async with get_session() as session:
        await create_user(session, message.from_user.id, phone)

    await state.update_data(phone=phone)
    await message.answer(
        "✅ Номер збережено!\n\nВведіть ваше <b>ПІБ</b> (наприклад: Іваненко Іван Іванович):",
        reply_markup=ReplyKeyboardRemove(),
    )
    await state.set_state(RegistrationStates.waiting_name)


@router.message(RegistrationStates.waiting_contact)
async def handle_contact_wrong(message: Message) -> None:
    """Якщо користувач написав текст замість натискання кнопки."""
    await message.answer("Будь ласка, скористайтесь кнопкою для відправки контакту ⬆️")


# ─── Крок 2: ПІБ ─────────────────────────────────────────────────────────────

@router.message(RegistrationStates.waiting_name, F.text)
async def handle_name(message: Message, state: FSMContext) -> None:
    full_name = message.text.strip()
    if len(full_name) < 3:
        await message.answer("❌ Ім'я занадто коротке. Введіть повне ПІБ:")
        return

    await state.update_data(full_name=full_name)
    await message.answer(f"Чудово, <b>{full_name}</b>! 🏙 Введіть ваше місто:")
    await state.set_state(RegistrationStates.waiting_city)


# ─── Крок 3: Місто ───────────────────────────────────────────────────────────

@router.message(RegistrationStates.waiting_city, F.text)
async def handle_city(message: Message, state: FSMContext) -> None:
    city = message.text.strip()
    await state.update_data(city=city)

    # Inline-кнопки для вибору доставки
    builder = InlineKeyboardBuilder()
    builder.button(text="🚚 Адресна доставка", callback_data="delivery:delivery")
    builder.button(text="🏪 Самовивіз", callback_data="delivery:pickup")
    builder.adjust(1)

    await message.answer(
        f"📍 Місто: <b>{city}</b>\n\nОберіть спосіб отримання замовлення:",
        reply_markup=builder.as_markup(),
    )
    await state.set_state(RegistrationStates.waiting_delivery)


# ─── Крок 4: Спосіб доставки ─────────────────────────────────────────────────

@router.callback_query(RegistrationStates.waiting_delivery, F.data.startswith("delivery:"))
async def handle_delivery(callback: CallbackQuery, state: FSMContext) -> None:
    delivery_type = callback.data.split(":")[1]  # "delivery" або "pickup"
    delivery_label = "🚚 Адресна доставка" if delivery_type == "delivery" else "🏪 Самовивіз"

    data = await state.get_data()

    async with get_session() as session:
        await update_user_registration(
            session,
            telegram_id=callback.from_user.id,
            full_name=data["full_name"],
            city=data["city"],
            delivery_type=delivery_type,
        )

    await state.clear()
    await callback.message.edit_text(
        f"✅ <b>Реєстрацію завершено!</b>\n\n"
        f"👤 ПІБ: {data['full_name']}\n"
        f"🏙 Місто: {data['city']}\n"
        f"📦 Доставка: {delivery_label}\n\n"
        f"Ласкаво просимо до магазину! 🛍"
    )
    await callback.message.answer(
        "Оберіть дію з меню нижче:",
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


logger.info("Registration router loaded")
