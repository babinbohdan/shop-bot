"""
run_all.py — запускає API сервер і Telegram бота в одному процесі.
Використовується на Railway/продакшн сервері.
"""

import asyncio
import logging
import os

import uvicorn

logger = logging.getLogger(__name__)


async def run_api():
    port = int(os.environ.get("PORT", 8000))
    config = uvicorn.Config(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
    server = uvicorn.Server(config)
    logger.info(f"Starting API on port {port}")
    await server.serve()


async def run_bot():
    from main import main
    logger.info("Starting Telegram bot")
    await main()


async def start():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    from database.db import init_db, get_session
    from database.repo import ensure_welcome_promo
    from config import settings
    await init_db()
    # Переконуємось що вітальний промокод існує в БД
    async with get_session() as session:
        await ensure_welcome_promo(session, settings.WELCOME_PROMO_CODE, settings.WELCOME_PROMO_DISCOUNT)
    await asyncio.gather(run_api(), run_bot())


if __name__ == "__main__":
    asyncio.run(start())
