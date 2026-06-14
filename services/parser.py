"""
services/parser.py — парсер/API-конектор постачальника.

Стратегія:
  1. Намагаємось отримати ціну через JSON API (якщо постачальник надає).
  2. Якщо API немає — парсимо HTML через BeautifulSoup.

Захист від блокування:
  - Випадкова затримка між запитами (jitter)
  - Ротація User-Agent
  - Дотримання розумного інтервалу (задається в config.py)
"""

import asyncio
import logging
import random
from typing import Optional

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ─── User-Agents для ротації ─────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

# ─── Таймаути ────────────────────────────────────────────────────────────────

REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=15)  # секунд


async def fetch_product_info(url: str) -> Optional[dict]:
    """
    Головна функція парсера.
    Повертає словник {"price": float, "in_stock": bool} або None при помилці.

    ВАЖЛИВО: перед реальним використанням адаптуйте CSS-селектори під
    конкретний сайт постачальника.
    """
    # Невелика випадкова затримка (1–4 с) перед кожним запитом
    await asyncio.sleep(random.uniform(1.0, 4.0))

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        async with aiohttp.ClientSession(timeout=REQUEST_TIMEOUT) as session:
            async with session.get(url, headers=headers, ssl=False) as response:
                if response.status != 200:
                    logger.warning(f"HTTP {response.status} for URL: {url}")
                    return None

                content_type = response.headers.get("Content-Type", "")

                # ── JSON API відповідь ────────────────────────────────────────
                if "application/json" in content_type:
                    data = await response.json()
                    return _parse_json_response(data)

                # ── HTML парсинг ──────────────────────────────────────────────
                html = await response.text()
                return _parse_html(html, url)

    except asyncio.TimeoutError:
        logger.error(f"Timeout fetching URL: {url}")
    except aiohttp.ClientError as e:
        logger.error(f"Network error for URL {url}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error parsing {url}: {e}", exc_info=True)

    return None


def _parse_json_response(data: dict) -> Optional[dict]:
    """
    Приклад парсингу JSON-відповіді від API постачальника.
    Адаптуйте ключі під реальну структуру відповіді вашого постачальника.
    """
    try:
        price = float(data.get("price") or data.get("cost") or data.get("Price", 0))
        in_stock = bool(data.get("available") or data.get("in_stock") or data.get("qty", 0) > 0)
        return {"price": price, "in_stock": in_stock}
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Error parsing JSON response: {e}")
        return None


def _parse_html(html: str, url: str) -> Optional[dict]:
    """
    Парсинг HTML сторінки товару.

    ⚠️  CSS-селектори нижче є ПРИКЛАДОМ для типового інтернет-магазину.
        Вам НЕОБХІДНО відкрити DevTools (F12) на сайті постачальника
        та замінити селектори на актуальні для його розмітки.
    """
    try:
        soup = BeautifulSoup(html, "html.parser")

        # ── Ціна ─────────────────────────────────────────────────────────────
        # Приклад: <span class="product-price">1 299,00 грн</span>
        price_tag = (
            soup.select_one(".product-price")         # варіант 1
            or soup.select_one('[data-price]')        # варіант 2 (атрибут data)
            or soup.select_one(".price .current")     # варіант 3
        )

        if price_tag:
            # Якщо ціна в атрибуті data-price
            price_raw = price_tag.get("data-price") or price_tag.get_text(strip=True)
            price = _extract_number(price_raw)
        else:
            logger.warning(f"Price not found on page: {url}")
            price = None

        # ── Наявність ─────────────────────────────────────────────────────────
        # Приклад: <span class="stock-status in-stock">В наявності</span>
        stock_tag = (
            soup.select_one(".stock-status")
            or soup.select_one("[data-availability]")
            or soup.select_one(".availability")
        )

        if stock_tag:
            stock_text = (stock_tag.get("data-availability") or stock_tag.get_text()).lower()
            in_stock = any(kw in stock_text for kw in ("наявності", "є", "in stock", "available"))
        else:
            # Якщо тег не знайдено — вважаємо, що товар є
            in_stock = True

        return {"price": price, "in_stock": in_stock}

    except Exception as e:
        logger.error(f"Error parsing HTML from {url}: {e}", exc_info=True)
        return None


def _extract_number(raw: str) -> Optional[float]:
    """Витягує число з рядка типу '1 299,00 грн' → 1299.0"""
    import re
    # Видаляємо всі нецифрові символи крім крапки та коми
    cleaned = re.sub(r"[^\d.,]", "", raw)
    # Замінюємо кому на крапку
    cleaned = cleaned.replace(",", ".").strip(".")
    # Якщо є кілька крапок — це роздільник тисяч, прибираємо всі крім останньої
    parts = cleaned.split(".")
    if len(parts) > 2:
        cleaned = "".join(parts[:-1]) + "." + parts[-1]
    try:
        return float(cleaned)
    except ValueError:
        return None
