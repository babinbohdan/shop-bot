"""
api/routes/products.py — ендпоінти каталогу.

GET /api/categories        — список категорій (з кількістю товарів)
GET /api/products          — товари з фільтром і пагінацією
GET /api/products/{id}     — деталі одного товару
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.db import AsyncSessionFactory
from database.models import Category, Product

router = APIRouter(tags=["catalog"])


# ─── Dependency: сесія БД ────────────────────────────────────────────────────

async def get_db():
    async with AsyncSessionFactory() as session:
        yield session


# ─── Pydantic схеми відповідей ───────────────────────────────────────────────

class CategoryOut(BaseModel):
    id: int
    name: str
    product_count: int

    class Config:
        from_attributes = True


class ProductListItem(BaseModel):
    id: int
    name: str
    price: float
    old_price: float | None
    image_url: str | None
    in_stock: bool
    vendor: str | None

    class Config:
        from_attributes = True


class ProductDetail(ProductListItem):
    description: str
    category_id: int
    category_name: str
    barcode: str | None
    supplier_id: int | None


class ProductsResponse(BaseModel):
    items: list[ProductListItem]
    total: int
    page: int
    pages: int
    per_page: int


# ─── GET /api/categories ─────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryOut])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    Повертає список активних категорій з кількістю доступних товарів.
    Сортування: за кількістю товарів (спадання) — найпопулярніші зверху.
    """
    result = await db.execute(
        select(
            Category.id,
            Category.name,
            func.count(Product.id).label("product_count"),
        )
        .join(Product, Product.category_id == Category.id, isouter=True)
        .where(
            Category.is_active == True,
            Product.is_active == True,
            Product.in_stock == True,
        )
        .group_by(Category.id, Category.name)
        .having(func.count(Product.id) > 0)
        .order_by(func.count(Product.id).desc())
    )

    rows = result.all()
    return [
        CategoryOut(id=r.id, name=r.name, product_count=r.product_count)
        for r in rows
    ]


# ─── GET /api/products ───────────────────────────────────────────────────────

@router.get("/products", response_model=ProductsResponse)
async def get_products(
    category_id: int = Query(..., description="ID категорії"),
    page: int = Query(1, ge=1, description="Номер сторінки"),
    per_page: int = Query(20, ge=1, le=50, description="Товарів на сторінку"),
    db: AsyncSession = Depends(get_db),
):
    """
    Товари вибраної категорії з пагінацією (по 20 шт).
    Повертає тільки товари в наявності та активні.
    """
    offset = (page - 1) * per_page

    # Загальна кількість для пагінації
    count_result = await db.execute(
        select(func.count(Product.id))
        .where(
            Product.category_id == category_id,
            Product.is_active == True,
            Product.in_stock == True,
        )
    )
    total = count_result.scalar_one()

    # Самі товари
    products_result = await db.execute(
        select(Product)
        .where(
            Product.category_id == category_id,
            Product.is_active == True,
            Product.in_stock == True,
        )
        .order_by(Product.name)
        .offset(offset)
        .limit(per_page)
    )
    products = products_result.scalars().all()

    pages = (total + per_page - 1) // per_page

    return ProductsResponse(
        items=[
            ProductListItem(
                id=p.id,
                name=p.name,
                price=float(p.price),
                old_price=float(p.old_price) if p.old_price else None,
                image_url=p.image_url,
                in_stock=p.in_stock,
                vendor=p.vendor,
            )
            for p in products
        ],
        total=total,
        page=page,
        pages=pages,
        per_page=per_page,
    )


# ─── GET /api/products/{id} ──────────────────────────────────────────────────

@router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Деталі одного товару для сторінки картки."""
    result = await db.execute(
        select(Product, Category.name.label("cat_name"))
        .join(Category, Category.id == Product.category_id)
        .where(Product.id == product_id, Product.is_active == True)
    )
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    p, cat_name = row
    return ProductDetail(
        id=p.id,
        name=p.name,
        price=float(p.price),
        old_price=float(p.old_price) if p.old_price else None,
        image_url=p.image_url,
        in_stock=p.in_stock,
        vendor=p.vendor,
        description=p.description or "",
        category_id=p.category_id,
        category_name=cat_name,
        barcode=p.barcode,
        supplier_id=p.supplier_id,
    )
