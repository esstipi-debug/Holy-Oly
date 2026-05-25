"""
Social viral analytics · endpoints.

POST /v1/social/screenshots          → loggear probable-screenshot event
GET  /v1/social/screenshots/stats    → métricas agregadas (variant × achievement)

El POST es anónimo opcional (acepta sin auth para no perder eventos en flow
de demo); el GET requiere auth (admin/coach idealmente, por ahora cualquier user).
"""
from fastapi import APIRouter, Depends, Request, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal

from .auth.auth import verify_token
from .auth.jwt_utils import User, decode_token
from ..db import users_repo

router = APIRouter(prefix="/v1/social", tags=["social"])


class ScreenshotEvent(BaseModel):
    card_variant: str = Field(..., max_length=32)
    achievement_type: str = Field(..., max_length=64)
    achievement_id: Optional[str] = Field(None, max_length=64)
    dwell_time_ms: Optional[int] = Field(None, ge=0)
    detection_method: Literal['visibilitychange', 'manual', 'native_ios', 'native_android'] = 'visibilitychange'


async def optional_user(request: Request) -> Optional[str]:
    """Devuelve user_id si hay Bearer válido, sino None. No falla."""
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1]
    data = decode_token(token)
    return data.sub if data else None


@router.post("/screenshots", status_code=status.HTTP_201_CREATED)
async def log_screenshot(
    payload: ScreenshotEvent,
    request: Request,
):
    user_id = await optional_user(request)
    result = await users_repo.log_screenshot(
        user_id=user_id,
        card_variant=payload.card_variant,
        achievement_type=payload.achievement_type,
        achievement_id=payload.achievement_id,
        dwell_time_ms=payload.dwell_time_ms,
        detection_method=payload.detection_method,
    )
    return result
