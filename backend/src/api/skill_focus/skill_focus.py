"""
Coach Skill Focus · endpoints para el loop coach↔atleta sobre el skill tree.

POST   /v1/coach/skill-focus                      → coach asigna foco (movement + nota)
GET    /v1/coach/skill-focus/me                   → atleta lista sus focos activos
GET    /v1/coach/skill-focus/athlete/{athlete_id} → coach lista focos de un atleta
PATCH  /v1/coach/skill-focus/{id}                 → update status (dominated/active/retired)
DELETE /v1/coach/skill-focus/{id}                 → coach desasigna

Auth ownership:
- POST/DELETE: solo el coach dueño del registro (focus.coach_id == user.id) puede borrar.
- PATCH:
    * coach dueño puede pasar a active/retired/dominated
    * atleta destinatario (focus.athlete_id == user.id) puede marcar 'dominated'
- GET /me: filtra por current_user.id como athlete_id
- GET /athlete/{id}: el coach pide focos del atleta (no enforce vínculo coach-atleta acá,
  ese check vive en `can_access_athlete_data` si se requiere más adelante)

Persistencia: tabla `coach_skill_focus` (migration 008_coach_skill_focus.sql).
"""
from datetime import datetime
from typing import Literal, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo
from ...services.push_sender import send_notification


router = APIRouter(prefix="/v1/coach/skill-focus", tags=["skill-focus"])


FocusStatus = Literal["active", "dominated", "retired"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SkillFocusCreate(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    movement_id: str = Field(..., min_length=1, max_length=80)
    note: Optional[str] = Field(default=None, max_length=500)

    @field_validator("movement_id")
    @classmethod
    def _strip_movement(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("movement_id no puede estar vacío")
        return v

    @field_validator("note")
    @classmethod
    def _strip_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v if v else None


class SkillFocusUpdate(BaseModel):
    status: FocusStatus


class SkillFocusResponse(BaseModel):
    id: str
    coach_id: str
    athlete_id: str
    movement_id: str
    note: Optional[str] = None
    status: FocusStatus
    assigned_at: datetime
    resolved_at: Optional[datetime] = None
    # Convenience: coach_name resuelto en queries con JOIN
    coach_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_response(row: dict) -> SkillFocusResponse:
    return SkillFocusResponse(
        id=str(row["id"]),
        coach_id=str(row["coach_id"]),
        athlete_id=str(row["athlete_id"]),
        movement_id=row["movement_id"],
        note=row.get("note"),
        status=row["status"],
        assigned_at=row["assigned_at"],
        resolved_at=row.get("resolved_at"),
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
            detail="Solo coaches pueden asignar focos",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED, response_model=SkillFocusResponse)
async def create_skill_focus(
    payload: SkillFocusCreate,
    user: User = Depends(verify_token),
) -> SkillFocusResponse:
    """
    Coach asigna foco semanal sobre un movimiento del skill tree del atleta.
    Si ya existe un foco active para (athlete_id, movement_id) → 409 Conflict.
    """
    _require_coach(user)
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            # Pre-check para devolver 409 amigable (el UNIQUE INDEX parcial también
            # protege a nivel DB).
            existing = await conn.fetchrow(
                """
                SELECT id FROM coach_skill_focus
                WHERE athlete_id = $1::uuid
                  AND movement_id = $2
                  AND status = 'active'
                LIMIT 1
                """,
                payload.athlete_id, payload.movement_id,
            )
            if existing is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ese movimiento ya tiene un foco activo para este atleta",
                )

            row = await conn.fetchrow(
                """
                INSERT INTO coach_skill_focus
                    (coach_id, athlete_id, movement_id, note, status)
                VALUES ($1::uuid, $2::uuid, $3, $4, 'active')
                RETURNING id, coach_id, athlete_id, movement_id, note, status,
                          assigned_at, resolved_at
                """,
                user.id, payload.athlete_id, payload.movement_id, payload.note,
            )
            return _row_to_response(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos crear el foco: {str(e)[:200]}",
        )


@router.get("/me", response_model=List[SkillFocusResponse])
async def list_my_focus(
    user: User = Depends(verify_token),
) -> List[SkillFocusResponse]:
    """
    Atleta lista sus focos ACTIVOS (no dominated/retired).
    Incluye coach_name vía JOIN con users.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT f.id, f.coach_id, f.athlete_id, f.movement_id, f.note,
                       f.status, f.assigned_at, f.resolved_at,
                       u.name AS coach_name
                FROM coach_skill_focus f
                LEFT JOIN users u ON u.id = f.coach_id
                WHERE f.athlete_id = $1::uuid
                  AND f.status = 'active'
                ORDER BY f.assigned_at DESC
                """,
                user.id,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar tus focos: {str(e)[:200]}",
        )


@router.get("/athlete/{athlete_id}", response_model=List[SkillFocusResponse])
async def list_focus_for_athlete(
    athlete_id: UUID,
    user: User = Depends(verify_token),
) -> List[SkillFocusResponse]:
    """
    Coach lista focos de un atleta: actives + dominated recientes (últimos 60 días).
    """
    _require_coach(user)
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT f.id, f.coach_id, f.athlete_id, f.movement_id, f.note,
                       f.status, f.assigned_at, f.resolved_at,
                       u.name AS coach_name
                FROM coach_skill_focus f
                LEFT JOIN users u ON u.id = f.coach_id
                WHERE f.athlete_id = $1
                  AND (
                    f.status = 'active'
                    OR (f.status = 'dominated' AND f.resolved_at > NOW() - INTERVAL '60 days')
                  )
                ORDER BY
                  CASE WHEN f.status = 'active' THEN 0 ELSE 1 END,
                  f.assigned_at DESC
                """,
                athlete_id,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar focos del atleta: {str(e)[:200]}",
        )


@router.patch("/{focus_id}", response_model=SkillFocusResponse)
async def update_skill_focus(
    focus_id: UUID,
    payload: SkillFocusUpdate,
    user: User = Depends(verify_token),
) -> SkillFocusResponse:
    """
    Update status:
    - Atleta destinatario puede pasar a 'dominated' (cierra el foco · resolved_at=NOW())
    - Coach dueño puede pasar a cualquier status
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            target = await conn.fetchrow(
                """
                SELECT f.id, f.coach_id, f.athlete_id, f.status,
                       a.name AS athlete_name
                FROM coach_skill_focus f
                LEFT JOIN users a ON a.id = f.athlete_id
                WHERE f.id = $1
                """,
                focus_id,
            )
            if target is None:
                raise HTTPException(404, "Foco no encontrado")

            is_coach_owner = str(target["coach_id"]) == str(user.id)
            is_athlete_target = str(target["athlete_id"]) == str(user.id)
            is_admin = user.role == "admin"

            if not (is_coach_owner or is_athlete_target or is_admin):
                raise HTTPException(403, "No podés modificar este foco")

            # Atleta solo puede marcar dominated
            if is_athlete_target and not (is_coach_owner or is_admin):
                if payload.status != "dominated":
                    raise HTTPException(
                        403,
                        "Como atleta solo podés marcar este foco como dominated",
                    )

            new_resolved = "NOW()" if payload.status == "dominated" else "NULL"
            row = await conn.fetchrow(
                f"""
                UPDATE coach_skill_focus
                SET status = $1,
                    resolved_at = {new_resolved}
                WHERE id = $2
                RETURNING id, coach_id, athlete_id, movement_id, note, status,
                          assigned_at, resolved_at
                """,
                payload.status, focus_id,
            )

            response = _row_to_response(dict(row))

        # Push notif al coach cuando el atleta marca dominated.
        # Fuera del `async with conn` para no bloquear el release del pool.
        # Coach que se updatea a sí mismo NO dispara push (achievement viene del atleta).
        # Solo status='dominated' (active/retired no son achievement).
        actor_is_athlete_only = is_athlete_target and not is_coach_owner
        if payload.status == "dominated" and actor_is_athlete_only:
            athlete_name = (
                target["athlete_name"]
                or (user.email.split("@")[0] if user.email else "Un atleta")
            )
            try:
                # TODO: el frontend SW todavía no maneja deep links a /athlete-detail?id=...
                # cuando se implemente, el click del push va a abrir la vista del atleta.
                await send_notification(
                    user_id=str(target["coach_id"]),
                    payload={
                        "title": "🎯 Foco dominado",
                        "body": f"{athlete_name} marcó como dominado: {row['movement_id']}",
                        "url": f"/athlete-detail?id={target['athlete_id']}",
                        "icon": "/icon-192.png",
                        "badge": "/icon-192.png",
                        "tag": f"skill-dominated-{row['id']}",
                    },
                    ttl=86400,
                )
            except Exception as e:
                # No romper el PATCH: el atleta debe ver éxito aunque la notif falle.
                print(f"[skill_focus] push notif al coach falló: {e}")

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos actualizar el foco: {str(e)[:200]}",
        )


@router.delete("/{focus_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill_focus(
    focus_id: UUID,
    user: User = Depends(verify_token),
):
    """
    Coach desasigna un foco (delete físico). Solo el coach dueño puede.
    Si querés mantener historial, usá PATCH status='retired' en su lugar.
    """
    _require_coach(user)
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            target = await conn.fetchrow(
                "SELECT id, coach_id FROM coach_skill_focus WHERE id = $1",
                focus_id,
            )
            if target is None:
                raise HTTPException(404, "Foco no encontrado")
            if str(target["coach_id"]) != str(user.id) and user.role != "admin":
                raise HTTPException(403, "Solo el coach que creó el foco puede borrarlo")

            await conn.execute(
                "DELETE FROM coach_skill_focus WHERE id = $1",
                focus_id,
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos borrar el foco: {str(e)[:200]}",
        )
