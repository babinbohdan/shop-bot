"""
handlers/registration.py — покрокова реєстрація нового користувача (FSM).

Кроки:
  1. /start → вітальний банер + опис магазину → просимо поділитися контактом
  2. Отримали контакт → зберігаємо телефон, питаємо ПІБ
  3. Ввели ПІБ → питаємо місто
  4. Ввели місто → питаємо спосіб доставки (inline-кнопки)
  5. Обрали доставку → реєстрація завершена, надсилаємо welcome-промокод + меню
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

from config import settings
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


# ─── Вітальний текст для нових ───────────────────────────────────────────────

WELCOME_NEW = (
    "🧸 <b>Вітаємо у нашому магазині іграшок!</b>\n\n"
    "Ми допомагаємо дітям рости, грати і розвиватися 🌟\n\n"
    "У нас ви знайдете:\n"
    "🪆 Розвивальні та навчальні іграшки\n"
    "🎨 Набори для творчості та малювання\n"
    "🚗 Машинки, конструктори, роботи\n"
    "🎭 Рольові ігри та м'які іграшки\n"
    "🎁 Подарункові набори для будь-якого віку\n\n"
    "Щоб розпочати — пройдіть коротку реєстрацію 👇"
)

WELCOME_BACK = (
    "👋 З поверненням, <b>{name}</b>!\n\n"
    "🛍 Готові до нових покупок?\n"
    "Нові іграшки вже чекають на вас ✨"
)


# ─── /start ──────────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext) -> None:
    async with get_session() as session:
        user = await get_user_by_tg_id(session, message.from_user.id)

    if user and user.is_registered:
        # Постійний користувач — гарне привітання + меню
        await message.answer(
            WELCOME_BACK.format(name=user.full_name.split()[0] if user.full_name else "друже"),
            reply_markup=main_menu_keyboard(),
        )
        await state.clear()
        return

    # Новий користувач — вітальний банер + вступ
    if settings.WELCOME_BANNER_URL:
        await message.answer_photo(
            photo=settings.WELCOME_BANNER_URL,
            caption=WELCOME_NEW,
        )
    else:
        await message.answer(WELCOME_NEW)

    # Просимо поділитися контактом
    contact_btn = KeyboardButton(text="📱 Поділитися номером телефону", request_contact=True)
    kb = ReplyKeyboardMarkup(keyboard=[[contact_btn]], resize_keyboard=True, one_time_keyboard=True)

    await message.answer(
        "⬇️ Натисніть кнопку нижче, щоб передати номер телефону:",
        reply_markup=kb,
    )
    await state.set_state(RegistrationStates.waiting_contact)


# ─── Крок 1: Отримання контакту ──────────────────────────────────────────────

@router.message(RegistrationStates.waiting_contact, F.contact)
async def handle_contact(message: Message, state: FSMContext) -> None:
    phone = message.contact.phone_number
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
    delivery_type = callback.data.split(":")[1]
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

    # Підтвердження реєстрації
    await callback.message.edit_text(
        f"✅ <b>Реєстрацію завершено!</b>\n\n"
        f"👤 ПІБ: {data['full_name']}\n"
        f"🏙 Місто: {data['city']}\n"
        f"📦 Доставка: {delivery_label}\n\n"
        f"Ласкаво просимо до магазину! 🛍"
    )

    # Вітальний подарунок — промокод
    promo = settings.WELCOME_PROMO_CODE
    discount = settings.WELCOME_PROMO_DISCOUNT
    await callback.message.answer(
        f"🎁 <b>Подарунок для вас!</b>\n\n"
        f"Як новому клієнту — дарую промокод на знижку <b>{discount}%</b> на перше замовлення:\n\n"
        f"<code>{promo}</code>\n\n"
        f"Скопіюйте його та введіть у кошику при оформленні! 🛒",
    )

    # Головне меню
    await callback.message.answer(
        "Оберіть дію з меню нижче:",
        reply_markup=main_menu_keyboard(),
    )
    await callback.answer()


logger.info("Registration router loaded")
