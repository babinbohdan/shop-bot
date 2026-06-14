"""
scripts/import_csv.py — імпорт 19 980 товарів з CSV постачальника у PostgreSQL.

Логіка:
  1. Читаємо CSV батчами по 500 рядків (не навантажуємо RAM)
  2. Будуємо дерево категорій (166 унікальних) — один раз
  3. Upsert товарів по supplier_id — безпечно запускати повторно

Запуск:
    python -m scripts.import_csv --file prom_csv.csv
    python -m scripts.import_csv --file prom_csv.csv --dry-run   # тільки перевірка
"""

import argparse
import asyncio
import logging
import sys
import time
from pathlib import Path

import pandas as pd
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Додаємо корінь проєкту до path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database.db import get_session, init_db
from database.models import Category, Product

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

BATCH_SIZE = 500  # рядків за одну транзакцію


# ─── Читання та нормалізація CSV ─────────────────────────────────────────────

def load_csv(filepath: str) -> pd.DataFrame:
    """Читає CSV, нормалізує колонки, прибирає сміття."""
    logger.info(f"Reading CSV: {filepath}")

    # utf-8-sig автоматично прибирає BOM (\ufeff) на початку файлу
    df = pd.read_csv(filepath, sep=None, engine="python", encoding="utf-8-sig")

    # Додатково прибираємо лапки з назв колонок (на випадок якщо є)
    df.columns = [c.strip().strip('"') for c in df.columns]

    logger.info(f"Columns found: {list(df.columns[:5])}")

    # Визначаємо колонку з назвою товару (перша або друга)
    name_col = None
    for candidate in ["Название_позиции", df.columns[1], df.columns[0]]:
        if candidate in df.columns:
            name_col = candidate
            break
    if name_col is None:
        raise ValueError(f"Не знайдено колонку з назвою товару. Колонки: {list(df.columns)}")
    logger.info(f"Using name column: {name_col}")

    # Укр. назва категорії (col.1) якщо є, інакше рос. (col)
    cat_col1 = "Наименование_категории"
    cat_col2 = "Наименование_категории.1"
    if cat_col2 in df.columns:
        df["category_ua"] = df[cat_col2].fillna(df[cat_col1])
    else:
        df["category_ua"] = df[cat_col1]
    df["category_ru"] = df[cat_col1]

    # Фільтруємо некоректні рядки
    df = df[df["Цена"] > 0].copy()
    df = df[df[name_col].notna()].copy()

    # Зберігаємо стандартну назву для решти коду
    if name_col != "Название_позиции":
        df["Название_позиции"] = df[name_col]

    logger.info(f"Loaded {len(df)} valid rows")
    return df


# ─── Побудова дерева категорій ───────────────────────────────────────────────

async def sync_categories(df: pd.DataFrame, dry_run: bool) -> dict[int, int]:
    """
    Створює категорії з supplier_group_id.
    Повертає словник {supplier_group_id: category.id}.
    """
    # Унікальні пари: group_id -> (ua_name, ru_name)
    groups = (
        df[["Идентификатор_группы", "category_ua", "category_ru"]]
        .drop_duplicates(subset=["Идентификатор_группы"])
        .sort_values("category_ua")
    )

    logger.info(f"Found {len(groups)} unique categories")

    if dry_run:
        logger.info("[DRY RUN] Would create categories — skipping DB write")
        return {}

    group_to_db_id: dict[int, int] = {}

    async with get_session() as session:
        for _, row in groups.iterrows():
            supplier_gid = int(row["Идентификатор_группы"])
            name_ua = str(row["category_ua"]).strip()
            name_ru = str(row["category_ru"]).strip()

            # Шукаємо існуючу
            result = await session.execute(
                select(Category).where(Category.supplier_group_id == supplier_gid)
            )
            cat = result.scalar_one_or_none()

            if cat is None:
                cat = Category(
                    supplier_group_id=supplier_gid,
                    name=name_ua,
                    name_ru=name_ru if name_ru != name_ua else None,
                    is_active=True,
                )
                session.add(cat)
                await session.flush()

            group_to_db_id[supplier_gid] = cat.id

    logger.info(f"Categories synced: {len(group_to_db_id)}")
    return group_to_db_id


# ─── Імпорт товарів батчами ──────────────────────────────────────────────────

async def import_products(
    df: pd.DataFrame,
    group_to_db_id: dict[int, int],
    dry_run: bool,
) -> tuple[int, int, int]:
    """
    Upsert товарів пакетами по BATCH_SIZE.
    Повертає (inserted, updated, skipped).
    """
    inserted = updated = skipped = 0
    total = len(df)
    start = time.time()

    for batch_start in range(0, total, BATCH_SIZE):
        batch = df.iloc[batch_start : batch_start + BATCH_SIZE]

        rows_to_upsert = []
        for _, row in batch.iterrows():
            supplier_id = int(row["Идентификатор_товара"])
            group_id = int(row["Идентификатор_группы"])
            category_db_id = group_to_db_id.get(group_id)

            if category_db_id is None:
                skipped += 1
                continue

            # Формуємо рядок для upsert
            rows_to_upsert.append({
                "supplier_id": supplier_id,
                "category_id": category_db_id,
                "name": str(row["Название_позиции"]).strip()[:300],
                "description": "",  # в CSV немає окремого опису
                "vendor": str(row["vendor"]).strip()[:100] if pd.notna(row.get("vendor")) else None,
                "barcode": str(row["Штрихкод"]).strip()[:100] if pd.notna(row.get("Штрихкод")) else None,
                "price": float(row["Цена"]),
                "old_price": float(row["Старая_цена"]) if pd.notna(row.get("Старая_цена")) and float(row.get("Старая_цена", 0)) > 0 else None,
                "image_url": str(row["Ссылка_изображения"]).strip() if pd.notna(row.get("Ссылка_изображения")) else None,
                "weight": float(row["Вес"]) if pd.notna(row.get("Вес")) else None,
                "in_stock": str(row["Наличие"]).strip() == "+",
                "is_active": True,
                "supplier_url": f"https://igrushki7.ua/product/{supplier_id}",
            })

        if not rows_to_upsert or dry_run:
            if dry_run:
                logger.info(f"[DRY RUN] Batch {batch_start}–{batch_start + len(batch)}: {len(rows_to_upsert)} rows would be upserted")
            skipped += len(batch) - len(rows_to_upsert)
            continue

        # PostgreSQL upsert: INSERT ... ON CONFLICT (supplier_id) DO UPDATE
        async with get_session() as session:
            stmt = pg_insert(Product).values(rows_to_upsert)
            stmt = stmt.on_conflict_do_update(
                index_elements=["supplier_id"],
                set_={
                    "price": stmt.excluded.price,
                    "old_price": stmt.excluded.old_price,
                    "in_stock": stmt.excluded.in_stock,
                    "image_url": stmt.excluded.image_url,
                    "category_id": stmt.excluded.category_id,
                    "updated_at": func_now(),
                },
            )
            result = await session.execute(stmt)
            # rowcount не розрізняє insert/update у PostgreSQL upsert,
            # але для логування достатньо загальної кількості
            inserted += len(rows_to_upsert)

        pct = (batch_start + len(batch)) / total * 100
        elapsed = time.time() - start
        logger.info(f"Progress: {batch_start + len(batch)}/{total} ({pct:.0f}%) | {elapsed:.1f}s")

    return inserted, updated, skipped


def func_now():
    """SQLAlchemy func.now() для використання в dict."""
    from sqlalchemy import func
    return func.now()


# ─── SQLite fallback (якщо PostgreSQL недоступний) ───────────────────────────

async def import_products_sqlite(
    df: pd.DataFrame,
    group_to_db_id: dict[int, int],
    dry_run: bool,
) -> tuple[int, int, int]:
    """
    Версія для SQLite — без pg_insert, використовує merge-логіку через ORM.
    Повільніше, але працює локально без PostgreSQL.
    """
    inserted = updated = skipped = 0
    total = len(df)
    start = time.time()

    for batch_start in range(0, total, BATCH_SIZE):
        batch = df.iloc[batch_start : batch_start + BATCH_SIZE]

        if dry_run:
            logger.info(f"[DRY RUN] Batch {batch_start}: {len(batch)} rows")
            continue

        async with get_session() as session:
            for _, row in batch.iterrows():
                supplier_id = int(row["Идентификатор_товара"])
                group_id = int(row["Идентификатор_группы"])
                category_db_id = group_to_db_id.get(group_id)

                if category_db_id is None:
                    skipped += 1
                    continue

                result = await session.execute(
                    select(Product).where(Product.supplier_id == supplier_id)
                )
                product = result.scalar_one_or_none()

                price = float(row["Цена"])
                old_price_raw = row.get("Старая_цена")
                old_price = float(old_price_raw) if pd.notna(old_price_raw) and float(old_price_raw) > 0 else None

                if product is None:
                    product = Product(
                        supplier_id=supplier_id,
                        category_id=category_db_id,
                        name=str(row["Название_позиции"]).strip()[:300],
                        vendor=str(row["vendor"]).strip()[:100] if pd.notna(row.get("vendor")) else None,
                        barcode=str(row["Штрихкод"]).strip()[:100] if pd.notna(row.get("Штрихкод")) else None,
                        price=price,
                        old_price=old_price,
                        image_url=str(row["Ссылка_изображения"]).strip() if pd.notna(row.get("Ссылка_изображения")) else None,
                        weight=float(row["Вес"]) if pd.notna(row.get("Вес")) else None,
                        in_stock=str(row["Наличие"]).strip() == "+",
                        supplier_url=f"https://igrushki7.ua/product/{supplier_id}",
                    )
                    session.add(product)
                    inserted += 1
                else:
                    # Оновлюємо тільки ціну та наявність для існуючих
                    product.price = price
                    product.old_price = old_price
                    product.in_stock = str(row["Наличие"]).strip() == "+"
                    updated += 1

        pct = (batch_start + len(batch)) / total * 100
        logger.info(f"Progress: {batch_start + len(batch)}/{total} ({pct:.0f}%) | {time.time()-start:.1f}s")

    return inserted, updated, skipped


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main(filepath: str, dry_run: bool, use_sqlite: bool) -> None:
    await init_db()

    df = load_csv(filepath)
    group_to_db_id = await sync_categories(df, dry_run)

    if use_sqlite:
        logger.info("Using SQLite-compatible import (slower but works without PostgreSQL)")
        ins, upd, skip = await import_products_sqlite(df, group_to_db_id, dry_run)
    else:
        ins, upd, skip = await import_products(df, group_to_db_id, dry_run)

    logger.info("=" * 50)
    logger.info(f"DONE {'[DRY RUN] ' if dry_run else ''}")
    logger.info(f"  Inserted/updated : {ins}")
    logger.info(f"  Skipped          : {skip}")
    logger.info(f"  Categories       : {len(group_to_db_id)}")
    logger.info("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import supplier CSV into DB")
    parser.add_argument("--file", default="prom_csv.csv", help="Path to CSV file")
    parser.add_argument("--dry-run", action="store_true", help="Parse only, no DB writes")
    parser.add_argument("--sqlite", action="store_true", help="Use SQLite-compatible mode")
    args = parser.parse_args()

    asyncio.run(main(args.file, args.dry_run, args.sqlite))
