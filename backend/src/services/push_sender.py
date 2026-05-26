"""
Push notification sender.

Lee subscriptions de la tabla `push_subscriptions` y envía push vía pywebpush
con VAPID. Si pywebpush no está instalado (entorno dev), el helper retorna 0
sin romper.

Uso:
    from ..services.push_sender import send_notification
    sent = await send_notification(
        user_id="...uuid...",
        payload={"title": "WOD listo", "body": "Hora de entrenar", "url": "/"},
        ttl=3600,
    )
"""

from __future__ import annotations

import json
import os
from typing import Any

from ..db import users_repo

# Lazy import: pywebpush puede no estar en dev local
try:
    from pywebpush import webpush, WebPushException  # type: ignore
    _PYWEBPUSH_AVAILABLE = True
except ImportError:
    webpush = None  # type: ignore
    WebPushException = Exception  # type: ignore
    _PYWEBPUSH_AVAILABLE = False


VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:admin@holyoly.app")


async def send_notification(
    user_id: str,
    payload: dict[str, Any],
    ttl: int = 3600,
) -> int:
    """
    Envía push notification a TODAS las subscriptions del user.
    Retorna count enviado exitosamente.

    Si una subscription falla con 410 Gone → la borra de la DB (cliente desinstaló).
    """
    if not _PYWEBPUSH_AVAILABLE:
        print("[push_sender] pywebpush no instalado · saltando envío real")
        return 0

    if not VAPID_PRIVATE_KEY:
        print("[push_sender] VAPID_PRIVATE_KEY no configurada · saltando")
        return 0

    pool = await users_repo.get_pool()
    if pool is None:
        print("[push_sender] DB pool no disponible")
        return 0

    sent = 0
    expired_ids: list[str] = []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, endpoint, p256dh, auth
            FROM push_subscriptions
            WHERE user_id = $1::uuid
            """,
            user_id,
        )

        for row in rows:
            subscription_info = {
                "endpoint": row["endpoint"],
                "keys": {"p256dh": row["p256dh"], "auth": row["auth"]},
            }
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_SUBJECT},
                    ttl=ttl,
                )
                sent += 1
            except WebPushException as e:
                response = getattr(e, "response", None)
                code = getattr(response, "status_code", None) if response else None
                if code == 410 or code == 404:
                    expired_ids.append(str(row["id"]))
                print(f"[push_sender] failed to send to {row['endpoint'][:50]}...: code={code} err={e}")

        # Limpiar subscriptions expiradas
        if expired_ids:
            await conn.execute(
                "DELETE FROM push_subscriptions WHERE id = ANY($1::uuid[])",
                expired_ids,
            )
            print(f"[push_sender] removed {len(expired_ids)} expired subscriptions")

    return sent
