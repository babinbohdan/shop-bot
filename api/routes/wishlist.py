"""
api/routes/wishlist.py — список бажань.

GET    /api/wishlist               — список товарів у вішлісті
POST   /api/wishlist/{product_id}  — додати товар
DELETE /api/wishlist/{product_id}  — видалити товар
GET    /api/wishlist/ids           — лише ID товарів (для швидкої перевірки ♡)
"""

import hashlib
import hmac
import json
import logging
import urllib.parse

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from config import settings
from database.db import get_session
from database.models import User
from database.repo import (
    add_to_wishlist,
    get_wishlist,
    get_wishlist_product_ids,
    remove_from_wishlist,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["wishlist"])


# ─── Pydantic схеми ──────────────────────────────────────────────────────────

class WishlistProductOut(BaseModel):
    id: int
    name: str
    price: float
    old_price: float | None
    image_url: str | None
    in_stock: bool
    category_name: str | None


# ─── Auth helper ─────────────────────────────────────────────────────────────

def _get_tg_user(init_data: str) -> dict:
    parsed = dict(urllib.parse.parse_qsl(init_data, strict_parsing=False))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash")
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(status_code=401, detail="Invalid signature")
    try:
        return json.loads(parsed.get("user", "{}"))
    except Exception:
        return {}


async def _get_user(tg_id: int) -> User:
    async with get_session() as session:
        result = await session.execute(select(User).where(User.telegram_id == tg_id))
        user = result.scalar_one_or_none()
    if not user or not user.is_registered:
        raise HTTPException(status_code=403, detail="Зареєструйтесь у боті")
    return user


# ─── Ендпоінти ───────────────────────────────────────────────────────────────

@router.get("/wishlist/ids")
async def get_wishlist_ids(
    x_telegram_init_data: str = Header(default=""),
) -> list[int]:
    """Повертає список product_id з вішлісту — для відображення ♡."""
    if not x_telegram_init_data:
        return []
    try:
        tg_user = _get_tg_user(x_telegram_init_data)
        tg_id = tg_user.get("id")
        if not tg_id:
            return []
        user = await _get_user(tg_id)
        async with get_session() as session:
            ids = await get_wishlist_product_ids(session, user.id)
        return list(ids)
    except HTTPException:
        return []


@router.get("/wishlist", response_model=list[WishlistProductOut])
async def get_my_wishlist(
    x_telegram_init_data: str = Header(default=""),
):
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="initData відсутній")
    tg_user = _get_tg_user(x_telegram_init_data)
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=401, detail="ID не знайдено")
    user = await _get_user(tg_id)

    async with get_session() as session:
        items = await get_wishlist(session, user.id)

    result = []
    for item in items:
        p = item.product
        if not p or not p.is_active:
            continue
        result.append(WishlistProductOut(
            id=p.id,
            name=p.name,
            price=float(p.price),
            old_price=float(p.old_price) if p.old_price else None,
            image_url=p.image_url,
            in_stock=p.in_stock,
            category_name=p.category.name if p.category else None,
        ))
    return result


@router.post("/wishlist/{product_id}")
async def add_wishlist_item(
    product_id: int,
    x_telegram_init_data: str = Header(default=""),
):
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="initData відсутній")
    tg_user = _get_tg_user(x_telegram_init_data)
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=401, detail="ID не знайдено")
    user = await _get_user(tg_id)

    async with get_session() as session:
        added = await add_to_wishlist(session, user.id, product_id)

    return {"added": added}


@router.delete("/wishlist/{product_id}")
async def remove_wishlist_item(
    product_id: int,
    x_telegram_init_data: str = Header(default=""),
):
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="initData відсутній")
    tg_user = _get_tg_user(x_telegram_init_data)
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=401, detail="ID не знайдено")
    user = await _get_user(tg_id)

    async with get_session() as session:
        await remove_from_wishlist(session, user.id, product_id)

    return {"removed": True}
