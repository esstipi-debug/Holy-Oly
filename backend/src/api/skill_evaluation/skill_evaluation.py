"""
Coach Skill Evaluation · veredicto formal del coach sobre la destreza del atleta
en cada movimiento del skill tree.

POST   /v1/skill-evaluation                      → upsert (athlete, movement) → level (1-5) + note
GET    /v1/skill-evaluation/athlete/{athlete_id} → coach lista evaluaciones de su atleta
GET    /v1/skill-evaluation/me                   → atleta lista sus evaluaciones
DELETE /v1/skill-evaluation/{id}                 → coach owner o admin borran

Diferencia conceptual vs skill_focus:
- skill_focus      = "trabajá ESTO esta semana" (objetivo activo · loop semanal · status active/dominated)
- skill_evaluation = "tu destreza HOY es X" (veredicto persistente · 1-5 stars del coach)

Auth:
- POST: coach con coach_owns_athlete · admin bypass
- GET athlete/{id}: coach owner · admin bypass
- GET me: cualquier user autenticado lista lo suyo
- DELETE: coach dueño del registro · admin bypass

Persistencia: tabla `coach_skill_evaluation` (migration 011).
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/skill-evaluation", tags=["skill-evaluation"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SkillEvaluationUpsert(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    movement_id: str = Field(..., min_length=1, max_length=80)
    level: int = Field(..., ge=1, le=5)
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


class SkillEvaluationResponse(BaseModel):
    id: str
    coach_id: str
    athlete_id: str
    movement_id: str
    level: int
    note: Optional[str] = None
    evaluated_at: datetime
    # JOIN con users · informativo
    coach_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_response(row: dict) -> SkillEvaluationResponse:
    return SkillEvaluationResponse(
        id=str(row["id"]),
        coach_id=str(row["coach_id"]),
        athlete_id=str(row["athlete_id"]),
        movement_id=row["movement_id"],
        level=int(row["level"]),
        note=row.get("note"),
        evaluated_at=row["evaluated_at"],
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
            detail="Solo coaches pueden evaluar movimientos",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_200_OK, response_model=SkillEvaluationResponse)
async def upsert_skill_evaluation(
    payload: SkillEvaluationUpsert,
    user: User = Depends(verify_token),
) -> SkillEvaluationResponse:
    """
    Coach evalúa el movimiento del atleta (upsert por (athlete_id, movement_id)).
    Si ya existe una eval previa → actualiza level/note y refresca evaluated_at.

    SECURITY: coach binding via coach_owns_athlete · admin bypass.
    """
    _require_coach(user)
    if user.role != "admin":
        from ..auth.auth import coach_owns_athlete
        if not await coach_owns_athlete(user.id, payload.athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este atleta no está asignado a tu coaching",
            )
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                WITH upserted AS (
                    INSERT INTO coach_skill_evaluation
                        (coach_id, athlete_id, movement_id, level, note, evaluated_at)
                    VALUES ($1::uuid, $2::uuid, $3, $4, $5, NOW())
                    ON CONFLICT (athlete_id, movement_id) DO UPDATE
                        SET coach_id = EXCLUDED.coach_id,
                            level = EXCLUDED.level,
                            note = EXCLUDED.note,
                            evaluated_at = NOW()
                    RETURNING id, coach_id, athlete_id, movement_id, level, note, evaluated_at
                )
                SELECT u.id, u.coach_id, u.athlete_id, u.movement_id, u.level, u.note,
                       u.evaluated_at,
                       usr.name AS coach_name
                FROM upserted u
                LEFT JOIN users usr ON usr.id = u.coach_id
                """,
                user.id, payload.athlete_id, payload.movement_id,
                payload.level, payload.note,
            )
            return _row_to_response(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos guardar la evaluación: {str(e)[:200]}",
        )


@router.get("/me", response_model=List[SkillEvaluationResponse])
async def list_my_evaluations(
    user: User = Depends(verify_token),
) -> List[SkillEvaluationResponse]:
    """Atleta lista todas las evaluaciones del coach sobre sí mismo."""
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT e.id, e.coach_id, e.athlete_id, e.movement_id, e.level, e.note,
                       e.evaluated_at,
                       u.name AS coach_name
                FROM coach_skill_evaluation e
                LEFT JOIN users u ON u.id = e.coach_id
                WHERE e.athlete_id = $1::uuid
                ORDER BY e.evaluated_at DESC
                """,
                user.id,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar tus evaluaciones: {str(e)[:200]}",
        )


@router.get("/athlete/{athlete_id}", response_model=List[SkillEvaluationResponse])
async def list_evaluations_for_athlete(
    athlete_id: UUID,
    user: User = Depends(verify_token),
) -> List[SkillEvaluationResponse]:
    """
    Coach lista evaluaciones de un atleta. Verifica coach_owns_athlete · admin bypass.
    """
    _require_coach(user)
    if user.role != "admin":
        from ..auth.auth import coach_owns_athlete
        if not await coach_owns_athlete(user.id, str(athlete_id)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este atleta no está asignado a tu coaching",
            )
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT e.id, e.coach_id, e.athlete_id, e.movement_id, e.level, e.note,
                       e.evaluated_at,
                       u.name AS coach_name
                FROM coach_skill_evaluation e
                LEFT JOIN users u ON u.id = e.coach_id
                WHERE e.athlete_id = $1
                ORDER BY e.evaluated_at DESC
                """,
                athlete_id,
            )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar las evaluaciones: {str(e)[:200]}",
        )


@router.delete("/{eval_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill_evaluation(
    eval_id: UUID,
    user: User = Depends(verify_token),
):
    """Coach dueño o admin pueden borrar la evaluación."""
    _require_coach(user)
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            target = await conn.fetchrow(
                "SELECT id, coach_id FROM coach_skill_evaluation WHERE id = $1",
                eval_id,
            )
            if target is None:
                raise HTTPException(404, "Evaluación no encontrada")
            if str(target["coach_id"]) != str(user.id) and user.role != "admin":
                raise HTTPException(
                    403,
                    "Solo el coach que creó la evaluación puede borrarla",
                )
            await conn.execute(
                "DELETE FROM coach_skill_evaluation WHERE id = $1",
                eval_id,
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos borrar la evaluación: {str(e)[:200]}",
        )
