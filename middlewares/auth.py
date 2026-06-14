"""
middlewares/auth.py — перевіряє, чи зареєстрований користувач.
Якщо ні — перенаправляє на /start. Пропускає хендлери реєстрації.
"""

import logging
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

from database.db import get_session
from database.repo import get_user_by_tg_id

logger = logging.getLogger(__name__)

# Стани FSM реєстрації — пропускаємо без перевірки
REGISTRATION_STATES = {
    "RegistrationStates:waiting_contact",
    "RegistrationStates:waiting_name",
    "RegistrationStates:waiting_city",
    "RegistrationStates:waiting_delivery",
}


class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        # Отримуємо telegram_id залежно від типу апдейту
        if isinstance(event, Message):
            tg_id = event.from_user.id if event.from_user else None
            text = event.text or ""
        elif isinstance(event, CallbackQuery):
            tg_id = event.from_user.id
            text = ""
        else:
            return await handler(event, data)

        if tg_id is None:
            return await handler(event, data)

        # /start завжди пропускаємо (щоб почати реєстрацію)
        if text.startswith("/start"):
            return await handler(event, data)

        # Перевіряємо поточний стан FSM — якщо реєстрація, пропускаємо
        state = data.get("state")
        if state:
            current_state = await state.get_state()
            if current_state in REGISTRATION_STATES:
                return await handler(event, data)

        # Перевіряємо БД
        async with get_session() as session:
            user = await get_user_by_tg_id(session, tg_id)

        if not user or not user.is_registered:
            # Надсилаємо повідомлення із запрошенням зареєструватись
            if isinstance(event, Message):
                await event.answer(
                    "⚠️ Щоб користуватися магазином, спочатку пройдіть реєстрацію. Натисніть /start"
                )
            elif isinstance(event, CallbackQuery):
                await event.answer("Спочатку пройдіть реєстрацію: /start", show_alert=True)
            return  # блокуємо подальшу обробку

        # Додаємо user об'єкт у data для хендлерів
        data["db_user"] = user
        return await handler(event, data)
