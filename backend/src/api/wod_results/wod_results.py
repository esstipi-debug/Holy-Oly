"""
WOD Results · endpoints para Volta (CrossFit benchmark tracking).

POST   /v1/wod-results                  → crea + retorna con is_pr calculado
GET    /v1/wod-results                  → lista del user (filtros: wod_name?, limit?)
GET    /v1/wod-results/best/{wod_name}  → mejor PR del user para ese WOD
DELETE /v1/wod-results/{id}             → borra si pertenece al user

Persistencia: tabla `wod_results` (ver migration 006_wod_results.sql).

Lógica is_pr:
- score_type == 'time'                            → mejor = score_value MENOR
- score_type in (rounds_reps, reps, weight)       → mejor = score_value MAYOR
- Se compara contra histórico previo del mismo (user_id, wod_name, rx_or_scaled).
- Si el nuevo es mejor: el viejo PR pierde el flag y el nuevo lo recibe.
"""
from datetime import datetime
from typing import Literal, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/wod-results", tags=["wod-results"])


ScoreType  = Literal["time", "rounds_reps", "reps", "weight"]
RxOrScaled = Literal["rx", "scaled"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class WodResultCreate(BaseModel):
    wod_name: str = Field(..., min_length=1, max_length=120)
    rx_or_scaled: RxOrScaled
    score_type: ScoreType
    score_value: float = Field(..., gt=0, le=10000)
    notes: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("wod_name")
    @classmethod
    def _strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("wod_name no puede estar vacío")
        return v


class WodResultResponse(BaseModel):
    id: str
    user_id: str
    wod_name: str
    rx_or_scaled: RxOrScaled
    score_type: ScoreType
    score_value: float
    notes: Optional[str] = None
    completed_at: datetime
    is_pr: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_better(score_type: str, new_value: float, prev_value: float) -> bool:
    """Mejor = menor para 'time', mayor para el resto."""
    if score_type == "time":
        return new_value < prev_value
    return new_value > prev_value


def _row_to_response(row: dict) -> WodResultResponse:
    return WodResultResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        wod_name=row["wod_name"],
        rx_or_scaled=row["rx_or_scaled"],
        score_type=row["score_type"],
        score_value=float(row["score_value"]),
        notes=row.get("notes"),
        completed_at=row["completed_at"],
        is_pr=bool(row["is_pr"]),
    )


async def _require_pool():
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DB no disponible — configurá DATABASE_URL",
        )
    return pool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED, response_model=WodResultResponse)
async def create_wod_result(
    payload: WodResultCreate,
    user: User = Depends(verify_token),
) -> WodResultResponse:
    """
    Guarda un resultado de WOD.
    Calcula is_pr vs histórico del user (mismo wod_name + rx_or_scaled).
    Si el nuevo es mejor, baja el flag del PR anterior.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                # 1. ¿hay PR previo?
                prev_pr = await conn.fetchrow(
                    """
                    SELECT id, score_value
                    FROM wod_results
                    WHERE user_id = $1::uuid
                      AND wod_name = $2
                      AND rx_or_scaled = $3
                      AND is_pr = true
                    LIMIT 1
                    """,
                    user.id, payload.wod_name, payload.rx_or_scaled,
                )

                # 2. ¿el nuevo es PR?
                if prev_pr is None:
                    is_pr = True
                else:
                    is_pr = _is_better(
                        payload.score_type,
                        payload.score_value,
                        float(prev_pr["score_value"]),
                    )
                    # Si el nuevo gana, bajamos el flag del anterior
                    if is_pr:
                        await conn.execute(
                            "UPDATE wod_results SET is_pr = false WHERE id = $1",
                            prev_pr["id"],
                        )

                # 3. Insert
                row = await conn.fetchrow(
                    """
                    INSERT INTO wod_results
                        (user_id, wod_name, rx_or_scaled, score_type, score_value, notes, is_pr)
                    VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
                    RETURNING id, user_id, wod_name, rx_or_scaled, score_type,
                              score_value, notes, completed_at, is_pr
                    """,
                    user.id, payload.wod_name, payload.rx_or_scaled,
                    payload.score_type, payload.score_value,
                    payload.notes, is_pr,
                )
                return _row_to_response(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos guardar el resultado: {str(e)[:200]}",
        )


@router.get("", response_model=List[WodResultResponse])
async def list_wod_results(
    wod_name: Optional[str] = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(verify_token),
) -> List[WodResultResponse]:
    """Lista resultados del user, más recientes primero. Filtros opcionales."""
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            if wod_name:
                rows = await conn.fetch(
                    """
                    SELECT id, user_id, wod_name, rx_or_scaled, score_type,
                           score_value, notes, completed_at, is_pr
                    FROM wod_results
                    WHERE user_id = $1::uuid AND wod_name = $2
                    ORDER BY completed_at DESC
                    LIMIT $3
                    """,
                    user.id, wod_name, limit,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT id, user_id, wod_name, rx_or_scaled, score_type,
                           score_value, notes, completed_at, is_pr
                    FROM wod_results
                    WHERE user_id = $1::uuid
                    ORDER BY completed_at DESC
                    LIMIT $2
                    """,
                    user.id, limit,
                )
            return [_row_to_response(dict(r)) for r in rows]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos listar resultados: {str(e)[:200]}",
        )


@router.get("/best/{wod_name}", response_model=Optional[WodResultResponse])
async def best_wod_result(
    wod_name: str,
    rx_or_scaled: Optional[RxOrScaled] = Query(default=None),
    user: User = Depends(verify_token),
):
    """
    Mejor histórico (PR) del user para un WOD. Opcionalmente filtrado por rx/scaled.
    Devuelve null si no hay registros.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            if rx_or_scaled:
                row = await conn.fetchrow(
                    """
                    SELECT id, user_id, wod_name, rx_or_scaled, score_type,
                           score_value, notes, completed_at, is_pr
                    FROM wod_results
                    WHERE user_id = $1::uuid
                      AND wod_name = $2
                      AND rx_or_scaled = $3
                      AND is_pr = true
                    LIMIT 1
                    """,
                    user.id, wod_name, rx_or_scaled,
                )
            else:
                # Sin filtro de escala: devolvemos el PR rx si existe, sino scaled
                row = await conn.fetchrow(
                    """
                    SELECT id, user_id, wod_name, rx_or_scaled, score_type,
                           score_value, notes, completed_at, is_pr
                    FROM wod_results
                    WHERE user_id = $1::uuid
                      AND wod_name = $2
                      AND is_pr = true
                    ORDER BY CASE WHEN rx_or_scaled = 'rx' THEN 0 ELSE 1 END
                    LIMIT 1
                    """,
                    user.id, wod_name,
                )
            if row is None:
                return None
            return _row_to_response(dict(row))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos buscar el PR: {str(e)[:200]}",
        )


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wod_result(
    result_id: UUID,
    user: User = Depends(verify_token),
):
    """
    Borra un resultado del user.
    Si el resultado borrado era el PR, recalcula el PR sobre los registros que quedan.
    """
    pool = await _require_pool()
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                # Confirmamos ownership + capturamos info para el recálculo
                target = await conn.fetchrow(
                    """
                    SELECT id, wod_name, rx_or_scaled, score_type, is_pr
                    FROM wod_results
                    WHERE id = $1 AND user_id = $2::uuid
                    """,
                    result_id, user.id,
                )
                if target is None:
                    raise HTTPException(404, "Resultado no encontrado")

                await conn.execute(
                    "DELETE FROM wod_results WHERE id = $1",
                    result_id,
                )

                # Si era el PR, el siguiente mejor histórico hereda el flag
                if target["is_pr"]:
                    if target["score_type"] == "time":
                        order_clause = "ORDER BY score_value ASC, completed_at DESC"
                    else:
                        order_clause = "ORDER BY score_value DESC, completed_at DESC"

                    next_best = await conn.fetchrow(
                        f"""
                        SELECT id FROM wod_results
                        WHERE user_id = $1::uuid
                          AND wod_name = $2
                          AND rx_or_scaled = $3
                        {order_clause}
                        LIMIT 1
                        """,
                        user.id, target["wod_name"], target["rx_or_scaled"],
                    )
                    if next_best is not None:
                        await conn.execute(
                            "UPDATE wod_results SET is_pr = true WHERE id = $1",
                            next_best["id"],
                        )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"No pudimos borrar el resultado: {str(e)[:200]}",
        )
