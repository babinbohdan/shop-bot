"""
scheduler/tasks.py — APScheduler задачі:
  1. Щоденна публікація товару в канал (daily_channel_post)
  2. Моніторинг цін постачальника (check_supplier_prices)
"""

import logging
import random

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from config import settings

logger = logging.getLogger(__name__)
_scheduler = AsyncIOScheduler(timezone="Europe/Kyiv")


def start_scheduler(bot) -> None:
    """Реєструє задачі та запускає планувальник."""

    # Задача 1: щоденний пост у канал
    _scheduler.add_job(
        daily_channel_post,
        trigger=CronTrigger(hour=settings.DAILY_POST_HOUR, minute=settings.DAILY_POST_MINUTE),
        args=[bot],
        id="daily_post",
        replace_existing=True,
    )

    # Задача 2: перевірка цін постачальника
    _scheduler.add_job(
        check_supplier_prices,
        trigger=IntervalTrigger(minutes=settings.PARSER_INTERVAL_MINUTES),
        args=[bot],
        id="price_monitor",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info(
        f"Scheduler started. Daily post at {settings.DAILY_POST_HOUR}:{settings.DAILY_POST_MINUTE:02d}, "
        f"price check every {settings.PARSER_INTERVAL_MINUTES} min."
    )


# ─── Задача 1: публікація в канал ────────────────────────────────────────────

async def daily_channel_post(bot) -> None:
    """
    Вибирає випадковий активний товар і публікує його у канал.
    Формат: Фото + підпис з описом, ціною, наявністю + кнопка "Придбати".
    """
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from database.db import get_session
    from database.repo import get_all_active_products

    logger.info("Running daily_channel_post task")

    try:
        async with get_session() as session:
            products = await get_all_active_products(session)
            # Беремо тільки товари, що є в наявності
            available = [p for p in products if p.in_stock]

        if not available:
            logger.warning("No available products for daily post")
            return

        product = random.choice(available)
        stock_text = "✅ Є в наявності" if product.in_stock else "❌ Немає в наявності"

        caption = (
            f"🛍 <b>{product.name}</b>\n\n"
            f"{product.description}\n\n"
            f"💰 Ціна: <b>{product.price} грн</b>\n"
            f"{stock_text}"
        )

        # Кнопка "Придбати" веде напряму на бота
        builder = InlineKeyboardBuilder()
        builder.button(
            text="🛒 Придбати",
            url=f"https://t.me/{(await bot.get_me()).username}?start=product_{product.id}",
        )

        if product.photo_file_id:
            await bot.send_photo(
                chat_id=settings.CHANNEL_ID,
                photo=product.photo_file_id,
                caption=caption,
                reply_markup=builder.as_markup(),
            )
        else:
            await bot.send_message(
                chat_id=settings.CHANNEL_ID,
                text=caption,
                reply_markup=builder.as_markup(),
            )

        logger.info(f"Channel post published: product #{product.id} '{product.name}'")

    except Exception as e:
        logger.error(f"Error in daily_channel_post: {e}", exc_info=True)


# ─── Задача 2: моніторинг цін ────────────────────────────────────────────────

async def check_supplier_prices(bot) -> None:
    """
    Перебирає всі товари з supplier_url, парсить актуальну ціну/наявність
    і порівнює з тією, що є в БД.
    При зміні — сповіщає адміна.
    """
    from database.db import get_session
    from database.repo import (
        get_all_active_products, update_product_supplier_price, set_product_stock,
    )
    from services.parser import fetch_product_info

    logger.info("Running check_supplier_prices task")

    try:
        async with get_session() as session:
            products = await get_all_active_products(session)
            # Фільтруємо лише ті, у яких є URL постачальника
            to_check = [p for p in products if p.supplier_url]

        for product in to_check:
            try:
                info = await fetch_product_info(product.supplier_url)
                if info is None:
                    continue

                new_price = info.get("price")
                in_stock = info.get("in_stock")

                # ── Перевірка ціни ────────────────────────────────────────────
                if new_price is not None:
                    current_supplier_price = float(product.supplier_price or 0)
                    price_changed = abs(new_price - current_supplier_price) > 0.01

                    if price_changed:
                        # Оновлюємо збережену ціну постачальника
                        async with get_session() as session:
                            await update_product_supplier_price(session, product.id, new_price)

                        # Надсилаємо сповіщення адміну з кнопками вибору
                        from aiogram.utils.keyboard import InlineKeyboardBuilder
                        builder = InlineKeyboardBuilder()
                        builder.button(
                            text="✅ Оновити ціну",
                            callback_data=f"price_accept:{product.id}:{new_price}",
                        )
                        builder.button(
                            text="⏸ Залишити стару",
                            callback_data=f"price_keep:{product.id}",
                        )
                        builder.adjust(1)

                        await bot.send_message(
                            chat_id=settings.ADMIN_CHAT_ID,
                            text=(
                                f"⚠️ <b>Змінилася ціна на товар</b>\n\n"
                                f"🏷 Товар: <b>{product.name}</b>\n"
                                f"💰 Стара ціна постачальника: {current_supplier_price} грн\n"
                                f"💰 Нова ціна постачальника: {new_price} грн\n\n"
                                f"Оновити ціну на вітрині?"
                            ),
                            reply_markup=builder.as_markup(),
                        )
                        logger.info(
                            f"Price change detected for product #{product.id}: "
                            f"{current_supplier_price} → {new_price}"
                        )

                # ── Перевірка наявності ───────────────────────────────────────
                if in_stock is not None and in_stock != product.in_stock:
                    async with get_session() as session:
                        await set_product_stock(session, product.id, in_stock)

                    status = "з'явився в наявності ✅" if in_stock else "закінчився ❌"
                    await bot.send_message(
                        chat_id=settings.ADMIN_CHAT_ID,
                        text=f"📦 Товар <b>{product.name}</b> {status} у постачальника.",
                    )
                    logger.info(
                        f"Stock change for product #{product.id}: {product.in_stock} → {in_stock}"
                    )

            except Exception as e:
                logger.error(f"Error checking product #{product.id}: {e}", exc_info=True)

    except Exception as e:
        logger.error(f"Error in check_supplier_prices: {e}", exc_info=True)
