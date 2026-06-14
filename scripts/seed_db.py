"""
scripts/seed_db.py — заповнення бази тестовими даними.

Запуск:
    python -m scripts.seed_db

Створює:
  - 3 категорії (Електроніка, Аксесуари, Техніка для дому) з підкатегоріями
  - 6 тестових товарів з різними цінами
"""

import asyncio
import sys
from pathlib import Path

# Додаємо кореневу директорію до sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.db import init_db
from database.models import Category, Product
from database.db import get_session


SEED_DATA = {
    "categories": [
        # (name, parent_name_or_None)
        ("Електроніка", None),
        ("Аксесуари", None),
        ("Техніка для дому", None),
        ("Смартфони", "Електроніка"),
        ("Ноутбуки", "Електроніка"),
        ("Навушники", "Аксесуари"),
        ("Кабелі та зарядки", "Аксесуари"),
    ],
    "products": [
        # (name, category_name, price, description, supplier_url)
        (
            "iPhone 15 128GB Black",
            "Смартфони",
            39_990.0,
            "Смартфон Apple iPhone 15, 128 ГБ, колір Чорний. "
            "Чіп A16 Bionic, Dynamic Island, USB-C.",
            "https://example-supplier.com/product/iphone-15-black",
        ),
        (
            "Samsung Galaxy S24 256GB",
            "Смартфони",
            32_500.0,
            "Флагман Samsung Galaxy S24, 256 ГБ. "
            "7 років оновлень Android, Galaxy AI.",
            "https://example-supplier.com/product/s24-256",
        ),
        (
            "MacBook Air M3 13\" 8/256",
            "Ноутбуки",
            54_999.0,
            "Ультратонкий ноутбук Apple MacBook Air з чіпом M3. "
            "До 18 годин автономної роботи.",
            "https://example-supplier.com/product/macbook-air-m3",
        ),
        (
            "AirPods Pro 2-го покоління",
            "Навушники",
            9_490.0,
            "Бездротові навушники Apple з активним шумопоглинанням. "
            "Просторовий звук, чіп H2.",
            "https://example-supplier.com/product/airpods-pro-2",
        ),
        (
            "Кабель USB-C to Lightning 1м",
            "Кабелі та зарядки",
            490.0,
            "Оригінальний кабель Apple. MFi-сертифікований. Довжина 1 метр.",
            None,
        ),
        (
            "Зарядний пристрій 20W USB-C",
            "Кабелі та зарядки",
            890.0,
            "Швидка зарядка 20W. Підтримує PD 3.0. "
            "Сумісний з iPhone 8 і новішими моделями.",
            None,
        ),
    ],
}


async def seed() -> None:
    await init_db()
    print("⏳ Заповнення бази тестовими даними...")

    async with get_session() as session:
        # ── Категорії ─────────────────────────────────────────────────────────
        name_to_cat: dict[str, Category] = {}

        # Спочатку кореневі
        for name, parent_name in SEED_DATA["categories"]:
            if parent_name is not None:
                continue
            cat = Category(name=name)
            session.add(cat)
            await session.flush()
            name_to_cat[name] = cat
            print(f"  ✅ Категорія: {name}")

        # Потім підкатегорії
        for name, parent_name in SEED_DATA["categories"]:
            if parent_name is None:
                continue
            parent = name_to_cat.get(parent_name)
            cat = Category(name=name, parent_id=parent.id if parent else None)
            session.add(cat)
            await session.flush()
            name_to_cat[name] = cat
            print(f"  ✅ Підкатегорія: {name} → {parent_name}")

        # ── Товари ────────────────────────────────────────────────────────────
        for name, cat_name, price, description, supplier_url in SEED_DATA["products"]:
            cat = name_to_cat.get(cat_name)
            if not cat:
                print(f"  ⚠️  Категорію '{cat_name}' не знайдено, пропускаємо товар '{name}'")
                continue

            product = Product(
                category_id=cat.id,
                name=name,
                description=description,
                price=price,
                supplier_url=supplier_url,
                in_stock=True,
            )
            session.add(product)
            print(f"  🛍 Товар: {name} ({price:.2f} грн)")

    print("\n✅ База даних успішно заповнена!")


if __name__ == "__main__":
    asyncio.run(seed())
