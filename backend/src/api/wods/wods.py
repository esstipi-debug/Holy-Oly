"""
WODs API · Fase 2 refactor API-first
=====================================

Reemplaza los mocks `BENCHMARKS` hardcoded en frontend (data/wodResults.ts y
VoltaStats.tsx) con endpoints reales.

**Endpoints**:
- GET  /v1/wods/benchmarks       → catálogo de benchmarks famosos + mi best
- GET  /v1/wods/today            → WOD del día (custom_wod si coach asignó, sino fallback)
- GET  /v1/wods/me/history       → mis últimos N wod_results con deltas

**No reinventamos**:
- Logging de resultados sigue en POST `/v1/wod-results`
- Recomendación del engine sigue en GET `/v1/volta/wod/today`
- Custom WODs (coach asigna) sigue en /v1/competitor/custom-wods

Este módulo es el "lector unificado" que agrega todo en una shape conveniente.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional, List, Literal

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from ..auth.auth import verify_token
from ..auth.jwt_utils import User
from ...db import users_repo


router = APIRouter(prefix="/v1/wods", tags=["wods"])


# ============================================================================
# Catalog · benchmarks famosos (constante, no cambia)
# ============================================================================

ScoreType = Literal["time", "rounds_reps", "reps", "weight"]
BetterWhen = Literal["lower", "higher"]


class BenchmarkRef(BaseModel):
    id: str
    name: str
    score_type: ScoreType
    better_when: BetterWhen
    description: str
    rx_standard: str


BENCHMARK_CATALOG: List[BenchmarkRef] = [
    BenchmarkRef(id="fran",   name="Fran",   score_type="time",
                 better_when="lower",  description="21-15-9 Thrusters (43kg) + Pull-ups",
                 rx_standard="Sub 5:00"),
    BenchmarkRef(id="helen",  name="Helen",  score_type="time",
                 better_when="lower",  description="3 rondas · 400m Run + 21 KB Swings (24kg) + 12 Pull-ups",
                 rx_standard="Sub 11:00"),
    BenchmarkRef(id="grace",  name="Grace",  score_type="time",
                 better_when="lower",  description="30 Clean & Jerks @ 60kg ♂ / 43kg ♀",
                 rx_standard="Sub 5:00"),
    BenchmarkRef(id="isabel", name="Isabel", score_type="time",
                 better_when="lower",  description="30 Snatches @ 60kg ♂ / 43kg ♀",
                 rx_standard="Sub 5:00"),
    BenchmarkRef(id="murph",  name="Murph",  score_type="time",
                 better_when="lower",  description="1mi Run + 100 PU + 200 Push-up + 300 Squat + 1mi Run",
                 rx_standard="Sub 50:00"),
    BenchmarkRef(id="cindy",  name="Cindy",  score_type="rounds_reps",
                 better_when="higher", description="AMRAP 20: 5 PU + 10 Push-up + 15 Squat",
                 rx_standard="20+ rondas"),
    BenchmarkRef(id="mary",   name="Mary",   score_type="rounds_reps",
                 better_when="higher", description="AMRAP 20: 5 HSPU + 10 Pistols + 15 PU",
                 rx_standard="12+ rondas"),
    BenchmarkRef(id="diane",  name="Diane",  score_type="time",
                 better_when="lower",  description="21-15-9 Deadlifts (102kg) + HSPU",
                 rx_standard="Sub 4:00"),
    BenchmarkRef(id="karen",  name="Karen",  score_type="time",
                 better_when="lower",  description="150 Wall Balls (9kg)",
                 rx_standard="Sub 7:00"),
    BenchmarkRef(id="annie",  name="Annie",  score_type="time",
                 better_when="lower",  description="50-40-30-20-10 Double-Unders + Sit-ups",
                 rx_standard="Sub 7:00"),
]

CATALOG_BY_NAME = {b.name.lower(): b for b in BENCHMARK_CATALOG}


# ============================================================================
# Response schemas
# ============================================================================

class BenchmarkWithMyBest(BaseModel):
    id: str
    name: str
    score_type: ScoreType
    better_when: BetterWhen
    description: str
    rx_standard: str
    # Mi best (puede ser None si no hizo nunca)
    my_best_value: Optional[float] = None
    my_best_rx: Optional[str] = None   # 'rx' | 'scaled'
    my_best_at: Optional[datetime] = None
    # Para mostrar delta en UI: el penúltimo
    my_previous_value: Optional[float] = None


class TodayWodMovement(BaseModel):
    name: str
    scaling: Optional[dict] = None  # {rx, scaled, beginner}
    tag: Optional[str] = None


class TodayWodResponse(BaseModel):
    source: Literal["custom", "engine", "none"]
    title: Optional[str] = None
    type: Optional[str] = None         # AMRAP | EMOM | For Time | Strength | Skill
    duration_sec: Optional[int] = None
    movements: List[TodayWodMovement] = []
    intensity_target: Optional[str] = None
    notes: Optional[str] = None
    # Si es benchmark, link al catálogo
    benchmark_id: Optional[str] = None


class HistoryEntry(BaseModel):
    id: str
    wod_name: str
    rx_or_scaled: str
    score_type: str
    score_value: float
    is_pr: bool
    completed_at: datetime


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/benchmarks", response_model=List[BenchmarkWithMyBest])
async def list_benchmarks_with_my_best(
    user: User = Depends(verify_token),
) -> List[BenchmarkWithMyBest]:
    """
    Lista los 10 benchmarks famosos + mi mejor tiempo en cada uno (si lo tengo).

    Reemplaza el mock `BENCHMARKS` hardcoded en frontend/src/data/wodResults.ts +
    el mock en VoltaStats.tsx con valores literales tipo "3:42".

    Performance: 1 query con JOIN agregado, no N+1.
    """
    pool = await users_repo.get_pool()
    bests_by_name: dict[str, dict] = {}
    previous_by_name: dict[str, float] = {}

    if pool is not None:
        async with pool.acquire() as conn:
            # Para cada wod_name, sacar el best Y el penúltimo
            # Usamos window function para ranking por user_id + wod_name
            rows = await conn.fetch(
                """
                WITH ranked AS (
                    SELECT
                        wod_name,
                        score_value,
                        rx_or_scaled,
                        completed_at,
                        score_type,
                        ROW_NUMBER() OVER (
                            PARTITION BY LOWER(wod_name)
                            ORDER BY
                              CASE
                                WHEN score_type IN ('time') THEN score_value
                                ELSE -score_value
                              END ASC,
                              completed_at DESC
                        ) AS rnk
                    FROM wod_results
                    WHERE user_id = $1::uuid
                )
                SELECT wod_name, score_value, rx_or_scaled, completed_at, score_type, rnk
                FROM ranked
                WHERE rnk <= 2
                """,
                user.id,
            )
            for r in rows:
                key = r["wod_name"].lower()
                if r["rnk"] == 1:
                    bests_by_name[key] = {
                        "value": float(r["score_value"]),
                        "rx": r["rx_or_scaled"],
                        "at": r["completed_at"],
                    }
                elif r["rnk"] == 2:
                    previous_by_name[key] = float(r["score_value"])

    # Combinar catálogo + my best
    result = []
    for b in BENCHMARK_CATALOG:
        key = b.name.lower()
        my = bests_by_name.get(key)
        result.append(BenchmarkWithMyBest(
            id=b.id, name=b.name, score_type=b.score_type, better_when=b.better_when,
            description=b.description, rx_standard=b.rx_standard,
            my_best_value=my["value"] if my else None,
            my_best_rx=my["rx"] if my else None,
            my_best_at=my["at"] if my else None,
            my_previous_value=previous_by_name.get(key),
        ))
    return result


@router.get("/today", response_model=TodayWodResponse)
async def get_today_wod(user: User = Depends(verify_token)) -> TodayWodResponse:
    """
    Retorna el WOD del día.

    Orden de precedencia:
    1. custom_wods · si el coach asignó uno para hoy → ese gana
    2. (futuro) engine recommendation desde /v1/volta/wod/today
    3. Fallback "none" · frontend muestra "Hoy no tenés WOD asignado · escogé un benchmark"

    Reemplaza el mock `WOD` hardcoded en VoltaActiveWod.tsx (Power Clean + Pull-ups + Box Jumps).
    """
    pool = await users_repo.get_pool()
    if pool is None:
        return TodayWodResponse(source="none")

    today = date.today()
    async with pool.acquire() as conn:
        # 1. Custom WOD del coach para hoy
        row = await conn.fetchrow(
            """
            SELECT title, type, duration_sec, movements, intensity_target, notes
              FROM custom_wods
             WHERE athlete_id = $1::uuid AND date = $2
             LIMIT 1
            """,
            user.id, today,
        )
        if row:
            import json as _json
            movs_raw = row["movements"]
            if isinstance(movs_raw, str):
                movs_raw = _json.loads(movs_raw)
            return TodayWodResponse(
                source="custom",
                title=row["title"],
                type=row["type"],
                duration_sec=row["duration_sec"],
                movements=[
                    TodayWodMovement(
                        name=m.get("name", ""),
                        scaling=m.get("scaling"),
                        tag=m.get("tag"),
                    )
                    for m in (movs_raw or [])
                ],
                intensity_target=row["intensity_target"],
                notes=row["notes"],
            )

    # 2. Futuro: integrar con volta_wod engine recommendation
    # 3. Fallback
    return TodayWodResponse(source="none")


@router.get("/me/history", response_model=List[HistoryEntry])
async def get_my_history(
    user: User = Depends(verify_token),
    limit: int = Query(default=50, ge=1, le=200),
) -> List[HistoryEntry]:
    """Historial de mis wod_results · default últimos 50."""
    pool = await users_repo.get_pool()
    if pool is None:
        return []

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, wod_name, rx_or_scaled, score_type, score_value, is_pr, completed_at
              FROM wod_results
             WHERE user_id = $1::uuid
             ORDER BY completed_at DESC
             LIMIT $2
            """,
            user.id, limit,
        )
    return [
        HistoryEntry(
            id=str(r["id"]),
            wod_name=r["wod_name"],
            rx_or_scaled=r["rx_or_scaled"],
            score_type=r["score_type"],
            score_value=float(r["score_value"]),
            is_pr=r["is_pr"],
            completed_at=r["completed_at"],
        )
        for r in rows
    ]
