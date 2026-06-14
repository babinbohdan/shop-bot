"""
api/main.py — FastAPI бекенд для Telegram Mini App.

Ендпоінти:
  GET  /api/categories          — дерево категорій
  GET  /api/products            — товари (фільтр по категорії, пагінація)
  GET  /api/products/{id}       — картка одного товару
  POST /api/orders              — оформлення замовлення (з валідацією initData)

Запуск:
  uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.db import init_db
from api.routes.products import router as products_router
from api.routes.orders import router as orders_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ініціалізація БД при старті FastAPI."""
    await init_db()
    yield


app = FastAPI(
    title="Shop Bot API",
    description="Backend для Telegram Mini App магазину іграшок",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — дозволяємо запити з Telegram Web App
# У продакшені замініть "*" на ваш домен
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# API роутери
app.include_router(products_router, prefix="/api")
app.include_router(orders_router, prefix="/api")

# Статичні файли Mini App (React build)
# Nginx в продакшені роздає їх напряму, але для розробки — через FastAPI
try:
    app.mount("/", StaticFiles(directory="mini_app/dist", html=True), name="mini_app")
except Exception:
    pass  # папка ще не існує під час розробки


@app.get("/health")
async def health():
    return {"status": "ok"}
