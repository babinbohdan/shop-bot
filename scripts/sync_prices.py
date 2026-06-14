"""
scripts/sync_prices.py — синхронізація цін та наявності з igrushki7.ua.

Стратегія (анти-бан):
  - Перевіряємо лише товари з supplier_url (є supplier_id)
  - Пакети по 30 товарів, пауза 3–7 с між запитами
  - Повний цикл раз на 3 години (задається в .env)
  - При помилці 429/503 — exponential backoff (чекаємо 5, 10, 20 хв)
  - Зберігаємо лише ціну та наявність — НЕ чіпаємо назву/фото/опис

Запуск як окремий процес (не через APScheduler):
    python -m scripts.sync_prices

Або через APScheduler з main.py — залежить від вашого вибору.
"""

import asyncio
import logging
import random
import sys
import time
from pathlib import Path

import aiohttp
from bs4 import BeautifulSoup
from sqlalchemy import select, update

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings
from database.db import get_session, init_db
from database.models import Product

logger = logging.getLogger(__name__)

# ─── Налаштування ────────────────────────────────────────────────────────────

BATCH_SIZE = 30              # товарів за одну ітерацію
MIN_DELAY = 3.0              # мін. пауза між запитами (сек)
MAX_DELAY = 7.0              # макс. пауза
BACKOFF_CODES = {429, 503}   # коди для паузи
MAX_RETRIES = 3

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]


# ─── HTTP запит з retry ───────────────────────────────────────────────────────

async def fetch_page(session: aiohttp.ClientSession, url: str) -> str | None:
    """
    Завантажує HTML сторінки товару.
    При помилці 429/503 — очікує з exponential backoff.
    """
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "uk-UA,uk;q=0.9",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    return await resp.text()

                if resp.status in BACKOFF_CODES:
                    wait = (2 ** attempt) * 300  # 5хв, 10хв, 20хв
                    logger.warning(f"HTTP {resp.status} for {url}. Waiting {wait//60} min...")
                    await asyncio.sleep(wait)
                    continue

                logger.warning(f"HTTP {resp.status} for {url} — skipping")
                return None

        except asyncio.TimeoutError:
            logger.error(f"Timeout for {url} (attempt {attempt+1})")
        except aiohttp.ClientError as e:
            logger.error(f"Network error for {url}: {e}")

        await asyncio.sleep(MIN_DELAY * (attempt + 1))

    return None


# ─── Парсинг ціни та наявності з HTML ────────────────────────────────────────

def parse_price_and_stock(html: str) -> dict | None:
    """
    Парсить ціну та наявність зі сторінки igrushki7.ua.

    ⚠️ CSS-селектори можуть змінитися при оновленні сайту.
       Перевіряйте їх у DevTools (F12) якщо парсер перестане працювати.
    """
    try:
        soup = BeautifulSoup(html, "lxml")

        # ── Ціна ─────────────────────────────────────────────────────────────
        # Варіант 1: мета-тег (найнадійніший)
        meta_price = soup.find("meta", {"itemprop": "price"})
        if meta_price and meta_price.get("content"):
            price = _to_float(meta_price["content"])
        else:
            # Варіант 2: span з ціною
            price_el = (
                soup.select_one(".price-value")
                or soup.select_one("[class*='price']")
                or soup.select_one(".product-price")
            )
            price = _to_float(price_el.get_text()) if price_el else None

        # ── Наявність ─────────────────────────────────────────────────────────
        # Варіант 1: мета-тег availability
        meta_avail = soup.find("meta", {"itemprop": "availability"})
        if meta_avail:
            avail_content = meta_avail.get("content", "").lower()
            in_stock = "instock" in avail_content or "in_stock" in avail_content
        else:
            # Варіант 2: текст статусу
            stock_el = soup.select_one(".product-availability, .stock-status, [class*='avail']")
            if stock_el:
                stock_text = stock_el.get_text().lower()
                in_stock = any(w in stock_text for w in ("є в наявності", "в наявності", "instock", "є"))
            else:
                in_stock = True  # якщо не знайдено — вважаємо є

        if price is None:
            return None

        return {"price": price, "in_stock": in_stock}

    except Exception as e:
        logger.error(f"Parse error: {e}", exc_info=True)
        return None


def _to_float(raw: str) -> float | None:
    """'1 299,00 грн' → 1299.0"""
    import re
    cleaned = re.sub(r"[^\d.,]", "", str(raw))
    cleaned = cleaned.replace(",", ".")
    parts = cleaned.split(".")
    if len(parts) > 2:
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


# ─── Основний цикл синхронізації ─────────────────────────────────────────────

async def sync_prices(bot=None) -> None:
    """
    Перебирає всі товари з supplier_url і оновлює ціну/наявність.
    bot — якщо передано, надсилає сповіщення адміну про зміни.
    """
    logger.info("Starting price sync...")
    t_start = time.time()
    changed_prices = 0
    changed_stock = 0
    errors = 0

    # Завантажуємо список товарів для перевірки
    async with get_session() as session:
        result = await session.execute(
            select(Product.id, Product.supplier_id, Product.name,
                   Product.price, Product.in_stock, Product.supplier_url)
            .where(Product.supplier_url.isnot(None), Product.is_active == True)
        )
        products = result.all()

    logger.info(f"Products to check: {len(products)}")

    async with aiohttp.ClientSession() as http_session:
        for i, prod in enumerate(products):
            # Затримка між запитами (анти-бан)
            await asyncio.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

            html = await fetch_page(http_session, prod.supplier_url)
            if html is None:
                errors += 1
                continue

            info = parse_price_and_stock(html)
            if info is None:
                errors += 1
                continue

            new_price = info["price"]
            new_stock = info["in_stock"]
            old_price = float(prod.price)

            price_changed = abs(new_price - old_price) > 0.01
            stock_changed = new_stock != prod.in_stock

            if not price_changed and not stock_changed:
                continue

            # Оновлюємо БД
            async with get_session() as session:
                from datetime import datetime
                await session.execute(
                    update(Product)
                    .where(Product.id == prod.id)
                    .values(
                        supplier_price=new_price,
                        in_stock=new_stock,
                        price_updated_at=datetime.now(),
                    )
                )

            # Сповіщення адміну
            if bot and price_changed:
                changed_prices += 1
                await _notify_price_change(bot, prod, old_price, new_price)

            if bot and stock_changed:
                changed_stock += 1
                await _notify_stock_change(bot, prod, new_stock)

            # Прогрес кожні 100 товарів
            if (i + 1) % 100 == 0:
                elapsed = time.time() - t_start
                logger.info(f"Checked {i+1}/{len(products)} | "
                            f"price changes: {changed_prices} | "
                            f"stock changes: {changed_stock} | "
                            f"errors: {errors} | {elapsed:.0f}s")

    elapsed = time.time() - t_start
    logger.info(f"Sync complete in {elapsed:.0f}s | "
                f"price changes: {changed_prices} | "
                f"stock: {changed_stock} | errors: {errors}")


async def _notify_price_change(bot, prod, old_price: float, new_price: float) -> None:
    """Сповіщає адміна про зміну ціни з кнопками вибору."""
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Оновити ціну", callback_data=f"price_accept:{prod.id}:{new_price}")
    builder.button(text="⏸ Залишити стару", callback_data=f"price_keep:{prod.id}")
    builder.adjust(1)

    try:
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=(
                f"⚠️ <b>Зміна ціни</b>\n\n"
                f"🏷 {prod.name[:80]}\n"
                f"💰 Стара: <b>{old_price:.2f} грн</b>\n"
                f"💰 Нова: <b>{new_price:.2f} грн</b>"
            ),
            reply_markup=builder.as_markup(),
        )
    except Exception as e:
        logger.error(f"Failed to notify admin about price change: {e}")


async def _notify_stock_change(bot, prod, in_stock: bool) -> None:
    """Сповіщає адміна про зміну наявності."""
    icon = "✅" if in_stock else "❌"
    status = "з'явився" if in_stock else "закінчився"
    try:
        await bot.send_message(
            chat_id=settings.ADMIN_CHAT_ID,
            text=f"{icon} <b>{prod.name[:80]}</b>\n{status} у постачальника",
        )
    except Exception as e:
        logger.error(f"Failed to notify stock change: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(init_db())
    asyncio.run(sync_prices())
