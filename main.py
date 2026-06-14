"""
main.py — точка входу в бот.
Запускає aiogram, реєструє всі роутери, стартує планувальник.
"""

import asyncio

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from config import settings
from handlers import registration, catalog, cart, admin, common
from middlewares.auth import AuthMiddleware
from scheduler.tasks import start_scheduler
from utils.logger import setup_logging, get_logger

# Налаштовуємо логування першим ділом
setup_logging()
logger = get_logger(__name__)


async def main() -> None:
    # 1. Ініціалізація бота та диспетчера (DB ініціалізується в run_all.py)
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=MemoryStorage())

    # 3. Middleware (виконується до кожного хендлера)
    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())

    # 4. Реєстрація роутерів (порядок важливий — від специфічного до загального)
    dp.include_router(common.router)        # /start, /help, reply-кнопки
    dp.include_router(registration.router)  # FSM реєстрації
    dp.include_router(catalog.router)       # каталог / підкатегорії / товари
    dp.include_router(cart.router)          # кошик / оформлення замовлення
    dp.include_router(admin.router)         # адмін-команди та inline-рішення

    # 5. Планувальник задач (публікації + моніторинг цін)
    start_scheduler(bot)

    logger.info(
        f"Bot @{(await bot.get_me()).username} started. "
        f"Admin ID: {settings.ADMIN_CHAT_ID}, Channel: {settings.CHANNEL_ID}"
    )

    # 6. Запуск polling (довга адреса оновлень від Telegram)
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await bot.session.close()
        logger.info("Bot stopped")


if __name__ == "__main__":
    asyncio.run(main())
