"""
Smart Alerts API · Engine 14 endpoints.

- POST /v1/alerts/evaluate/me              → atleta dispara evaluación de sí mismo
- POST /v1/alerts/evaluate/athlete/{id}    → coach evalúa atleta
- POST /v1/alerts/evaluate/box             → coach evalúa todo su box
- GET  /v1/alerts/me                       → atleta lista sus alertas activas
- GET  /v1/alerts/box                      → coach lista alertas de su box
- PATCH /v1/alerts/{id}/acknowledge        → marca como vista
- PATCH /v1/alerts/{id}/resolve            → marca resuelta + notas
- DELETE /v1/alerts/{id}                   → dismiss (descartar sin resolver)
"""

from __future__ import annotations

from typing import Optional, List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...services import smart_coach_engine as engine
from ...db import users_repo


router = APIRouter(prefix="/v1/alerts", tags=["smart-alerts"])


class AlertResponse(BaseModel):
    id: str
    athlete_id: str
    athlete_name: Optional[str] = None
    coach_id: Optional[str] = None
    code: str
    severity: str
    title: str
    description: Optional[str] = None
    factors: list
    suggested_action: dict
    status: str
    detected_at: datetime


class ResolvePayload(BaseModel):
    resolution_notes: Optional[str] = None


def _parse_json(val):
    if val is None: return []
    if isinstance(val, (list, dict)): return val
    import json as _json
    try: return _json.loads(val)
    except Exception: return []


# ============================================================================
# Evaluación · dispara el engine
# ============================================================================

@router.post("/evaluate/me")
async def evaluate_me(user: User = Depends(verify_token)):
    """Atleta corre evaluación sobre sí mismo."""
    alerts = await engine.evaluate_athlete(user.id, persist=True)
    return {"alerts_generated": len(alerts), "alerts": [a.__dict__ for a in alerts]}


@router.post("/evaluate/athlete/{athlete_id}")
async def evaluate_athlete(athlete_id: str, user: User = Depends(verify_token)):
    """Coach evalúa atleta específico."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")
    if user.role != "admin" and not await coach_owns_athlete(user.id, athlete_id):
        raise HTTPException(403, "Atleta no asignado")
    alerts = await engine.evaluate_athlete(athlete_id, persist=True)
    return {"alerts_generated": len(alerts), "alerts": [a.__dict__ for a in alerts]}


@router.post("/evaluate/box")
async def evaluate_box(user: User = Depends(verify_token)):
    """Coach evalúa todo su box · usar como cron diario."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")
    return await engine.evaluate_box(user.id)


# ============================================================================
# Listar alertas
# ============================================================================

@router.get("/me", response_model=List[AlertResponse])
async def list_my_alerts(
    user: User = Depends(verify_token),
    status: str = "active",
) -> List[AlertResponse]:
    """Atleta lista sus alertas (default solo activas)."""
    pool = await users_repo.get_pool()
    if pool is None: return []

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT a.id, a.athlete_id, a.coach_id, a.code, a.severity, a.title,
                   a.description, a.factors, a.suggested_action, a.status, a.detected_at,
                   u.name AS athlete_name
              FROM smart_alerts a
              JOIN users u ON u.id = a.athlete_id
             WHERE a.athlete_id = $1::uuid AND a.status = $2
             ORDER BY
               CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
               a.detected_at DESC
            """,
            user.id, status,
        )

    return [
        AlertResponse(
            id=str(r["id"]), athlete_id=str(r["athlete_id"]),
            athlete_name=r["athlete_name"],
            coach_id=str(r["coach_id"]) if r["coach_id"] else None,
            code=r["code"], severity=r["severity"], title=r["title"],
            description=r["description"],
            factors=_parse_json(r["factors"]),
            suggested_action=_parse_json(r["suggested_action"]) or {},
            status=r["status"], detected_at=r["detected_at"],
        )
        for r in rows
    ]


@router.get("/box", response_model=List[AlertResponse])
async def list_box_alerts(
    user: User = Depends(verify_token),
    status: str = "active",
    severity: Optional[str] = None,
) -> List[AlertResponse]:
    """Coach lista alertas del box · ordenadas por severidad."""
    if user.role not in ("coach", "admin"):
        raise HTTPException(403, "Solo coaches")

    pool = await users_repo.get_pool()
    if pool is None: return []

    conditions = ["a.coach_id = $1::uuid", "a.status = $2"]
    params: list = [user.id, status]
    idx = 3
    if severity:
        conditions.append(f"a.severity = ${idx}")
        params.append(severity)
        idx += 1

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT a.id, a.athlete_id, a.coach_id, a.code, a.severity, a.title,
                   a.description, a.factors, a.suggested_action, a.status, a.detected_at,
                   u.name AS athlete_name
              FROM smart_alerts a
              JOIN users u ON u.id = a.athlete_id
             WHERE {' AND '.join(conditions)}
             ORDER BY
               CASE a.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
               a.detected_at DESC
             LIMIT 100
            """,
            *params,
        )

    return [
        AlertResponse(
            id=str(r["id"]), athlete_id=str(r["athlete_id"]),
            athlete_name=r["athlete_name"],
            coach_id=str(r["coach_id"]) if r["coach_id"] else None,
            code=r["code"], severity=r["severity"], title=r["title"],
            description=r["description"],
            factors=_parse_json(r["factors"]),
            suggested_action=_parse_json(r["suggested_action"]) or {},
            status=r["status"], detected_at=r["detected_at"],
        )
        for r in rows
    ]


# ============================================================================
# Acciones sobre alertas
# ============================================================================

@router.patch("/{alert_id}/acknowledge")
async def acknowledge(alert_id: UUID, user: User = Depends(verify_token)):
    """Marca alerta como vista · no resuelve."""
    pool = await users_repo.get_pool()
    if pool is None: raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT athlete_id, coach_id FROM smart_alerts WHERE id = $1",
            alert_id,
        )
        if not row: raise HTTPException(404, "Alerta no encontrada")

        # Atleta o coach pueden acknowledge
        is_self = str(row["athlete_id"]) == user.id
        is_coach = row["coach_id"] and str(row["coach_id"]) == user.id
        if not (is_self or is_coach or user.role == "admin"):
            raise HTTPException(403, "Sin permisos")

        await conn.execute(
            """
            UPDATE smart_alerts
               SET status = 'acknowledged',
                   acknowledged_at = NOW(),
                   acknowledged_by = $1::uuid
             WHERE id = $2
            """,
            user.id, alert_id,
        )
    return {"ok": True}


@router.patch("/{alert_id}/resolve")
async def resolve(alert_id: UUID, payload: ResolvePayload, user: User = Depends(verify_token)):
    """Marca alerta como resuelta + opcionalmente nota."""
    pool = await users_repo.get_pool()
    if pool is None: raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT athlete_id, coach_id FROM smart_alerts WHERE id = $1",
            alert_id,
        )
        if not row: raise HTTPException(404, "Alerta no encontrada")

        is_self = str(row["athlete_id"]) == user.id
        is_coach = row["coach_id"] and str(row["coach_id"]) == user.id
        if not (is_self or is_coach or user.role == "admin"):
            raise HTTPException(403, "Sin permisos")

        await conn.execute(
            """
            UPDATE smart_alerts
               SET status = 'resolved',
                   resolved_at = NOW(),
                   resolution_notes = COALESCE($1, resolution_notes)
             WHERE id = $2
            """,
            payload.resolution_notes, alert_id,
        )
    return {"ok": True}


@router.delete("/{alert_id}", status_code=204)
async def dismiss(alert_id: UUID, user: User = Depends(verify_token)):
    """Descartar alerta sin resolver."""
    pool = await users_repo.get_pool()
    if pool is None: raise HTTPException(503, "DB no disponible")

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT athlete_id, coach_id FROM smart_alerts WHERE id = $1",
            alert_id,
        )
        if not row: raise HTTPException(404)

        is_self = str(row["athlete_id"]) == user.id
        is_coach = row["coach_id"] and str(row["coach_id"]) == user.id
        if not (is_self or is_coach or user.role == "admin"):
            raise HTTPException(403, "Sin permisos")

        await conn.execute(
            "UPDATE smart_alerts SET status = 'dismissed' WHERE id = $1",
            alert_id,
        )
    return None
