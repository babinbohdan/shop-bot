"""
api/routes/products.py — ендпоінти каталогу.

GET /api/categories              — список категорій
GET /api/products                — товари з фільтрами, сортуванням і пагінацією
GET /api/products/search?q=      — повнотекстовий пошук
GET /api/products/{id}           — деталі одного товару
GET /api/products/{id}/similar   — схожі товари тієї ж категорії
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
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
    """Список активних категорій з кількістю товарів (у наявності)."""
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
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    price_min: float | None = Query(None, description="Мінімальна ціна"),
    price_max: float | None = Query(None, description="Максимальна ціна"),
    in_stock_only: bool = Query(True, description="Тільки в наявності"),
    sort: str = Query("name", description="name | price_asc | price_desc | discount"),
    db: AsyncSession = Depends(get_db),
):
    """Товари категорії з фільтрами та сортуванням."""
    conditions = [
        Product.category_id == category_id,
        Product.is_active == True,
    ]
    if in_stock_only:
        conditions.append(Product.in_stock == True)
    if price_min is not None:
        conditions.append(Product.price >= price_min)
    if price_max is not None:
        conditions.append(Product.price <= price_max)

    # Сортування
    if sort == "price_asc":
        order_col = Product.price.asc()
    elif sort == "price_desc":
        order_col = Product.price.desc()
    elif sort == "discount":
        # Товари зі знижкою спочатку (old_price IS NOT NULL), потім за % знижки
        order_col = (
            (Product.old_price.isnot(None)).desc(),
        )
        # Для PostgreSQL: NULLS LAST
        order_col = Product.old_price.desc().nulls_last()
    else:
        order_col = Product.name.asc()

    offset = (page - 1) * per_page

    count_result = await db.execute(
        select(func.count(Product.id)).where(*conditions)
    )
    total = count_result.scalar_one()

    products_result = await db.execute(
        select(Product)
        .where(*conditions)
        .order_by(order_col)
        .offset(offset)
        .limit(per_page)
    )
    products = products_result.scalars().all()

    pages = max(1, (total + per_page - 1) // per_page)

    return ProductsResponse(
        items=[_to_list_item(p) for p in products],
        total=total,
        page=page,
        pages=pages,
        per_page=per_page,
    )


# ─── GET /api/products/search ────────────────────────────────────────────────
# ВАЖЛИВО: цей роут повинен бути ПЕРЕД /{product_id}

@router.get("/products/search", response_model=ProductsResponse)
async def search_products(
    q: str = Query(..., min_length=2, description="Рядок пошуку"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    in_stock_only: bool = Query(True),
    sort: str = Query("name"),
    db: AsyncSession = Depends(get_db),
):
    """Пошук товарів за назвою або брендом."""
    pattern = f"%{q}%"
    conditions = [
        Product.is_active == True,
        or_(
            Product.name.ilike(pattern),
            Product.vendor.ilike(pattern),
        ),
    ]
    if in_stock_only:
        conditions.append(Product.in_stock == True)

    if sort == "price_asc":
        order_col = Product.price.asc()
    elif sort == "price_desc":
        order_col = Product.price.desc()
    else:
        order_col = Product.name.asc()

    offset = (page - 1) * per_page

    count_result = await db.execute(
        select(func.count(Product.id)).where(*conditions)
    )
    total = count_result.scalar_one()

    products_result = await db.execute(
        select(Product)
        .where(*conditions)
        .order_by(order_col)
        .offset(offset)
        .limit(per_page)
    )
    products = products_result.scalars().all()

    pages = max(1, (total + per_page - 1) // per_page)

    return ProductsResponse(
        items=[_to_list_item(p) for p in products],
        total=total,
        page=page,
        pages=pages,
        per_page=per_page,
    )


# ─── GET /api/products/{id} ──────────────────────────────────────────────────

@router.get("/products/{product_id}", response_model=ProductDetail)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Деталі одного товару."""
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


# ─── GET /api/products/{id}/similar ─────────────────────────────────────────

@router.get("/products/{product_id}/similar", response_model=list[ProductListItem])
async def get_similar_products(product_id: int, db: AsyncSession = Depends(get_db)):
    """Схожі товари тієї ж категорії (6 штук)."""
    # Знаходимо категорію поточного товару
    prod_result = await db.execute(
        select(Product.category_id).where(Product.id == product_id, Product.is_active == True)
    )
    row = prod_result.first()
    if not row:
        return []

    category_id = row[0]

    result = await db.execute(
        select(Product)
        .where(
            Product.category_id == category_id,
            Product.id != product_id,
            Product.is_active == True,
            Product.in_stock == True,
        )
        .order_by(func.random())
        .limit(6)
    )
    return [_to_list_item(p) for p in result.scalars().all()]


# ─── Хелпер ──────────────────────────────────────────────────────────────────

def _to_list_item(p: Product) -> ProductListItem:
    return ProductListItem(
        id=p.id,
        name=p.name,
        price=float(p.price),
        old_price=float(p.old_price) if p.old_price else None,
        image_url=p.image_url,
        in_stock=p.in_stock,
        vendor=p.vendor,
    )
