"""
Volta Competitor · tier "competidor" para atletas Volta CrossFit que
preparan Open / Quarterfinals / Semifinals / Games.

Diferencias vs atleta Volta hobbyist:
- Coach define un perfil de competidor (categoría, target event, sessions/sem)
- Open rank tracking (worldwide + regional)
- Coach puede asignar custom WODs que sobreescriben el recommender
- VoltaDashboard renderiza layout extra (banner · rank · nota del coach)

PROFILE endpoints  (/v1/volta/competitor)
  GET    /me                       → atleta · su profile (404 si no es competidor)
  GET    /athlete/{athlete_id}     → coach · perfil de un atleta (admin bypass)
  POST   /promote                  → coach · upsert competidor (asigna o re-asigna)
  PATCH  /me                       → atleta · update parcial (open_rank, category)
  PATCH  /athlete/{athlete_id}     → coach · update parcial
  DELETE /athlete/{athlete_id}     → coach · soft delete (is_competitor=false)

CUSTOM WOD endpoints  (/v1/volta/custom-wod)
  POST   /                         → coach · asigna custom WOD a competidor
  GET    /me/today                 → atleta · su custom WOD del día (404 si no hay)
  GET    /athlete/{athlete_id}     → coach · lista custom WODs del atleta (último mes)
  DELETE /{id}                     → coach · borra propio

Auth ownership:
- PROFILE GET /me, PATCH /me        → atleta autenticado (404 si no tiene profile)
- PROFILE GET/PATCH/DELETE /athlete → coach del atleta o admin
- PROFILE POST /promote             → coach del atleta o admin
- CUSTOM WOD POST/DELETE            → coach dueño · admin bypass
- CUSTOM WOD GET /me/today          → atleta autenticado

Persistencia: volta_competitor_profiles (012) + custom_wods (013).
"""
from datetime import date as date_type, datetime
from typing import Literal, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/volta/competitor", tags=["volta-competitor"])
custom_wod_router = APIRouter(prefix="/v1/volta/custom-wod", tags=["volta-custom-wod"])


CompetitorCategory = Literal["RX", "Scaled", "Masters", "Teens"]
WodType = Literal["AMRAP", "EMOM", "For Time", "Strength", "Skill", "Recovery"]
WodIntensity = Literal["low", "medium", "high"]
WodScale = Literal["rx", "scaled", "beginner"]


# ---------------------------------------------------------------------------
# Pydantic models · profile
# ---------------------------------------------------------------------------

class CompetitorProfile(BaseModel):
    user_id: str
    is_competitor: bool
    open_rank_worldwide: Optional[int] = None
    open_rank_regional: Optional[int] = None
    open_year: Optional[int] = None
    category: CompetitorCategory = "RX"
    target_event: Optional[str] = None
    weekly_volume_target_kg: Optional[int] = None
    weekly_sessions_target: int = 12
    coach_notes: Optional[str] = None
    last_updated: datetime


class CompetitorPromote(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    category: CompetitorCategory = "RX"
    target_event: Optional[str] = Field(default=None, max_length=64)
    weekly_sessions_target: int = Field(default=12, ge=1, le=21)
    weekly_volume_target_kg: Optional[int] = Field(default=None, ge=0, le=200000)
    coach_notes: Optional[str] = Field(default=None, max_length=2000)


class CompetitorUpdateAthlete(BaseModel):
    """Coach-side update · todos los fields del profile editables."""
    category: Optional[CompetitorCategory] = None
    target_event: Optional[str] = Field(default=None, max_length=64)
    weekly_sessions_target: Optional[int] = Field(default=None, ge=1, le=21)
    weekly_volume_target_kg: Optional[int] = Field(default=None, ge=0, le=200000)
    open_rank_worldwide: Optional[int] = Field(default=None, ge=1)
    open_rank_regional: Optional[int] = Field(default=None, ge=1)
    open_year: Optional[int] = Field(default=None, ge=2000, le=2100)
    coach_notes: Optional[str] = Field(default=None, max_length=2000)


class CompetitorUpdateSelf(BaseModel):
    """Athlete-side update · campos limitados (rank desde games.crossfit.com + category)."""
    category: Optional[CompetitorCategory] = None
    open_rank_worldwide: Optional[int] = Field(default=None, ge=1)
    open_rank_regional: Optional[int] = Field(default=None, ge=1)
    open_year: Optional[int] = Field(default=None, ge=2000, le=2100)


# ---------------------------------------------------------------------------
# Pydantic models · custom WOD
# ---------------------------------------------------------------------------

class WodMovement(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    scaling: dict[WodScale, str]  # {rx, scaled, beginner}
    tag: Optional[str] = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name no puede estar vacío")
        return v

    @field_validator("scaling")
    @classmethod
    def _validate_scaling(cls, v: dict) -> dict:
        # Pyd ya garantiza keys válidas; chequeamos que cada string no sea vacío
        for k, val in v.items():
            if not isinstance(val, str) or not val.strip():
                raise ValueError(f"scaling.{k} no puede estar vacío")
        return v


class CustomWodCreate(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    date: date_type
    title: str = Field(..., min_length=1, max_length=120)
    type: WodType
    duration_sec: Optional[int] = Field(default=None, ge=60, le=10800)
    movements: List[WodMovement] = Field(..., min_length=1, max_length=15)
    intensity_target: Optional[WodIntensity] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class CustomWodResponse(BaseModel):
    id: str
    coach_id: str
    athlete_id: str
    date: date_type
    title: str
    type: WodType
    duration_sec: Optional[int] = None
    movements: List[WodMovement]
    intensity_target: Optional[WodIntensity] = None
    notes: Optional[str] = None
    created_at: datetime
    coach_name: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
            detail="Solo coaches pueden ejecutar esta acción",
        )


async def _ensure_owns(user: User, athlete_id: str):
    """Coach binding · admin bypass."""
    if user.role == "admin":
        return
    from ..auth.auth import coach_owns_athlete
    if not await coach_owns_athlete(user.id, athlete_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este atleta no está asignado a tu coaching",
        )


def _profile_row_to_model(row: dict) -> CompetitorProfile:
    return CompetitorProfile(
        user_id=str(row["user_id"]),
        is_competitor=bool(row["is_competitor"]),
        open_rank_worldwide=row.get("open_rank_worldwide"),
        open_rank_regional=row.get("open_rank_regional"),
        open_year=row.get("open_year"),
        category=row.get("category") or "RX",
        target_event=row.get("target_event"),
        weekly_volume_target_kg=row.get("weekly_volume_target_kg"),
        weekly_sessions_target=int(row.get("weekly_sessions_target") or 12),
        coach_notes=row.get("coach_notes"),
        last_updated=row["last_updated"],
    )


def _wod_row_to_response(row: dict) -> CustomWodResponse:
    import json as _json
    raw = row["movements"]
    if isinstance(raw, str):
        raw = _json.loads(raw)
    return CustomWodResponse(
        id=str(row["id"]),
        coach_id=str(row["coach_id"]),
        athlete_id=str(row["athlete_id"]),
        date=row["date"],
        title=row["title"],
        type=row["type"],
        duration_sec=row.get("duration_sec"),
        movements=[WodMovement(**m) for m in raw],
        intensity_target=row.get("intensity_target"),
        notes=row.get("notes"),
        created_at=row["created_at"],
        coach_name=row.get("coach_name"),
    )


# ===========================================================================
# COMPETITOR PROFILE endpoints
# ===========================================================================

@router.get("/me", response_model=CompetitorProfile)
async def get_my_profile(user: User = Depends(verify_token)) -> CompetitorProfile:
    """Atleta · su profile (404 si no es competidor)."""
    pool = await _require_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM volta_competitor_profiles WHERE user_id = $1::uuid",
            user.id,
        )
        if row is None:
            raise HTTPException(404, "No sos atleta competidor todavía")
        return _profile_row_to_model(dict(row))


@router.get("/athlete/{athlete_id}", response_model=CompetitorProfile)
async def get_athlete_profile(
    athlete_id: UUID,
    user: User = Depends(verify_token),
) -> CompetitorProfile:
    """Coach · perfil de un atleta (admin bypass)."""
    _require_coach(user)
    await _ensure_owns(user, str(athlete_id))
    pool = await _require_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM volta_competitor_profiles WHERE user_id = $1",
            athlete_id,
        )
        if row is None:
            raise HTTPException(404, "Este atleta todavía no tiene perfil de competidor")
        return _profile_row_to_model(dict(row))


@router.post(
    "/promote",
    response_model=CompetitorProfile,
    status_code=status.HTTP_200_OK,
)
async def promote_to_competitor(
    payload: CompetitorPromote,
    user: User = Depends(verify_token),
) -> CompetitorProfile:
    """
    Coach asigna (o re-activa) a un atleta como competidor.
    Upsert por user_id · si ya existía, actualiza fields y setea is_competitor=TRUE.
    """
    _require_coach(user)
    await _ensure_owns(user, payload.athlete_id)
    pool = await _require_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO volta_competitor_profiles
              (user_id, is_competitor, category, target_event,
               weekly_sessions_target, weekly_volume_target_kg, coach_notes,
               last_updated)
            VALUES ($1::uuid, TRUE, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
              is_competitor = TRUE,
              category = EXCLUDED.category,
              target_event = EXCLUDED.target_event,
              weekly_sessions_target = EXCLUDED.weekly_sessions_target,
              weekly_volume_target_kg = COALESCE(EXCLUDED.weekly_volume_target_kg,
                                                volta_competitor_profiles.weekly_volume_target_kg),
              coach_notes = COALESCE(EXCLUDED.coach_notes,
                                     volta_competitor_profiles.coach_notes),
              last_updated = NOW()
            RETURNING *
            """,
            payload.athlete_id, payload.category, payload.target_event,
            payload.weekly_sessions_target, payload.weekly_volume_target_kg,
            payload.coach_notes,
        )
        return _profile_row_to_model(dict(row))


@router.patch("/me", response_model=CompetitorProfile)
async def patch_my_profile(
    payload: CompetitorUpdateSelf,
    user: User = Depends(verify_token),
) -> CompetitorProfile:
    """Atleta · update parcial (open rank desde games.crossfit.com + categoría)."""
    updates: dict = payload.model_dump(exclude_none=True)
    if not updates:
        # Nada que cambiar · devolvemos el actual
        return await get_my_profile(user)
    pool = await _require_pool()
    async with pool.acquire() as conn:
        # Verificar que sea competidor primero
        existing = await conn.fetchrow(
            "SELECT 1 FROM volta_competitor_profiles WHERE user_id = $1::uuid AND is_competitor = TRUE",
            user.id,
        )
        if existing is None:
            raise HTTPException(404, "No sos atleta competidor · pedile a tu coach que te promueva")

        set_clauses = []
        values = [user.id]
        for i, (col, val) in enumerate(updates.items(), start=2):
            set_clauses.append(f"{col} = ${i}")
            values.append(val)
        set_clauses.append(f"last_updated = NOW()")
        sql = f"""
            UPDATE volta_competitor_profiles
            SET {', '.join(set_clauses)}
            WHERE user_id = $1::uuid
            RETURNING *
        """
        row = await conn.fetchrow(sql, *values)
        return _profile_row_to_model(dict(row))


@router.patch("/athlete/{athlete_id}", response_model=CompetitorProfile)
async def patch_athlete_profile(
    athlete_id: UUID,
    payload: CompetitorUpdateAthlete,
    user: User = Depends(verify_token),
) -> CompetitorProfile:
    """Coach · update parcial del profile."""
    _require_coach(user)
    await _ensure_owns(user, str(athlete_id))
    updates: dict = payload.model_dump(exclude_none=True)
    pool = await _require_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT 1 FROM volta_competitor_profiles WHERE user_id = $1",
            athlete_id,
        )
        if existing is None:
            raise HTTPException(404, "Este atleta no tiene perfil · usá POST /promote primero")

        if not updates:
            row = await conn.fetchrow(
                "SELECT * FROM volta_competitor_profiles WHERE user_id = $1",
                athlete_id,
            )
            return _profile_row_to_model(dict(row))

        set_clauses = []
        values = [athlete_id]
        for i, (col, val) in enumerate(updates.items(), start=2):
            set_clauses.append(f"{col} = ${i}")
            values.append(val)
        set_clauses.append(f"last_updated = NOW()")
        sql = f"""
            UPDATE volta_competitor_profiles
            SET {', '.join(set_clauses)}
            WHERE user_id = $1
            RETURNING *
        """
        row = await conn.fetchrow(sql, *values)
        return _profile_row_to_model(dict(row))


@router.delete("/athlete/{athlete_id}", status_code=status.HTTP_204_NO_CONTENT)
async def demote_athlete(
    athlete_id: UUID,
    user: User = Depends(verify_token),
):
    """Coach · soft delete (is_competitor=FALSE · preserva rank histórico)."""
    _require_coach(user)
    await _ensure_owns(user, str(athlete_id))
    pool = await _require_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            """
            UPDATE volta_competitor_profiles
            SET is_competitor = FALSE, last_updated = NOW()
            WHERE user_id = $1
            """,
            athlete_id,
        )
        # result is "UPDATE n"
        if result.endswith(" 0"):
            raise HTTPException(404, "Este atleta no tiene perfil de competidor")
    return None


# ===========================================================================
# CUSTOM WOD endpoints
# ===========================================================================

@custom_wod_router.post(
    "",
    response_model=CustomWodResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_custom_wod(
    payload: CustomWodCreate,
    user: User = Depends(verify_token),
) -> CustomWodResponse:
    """
    Coach asigna custom WOD a un atleta competidor. Sobreescribe el Volta WOD
    Recommender para esa fecha.

    409 Conflict si ya hay custom WOD para (athlete, date) · DELETE + POST.
    """
    _require_coach(user)
    await _ensure_owns(user, payload.athlete_id)

    import json as _json
    movements_json = _json.dumps([m.model_dump() for m in payload.movements])

    pool = await _require_pool()
    async with pool.acquire() as conn:
        # Verificar que es competidor
        is_comp = await conn.fetchrow(
            """
            SELECT 1 FROM volta_competitor_profiles
            WHERE user_id = $1::uuid AND is_competitor = TRUE
            """,
            payload.athlete_id,
        )
        if is_comp is None:
            raise HTTPException(
                400,
                "Solo podés asignar custom WODs a atletas marcados como competidores",
            )

        existing = await conn.fetchrow(
            "SELECT id FROM custom_wods WHERE athlete_id = $1::uuid AND date = $2",
            payload.athlete_id, payload.date,
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe un custom WOD para ese día · borralo primero para reemplazar",
            )

        row = await conn.fetchrow(
            """
            WITH inserted AS (
                INSERT INTO custom_wods
                    (coach_id, athlete_id, date, title, type, duration_sec,
                     movements, intensity_target, notes)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7::jsonb, $8, $9)
                RETURNING id, coach_id, athlete_id, date, title, type,
                          duration_sec, movements, intensity_target, notes, created_at
            )
            SELECT i.*, u.name AS coach_name
            FROM inserted i
            LEFT JOIN users u ON u.id = i.coach_id
            """,
            user.id, payload.athlete_id, payload.date, payload.title,
            payload.type, payload.duration_sec, movements_json,
            payload.intensity_target, payload.notes,
        )
        return _wod_row_to_response(dict(row))


@custom_wod_router.get("/me/today", response_model=Optional[CustomWodResponse])
async def get_my_custom_wod_today(
    user: User = Depends(verify_token),
) -> Optional[CustomWodResponse]:
    """
    Atleta · su custom WOD del día (null si no hay). 200 con body=null facilita
    el polling desde el frontend sin manejar 404.
    """
    pool = await _require_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT cw.*, u.name AS coach_name
            FROM custom_wods cw
            LEFT JOIN users u ON u.id = cw.coach_id
            WHERE cw.athlete_id = $1::uuid AND cw.date = CURRENT_DATE
            """,
            user.id,
        )
        if row is None:
            return None
        return _wod_row_to_response(dict(row))


@custom_wod_router.get(
    "/athlete/{athlete_id}",
    response_model=List[CustomWodResponse],
)
async def list_custom_wods_for_athlete(
    athlete_id: UUID,
    user: User = Depends(verify_token),
) -> List[CustomWodResponse]:
    """Coach · custom WODs de un atleta (últimos 30 días)."""
    _require_coach(user)
    await _ensure_owns(user, str(athlete_id))
    pool = await _require_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT cw.*, u.name AS coach_name
            FROM custom_wods cw
            LEFT JOIN users u ON u.id = cw.coach_id
            WHERE cw.athlete_id = $1
              AND cw.date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY cw.date DESC
            """,
            athlete_id,
        )
        return [_wod_row_to_response(dict(r)) for r in rows]


@custom_wod_router.delete("/{wod_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_wod(
    wod_id: UUID,
    user: User = Depends(verify_token),
):
    """Coach borra propio custom WOD. Admin bypass."""
    _require_coach(user)
    pool = await _require_pool()
    async with pool.acquire() as conn:
        target = await conn.fetchrow(
            "SELECT coach_id FROM custom_wods WHERE id = $1",
            wod_id,
        )
        if target is None:
            raise HTTPException(404, "Custom WOD no encontrado")
        if str(target["coach_id"]) != str(user.id) and user.role != "admin":
            raise HTTPException(403, "Solo el coach que creó el WOD puede borrarlo")
        await conn.execute("DELETE FROM custom_wods WHERE id = $1", wod_id)
    return None
