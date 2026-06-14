"""
database/db.py — асинхронний двигун SQLAlchemy + фабрика сесій.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import settings
from database.models import Base

logger = logging.getLogger(__name__)

# Один двигун на весь застосунок
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # True — виводити SQL у консоль (тільки для дебагу)
    pool_pre_ping=True,  # перевіряти з'єднання перед використанням
)

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def init_db() -> None:
    """Створює всі таблиці (якщо не існують)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Контекстний менеджер для отримання сесії.
    Використання:
        async with get_session() as session:
            result = await session.execute(...)
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
