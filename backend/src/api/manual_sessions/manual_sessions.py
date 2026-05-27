"""
Manual Sessions · coach asigna entrenamiento del día ad-hoc.

Caso de uso: atleta SIN macrociclo asignado (o con macrociclo pero el coach
quiere modificar la sesión del día). Los macrociclos son plantillas guía ·
pueden ser modificadas y/o complementadas con manual sessions.

Soporta doble turno (am + pm) para halterofilia élite o Volta CrossFit donde
el atleta entrena 2 veces el mismo día.

POST   /v1/manual-sessions                       → coach asigna sesión manual
GET    /v1/manual-sessions                       → coach lista de un atleta · atleta lista las suyas
GET    /v1/manual-sessions/me/today              → atleta ve sus sesiones de hoy
PATCH  /v1/manual-sessions/{id}                  → coach edita
DELETE /v1/manual-sessions/{id}                  → coach borra

Auth ownership:
- POST: coach del atleta o admin
- GET: atleta destinatario (lista las suyas) · coach dueño del atleta
- PATCH/DELETE: coach dueño del registro o admin

Persistencia: tabla `manual_sessions` (migration 010_manual_sessions.sql).
"""
from datetime import date as date_type, datetime
from typing import Literal, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo
from ...services.push_sender import send_notification


router = APIRouter(prefix="/v1/manual-sessions", tags=["manual-sessions"])


SessionSlot = Literal["am", "pm", "full"]
SessionFocus = Literal["technique", "strength", "olympic", "accessory", "metcon"]
MaxKey = Literal["snatch", "clean", "jerk", "back_squat", "front_squat"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ExerciseSpec(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    sets: int = Field(..., ge=1, le=20)
    reps: int = Field(..., ge=1, le=50)
    pct: float = Field(..., ge=0.3, le=1.1)  # 30%–110% (tolera over-PR)
    max_key: MaxKey

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name no puede estar vacío")
        return v


class ManualSessionCreate(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    date: date_type
    slot: SessionSlot = "full"
    focus: SessionFocus
    exercises: List[ExerciseSpec] = Field(..., min_length=1, max_length=20)
    note: Optional[str] = Field(default=None, max_length=500)

    @field_validator("note")
    @classmethod
    def _strip_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v if v else None


class ManualSessionUpdate(BaseModel):
    slot: Optional[SessionSlot] = None
    focus: Optional[SessionFocus] = None
    exercises: Optional[List[ExerciseSpec]] = Field(default=None, min_length=1, max_length=20)
    note: Optional[str] = Field(default=None, max_length=500)


class ManualSessionResponse(BaseModel):
    id: str
    athlete_id: str
    coach_id: str
    date: date_type
    slot: SessionSlot
    focus: SessionFocus
    exercises: List[ExerciseSpec]
    note: Optional[str] = None
    created_at: datetime
    coach_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_response(row: dict) -> ManualSessionResponse:
    import json as _json
    raw_ex = row["exercises"]
    if isinstance(raw_ex, str):
        raw_ex = _json.loads(raw_ex)
    return ManualSessionResponse(
        id=str(row["id"]),
        athlete_id=str(row["athlete_id"]),
        coach_id=str(row["coach_id"]),
        date=row["date"],
        slot=row["slot"],
        focus=row["focus"],
        exercises=[ExerciseSpec(**e) for e in raw_ex],
        note=row.get("note"),
        created_at=row["created_at"],
        coach_name=row.get("coach_name"),
    )


async def _require_pool():
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DB no disponible — configurá DATABASE_URL",
        )
    return pool


def _require_coach(user: User):
    if user.role not in ("coach", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo coaches pueden asignar sesiones manuales",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED, response_model=ManualSessionResponse)
async def create_manual_session(
    payload: ManualSessionCreate,
    user: User = Depends(verify_token),
) -> ManualSessionResponse:
    """
    Coach asigna sesión manual a un atleta para una fecha + slot.
    Si ya existe una sesión para (athlete_id, date, slot) → 409 Conflict
    (usar PATCH para editar).

    SECURITY: verifica coach-athlete binding antes del INSERT.
    Admin bypassea.
    """
    _require_coach(user)
    if user.role != "admin":
        from ..auth.auth import coach_owns_athlete
        if not await coach_owns_athlete(user.id, payload.athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este atleta no está asignado a tu coaching",
            )

    import json as _json
    exercises_json = _json.dumps([e.model_dump() for e in payload.exercises])

    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            existing = await conn.fetchrow(
                """
                SELECT id FROM manual_sessions
                WHERE athlete_id = $1::uuid AND date = $2 AND slot = $3
                LIMIT 1
                """,
                payload.athlete_id, payload.date, payload.slot,
            )
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una sesión manual para ese atleta/fecha/slot · usá PATCH para editarla",
                )

            row = await conn.fetchrow(
                """
                WITH inserted AS (
                    INSERT INTO manual_sessions
                        (athlete_id, coach_id, date, slot, focus, exercises, note)
                    VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::jsonb, $7)
                    RETURNING id, athlete_id, coach_id, date, slot, focus, exercises, note, created_at
                )
                SELECT i.*, u.name AS coach_name
                FROM inserted i
                LEFT JOIN users u ON u.id = i.coach_id
                """,
                payload.athlete_id, user.id, payload.date, payload.slot,
                payload.focus, exercises_json, payload.note,
            )
            response = _row_to_response(dict(row))

        # Push notif al atleta (fuera del `async with conn` para liberar pool).
        # Fail-soft: cualquier error no rompe el response al coach.
        try:
            coach_label = row.get("coach_name") or "Tu coach"
            focus_label = {
                "technique": "técnica",
                "strength": "fuerza",
                "olympic": "olímpico",
                "accessory": "accesorios",
                "metcon": "metcon",
            }.get(payload.focus, payload.focus)
            slot_label = {
                "am": " AM",
                "pm": " PM",
                "full": "",
            }.get(payload.slot, "")
            date_label = payload.date.isoformat()
            await send_notification(
                user_id=payload.athlete_id,
                payload={
                    "title": "🏋 Nueva sesión asignada",
                    "body": f"{coach_label} asignó {focus_label}{slot_label} para el {date_label}",
                    "url": "/#schedule",
                    "icon": "/icon-192.png",
                    "badge": "/icon-192.png",
                    "tag": f"manual-session-{response.id}",
                },
                ttl=86400,
            )
        except Exception as push_err:
            print(f"[manual_sessions] push notif failed: {push_err}")

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos crear la sesión manual: {str(e)[:200]}",
        )


@router.get("", response_model=List[ManualSessionResponse])
async def list_manual_sessions(
    user: User = Depends(verify_token),
    athlete_id: Optional[str] = Query(default=None),
    from_date: Optional[date_type] = Query(default=None, alias="from"),
    to_date: Optional[date_type] = Query(default=None, alias="to"),
) -> List[ManualSessionResponse]:
    """
    Lista sesiones manuales.
    - Atleta: lista las suyas (athlete_id se ignora · siempre self).
    - Coach: requiere athlete_id · debe ser de un atleta del coach.
    - Admin: athlete_id opcional · si se omite, lista todas.

    Filtros opcionales: from, to (ISO date).
    """
    pool = await _require_pool()

    # Resolver athlete_id efectivo + verificar permisos
    effective_athlete_id: Optional[str]
    if user.role == "athlete":
        effective_athlete_id = user.id
    elif user.role == "coach":
        if not athlete_id:
            raise HTTPException(400, "coach debe especificar athlete_id")
        from ..auth.auth import coach_owns_athlete
        if not await coach_owns_athlete(user.id, athlete_id):
            raise HTTPException(403, "Este atleta no está asignado a tu coaching")
        effective_athlete_id = athlete_id
    else:  # admin
        effective_athlete_id = athlete_id  # None → lista todas

    # Build query dinámica
    conditions = []
    params: list = []
    idx = 1

    if effective_athlete_id:
        conditions.append(f"m.athlete_id = ${idx}::uuid")
        params.append(effective_athlete_id)
        idx += 1
    if from_date:
        conditions.append(f"m.date >= ${idx}")
        params.append(from_date)
        idx += 1
    if to_date:
        conditions.append(f"m.date <= ${idx}")
        params.append(to_date)
        idx += 1

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                f"""
                SELECT m.id, m.athlete_id, m.coach_id, m.date, m.slot,
                       m.focus, m.exercises, m.note, m.created_at,
                       u.name AS coach_name
                FROM manual_sessions m
                LEFT JOIN users u ON u.id = m.coach_id
                {where_clause}
                ORDER BY m.date DESC, m.slot ASC
                LIMIT 200
                """,
                *params,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar las sesiones manuales: {str(e)[:200]}",
        )


@router.get("/me/today", response_model=List[ManualSessionResponse])
async def my_today_sessions(
    user: User = Depends(verify_token),
) -> List[ManualSessionResponse]:
    """
    Atleta ve sus sesiones manuales de HOY (am + pm + full).
    Usado por DoubleSessionCards en AtletaHome / VoltaDashboard.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT m.id, m.athlete_id, m.coach_id, m.date, m.slot,
                       m.focus, m.exercises, m.note, m.created_at,
                       u.name AS coach_name
                FROM manual_sessions m
                LEFT JOIN users u ON u.id = m.coach_id
                WHERE m.athlete_id = $1::uuid AND m.date = CURRENT_DATE
                ORDER BY
                  CASE m.slot WHEN 'am' THEN 0 WHEN 'full' THEN 1 ELSE 2 END
                """,
                user.id,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos cargar tus sesiones de hoy: {str(e)[:200]}",
        )


@router.patch("/{session_id}", response_model=ManualSessionResponse)
async def update_manual_session(
    session_id: UUID,
    payload: ManualSessionUpdate,
    user: User = Depends(verify_token),
) -> ManualSessionResponse:
    """
    Coach edita una sesión manual propia. Admin bypassea owner check.
    NO se permite cambiar athlete_id ni date (borrar + crear si se necesita).
    """
    _require_coach(user)
    pool = await _require_pool()

    import json as _json

    try:
        async with pool.acquire() as conn:
            target = await conn.fetchrow(
                "SELECT id, coach_id FROM manual_sessions WHERE id = $1",
                session_id,
            )
            if target is None:
                raise HTTPException(404, "Sesión manual no encontrada")
            if str(target["coach_id"]) != str(user.id) and user.role != "admin":
                raise HTTPException(403, "Solo el coach que creó la sesión puede editarla")

            # Build dynamic UPDATE
            sets = []
            params: list = []
            idx = 1
            if payload.slot is not None:
                sets.append(f"slot = ${idx}")
                params.append(payload.slot)
                idx += 1
            if payload.focus is not None:
                sets.append(f"focus = ${idx}")
                params.append(payload.focus)
                idx += 1
            if payload.exercises is not None:
                sets.append(f"exercises = ${idx}::jsonb")
                params.append(_json.dumps([e.model_dump() for e in payload.exercises]))
                idx += 1
            if payload.note is not None:
                sets.append(f"note = ${idx}")
                params.append(payload.note.strip() or None)
                idx += 1

            if not sets:
                raise HTTPException(400, "Nada para actualizar")

            params.append(session_id)
            row = await conn.fetchrow(
                f"""
                WITH updated AS (
                    UPDATE manual_sessions
                    SET {', '.join(sets)}
                    WHERE id = ${idx}
                    RETURNING id, athlete_id, coach_id, date, slot, focus, exercises, note, created_at
                )
                SELECT u.*, usr.name AS coach_name
                FROM updated u
                LEFT JOIN users usr ON usr.id = u.coach_id
                """,
                *params,
            )
            response = _row_to_response(dict(row))

        # Push notif al atleta avisando que la sesión cambió (fail-soft).
        try:
            coach_label = row.get("coach_name") or "Tu coach"
            date_label = response.date.isoformat()
            await send_notification(
                user_id=str(response.athlete_id),
                payload={
                    "title": "✏️ Sesión modificada",
                    "body": f"{coach_label} actualizó la sesión del {date_label}",
                    "url": "/#schedule",
                    "icon": "/icon-192.png",
                    "badge": "/icon-192.png",
                    "tag": f"manual-session-{response.id}",
                },
                ttl=86400,
            )
        except Exception as push_err:
            print(f"[manual_sessions] push notif on update failed: {push_err}")

        return response
    except HTTPException:
        raise
    except Exception as e:
        # UNIQUE constraint violation por cambio de slot → 409
        if "manual_sessions_athlete_id_date_slot_key" in str(e):
            raise HTTPException(409, "Ya existe una sesión en ese slot · cambiá el slot o borrá la existente")
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos actualizar la sesión manual: {str(e)[:200]}",
        )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_manual_session(
    session_id: UUID,
    user: User = Depends(verify_token),
):
    """
    Coach borra una sesión manual propia. Admin bypassea owner check.
    """
    _require_coach(user)
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            target = await conn.fetchrow(
                "SELECT id, coach_id FROM manual_sessions WHERE id = $1",
                session_id,
            )
            if target is None:
                raise HTTPException(404, "Sesión manual no encontrada")
            if str(target["coach_id"]) != str(user.id) and user.role != "admin":
                raise HTTPException(403, "Solo el coach que creó la sesión puede borrarla")

            await conn.execute(
                "DELETE FROM manual_sessions WHERE id = $1",
                session_id,
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos borrar la sesión manual: {str(e)[:200]}",
        )
