"""
Push notifications API.

Endpoints:
- POST   /v1/notifications/subscribe      · upsert PushSubscription del user
- DELETE /v1/notifications/subscribe      · remove por endpoint
- GET    /v1/notifications/vapid-public-key  · VAPID public key del server (no secreto)
- POST   /v1/notifications/test           · admin-only · envía test push al user_id
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/notifications", tags=["notifications"])


# ---------------------------------------------------------------- Models -----

class SubscriptionKeys(BaseModel):
    p256dh: str = Field(..., min_length=1)
    auth: str = Field(..., min_length=1)


class SubscribePayload(BaseModel):
    endpoint: str = Field(..., min_length=1, max_length=2000)
    keys: SubscriptionKeys
    user_agent: Optional[str] = Field(default=None, max_length=500)


class UnsubscribePayload(BaseModel):
    endpoint: str = Field(..., min_length=1, max_length=2000)


class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    endpoint: str
    created_at: Optional[str] = None


class VapidKeyResponse(BaseModel):
    publicKey: str


class TestPayload(BaseModel):
    user_id: str
    title: str = "Test"
    body: str = "Notificación de prueba"


# ---------------------------------------------------------------- Endpoints ---

@router.post("/subscribe", response_model=SubscriptionResponse, status_code=201)
async def subscribe(
    payload: SubscribePayload,
    current_user: User = Depends(verify_token),
):
    """Upsert una PushSubscription por (user_id, endpoint)."""
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(status_code=503, detail="DB no configurada")
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
            VALUES ($1::uuid, $2, $3, $4, $5)
            ON CONFLICT (user_id, endpoint) DO UPDATE
              SET p256dh = EXCLUDED.p256dh,
                  auth = EXCLUDED.auth,
                  user_agent = EXCLUDED.user_agent,
                  last_used_at = NOW()
            RETURNING id, user_id, endpoint, created_at
            """,
            current_user.id,
            payload.endpoint,
            payload.keys.p256dh,
            payload.keys.auth,
            payload.user_agent,
        )
        return SubscriptionResponse(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            endpoint=row["endpoint"],
            created_at=str(row["created_at"]) if row["created_at"] else None,
        )


@router.delete("/subscribe", status_code=204)
async def unsubscribe(
    payload: UnsubscribePayload,
    current_user: User = Depends(verify_token),
):
    """Borra una PushSubscription propia."""
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(status_code=503, detail="DB no configurada")
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            DELETE FROM push_subscriptions
            WHERE user_id = $1::uuid AND endpoint = $2
            """,
            current_user.id,
            payload.endpoint,
        )
        # asyncpg returns "DELETE N"
        if not result.endswith(("0",)):
            return None
        raise HTTPException(status_code=404, detail="Subscription no encontrada")


@router.get("/vapid-public-key", response_model=VapidKeyResponse)
async def get_vapid_public_key():
    """Devuelve la VAPID public key del server (no secreto)."""
    key = os.getenv("VAPID_PUBLIC_KEY", "")
    if not key:
        raise HTTPException(
            status_code=503,
            detail="VAPID_PUBLIC_KEY no configurada en env vars del backend",
        )
    return VapidKeyResponse(publicKey=key)


@router.post("/test", status_code=202)
async def send_test_notification(
    payload: TestPayload,
    x_admin_token: str = Header(default=""),
):
    """Admin-only · envía test push al user_id."""
    expected = os.getenv("PAYMENTS_ADMIN_TOKEN", "")
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Token admin inválido")

    from ...services.push_sender import send_notification

    sent = await send_notification(
        user_id=payload.user_id,
        payload={"title": payload.title, "body": payload.body, "url": "/"},
    )
    return {"sent": sent, "user_id": payload.user_id}
