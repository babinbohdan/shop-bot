"""
api/routes/promo.py — промокоди.

POST /api/promo/validate  — перевірити промокод і повернути знижку
"""

import json
import logging
import urllib.parse

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from config import settings
from database.db import get_session
from database.repo import get_promo_code

logger = logging.getLogger(__name__)
router = APIRouter(tags=["promo"])


class PromoValidateIn(BaseModel):
    code: str
    order_total: float


class PromoValidateOut(BaseModel):
    valid: bool
    code_id: int | None = None
    discount_type: str | None = None   # "percent" | "fixed"
    discount_value: float | None = None
    discounted_total: float | None = None
    message: str


def _parse_tg_user(init_data: str, bot_token: str) -> dict:
    import hashlib, hmac
    parsed = dict(urllib.parse.parse_qsl(init_data, strict_parsing=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=401, detail="Missing hash")
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        raise HTTPException(status_code=401, detail="Invalid signature")
    user_data = {}
    if "user" in parsed:
        try:
            user_data = json.loads(parsed["user"])
        except Exception:
            pass
    return user_data


@router.post("/promo/validate", response_model=PromoValidateOut)
async def validate_promo(
    body: PromoValidateIn,
    x_telegram_init_data: str = Header(default=""),
):
    """Перевіряє промокод і повертає розраховану знижку."""
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="initData відсутній")
    _parse_tg_user(x_telegram_init_data, settings.BOT_TOKEN)

    if not body.code or len(body.code) < 3:
        return PromoValidateOut(valid=False, message="Введіть промокод")

    async with get_session() as session:
        promo = await get_promo_code(session, body.code)

    if not promo:
        return PromoValidateOut(valid=False, message="Промокод не знайдено або він більше недійсний")

    if float(promo.min_order_amount) > 0 and body.order_total < float(promo.min_order_amount):
        return PromoValidateOut(
            valid=False,
            message=f"Мінімальна сума замовлення для цього промокоду: {float(promo.min_order_amount):.0f} грн",
        )

    # Розраховуємо знижку
    if promo.discount_type == "percent":
        discount_amount = body.order_total * float(promo.discount_value) / 100
    else:
        discount_amount = float(promo.discount_value)

    discounted_total = max(0.0, body.order_total - discount_amount)

    label = (
        f"{float(promo.discount_value):.0f}%"
        if promo.discount_type == "percent"
        else f"{float(promo.discount_value):.0f} грн"
    )

    return PromoValidateOut(
        valid=True,
        code_id=promo.id,
        discount_type=promo.discount_type,
        discount_value=float(promo.discount_value),
        discounted_total=round(discounted_total, 2),
        message=f"Промокод застосовано! Знижка {label}",
    )
