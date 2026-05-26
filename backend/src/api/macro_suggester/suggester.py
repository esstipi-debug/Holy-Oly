"""
Macro Suggester API · top-3 macrociclos recomendados al coach por atleta.

POST /v1/macros/suggest
Body: { athlete_id, goal? }
Auth: coach (con coach_owns_athlete check · admin bypass) o atleta sobre sí mismo.

Inputs al engine se calculan en este handler:
  - 1RMs y body_weight ← users.maxes (JSONB) o sub-tabla baseline_results
  - weeks_training ← cuenta de semanas distintas con sesiones (best-effort)
  - fitness_score ← latest stress engine result (best-effort)
  - last_macro_id / weeks_ago ← último macro completado (best-effort)
  - goal ← payload o default 'general_strength'

Diseño defensivo: si DB no está disponible o el atleta no tiene historial,
el engine corre con defaults razonables (beginner · neutro · sin last_macro).
"""
from __future__ import annotations

from typing import Optional, List, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth.auth import verify_token, coach_owns_athlete
from ..auth.jwt_utils import User
from ...db import users_repo
from ...core.macro_suggester import (
    MacroSuggester,
    SuggesterInput,
    MacroSuggestion,
    VALID_GOALS,
)


router = APIRouter(prefix="/v1/macros", tags=["macro-suggester"])

_engine = MacroSuggester()


# ---------------------------------------------------------------------------
# Pydantic
# ---------------------------------------------------------------------------

Goal = Literal[
    "general_strength",
    "snatch_focus",
    "clean_jerk_focus",
    "volume_block",
    "pre_competition",
]


class SuggestRequest(BaseModel):
    athlete_id: str = Field(..., min_length=1)
    goal: Optional[Goal] = None


class SuggestionItem(BaseModel):
    macro_id: str
    macro_name: str
    school: str
    focus: str
    duration_weeks: int
    sessions_per_week: int
    difficulty: int
    score: float
    reasoning: str
    estimated_difficulty: str
    estimated_weeks: int


class SuggestResponse(BaseModel):
    suggestions: List[SuggestionItem]
    rationale: str
    athlete_level: str
    goal: str
    inputs_used: dict


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _load_athlete_profile(athlete_id: str) -> dict:
    """
    Carga best-effort: 1RMs · body_weight · goal · last macro · fitness.
    Si no hay DB o no hay datos, retorna defaults seguros.
    """
    defaults = {
        "snatch_kg": 0.0,
        "clean_jerk_kg": 0.0,
        "back_squat_kg": 0.0,
        "body_weight_kg": 0.0,
        "weeks_training": 0,
        "fitness_score": 50.0,
        "last_macro_id": None,
        "last_macro_completed_weeks_ago": None,
        "goal": "general_strength",
        "product": "holy-oly",
    }

    pool = await users_repo.get_pool()
    if pool is None:
        return defaults

    try:
        async with pool.acquire() as conn:
            # 1) datos básicos del user
            user_row = await conn.fetchrow(
                "SELECT product, maxes, goal FROM users WHERE id = $1::uuid",
                athlete_id,
            )
            if user_row:
                defaults["product"] = user_row.get("product") or "holy-oly"
                if user_row.get("goal"):
                    defaults["goal"] = user_row["goal"]
                maxes = user_row.get("maxes") or {}
                if isinstance(maxes, dict):
                    defaults["snatch_kg"] = float(maxes.get("snatch") or 0)
                    cj = maxes.get("clean_jerk") or maxes.get("clean") or 0
                    defaults["clean_jerk_kg"] = float(cj)
                    defaults["back_squat_kg"] = float(maxes.get("back_squat") or 0)
                    defaults["body_weight_kg"] = float(maxes.get("body_weight") or 0)

            # 2) baseline_results como override si están más fresh (best-effort)
            try:
                br = await conn.fetch(
                    """
                    SELECT test_id, value FROM baseline_results
                    WHERE user_id = $1::uuid
                      AND test_id IN ('snatch_1rm','clean_jerk_1rm','back_squat_1rm','body_weight')
                    """,
                    athlete_id,
                )
                for r in br:
                    tid = r["test_id"]
                    v = float(r["value"]) if r["value"] is not None else 0.0
                    if v <= 0:
                        continue
                    if tid == "snatch_1rm":
                        defaults["snatch_kg"] = v
                    elif tid == "clean_jerk_1rm":
                        defaults["clean_jerk_kg"] = v
                    elif tid == "back_squat_1rm":
                        defaults["back_squat_kg"] = v
                    elif tid == "body_weight":
                        defaults["body_weight_kg"] = v
            except Exception:
                pass  # tabla puede no existir en todos los entornos

            # 3) weeks_training · cuenta semanas distintas con sesiones
            try:
                wk_row = await conn.fetchrow(
                    """
                    SELECT COUNT(DISTINCT DATE_TRUNC('week', completed_at))::int AS weeks
                    FROM generated_sessions
                    WHERE athlete_id = $1::uuid
                      AND status = 'completed'
                    """,
                    athlete_id,
                )
                if wk_row and wk_row["weeks"]:
                    defaults["weeks_training"] = int(wk_row["weeks"])
            except Exception:
                pass

            # 4) last macro completado
            try:
                lm = await conn.fetchrow(
                    """
                    SELECT macrocycle_id,
                           EXTRACT(EPOCH FROM (NOW() - MAX(completed_at)))/604800 AS weeks_ago
                    FROM generated_sessions
                    WHERE athlete_id = $1::uuid AND status = 'completed'
                    GROUP BY macrocycle_id
                    ORDER BY MAX(completed_at) DESC
                    LIMIT 1
                    """,
                    athlete_id,
                )
                if lm and lm["macrocycle_id"]:
                    defaults["last_macro_id"] = str(lm["macrocycle_id"])
                    if lm["weeks_ago"] is not None:
                        defaults["last_macro_completed_weeks_ago"] = int(
                            float(lm["weeks_ago"])
                        )
            except Exception:
                pass

            # 5) fitness latest
            try:
                fit_row = await conn.fetchrow(
                    """
                    SELECT fitness FROM stress_results
                    WHERE athlete_id = $1::uuid
                    ORDER BY computed_at DESC LIMIT 1
                    """,
                    athlete_id,
                )
                if fit_row and fit_row["fitness"] is not None:
                    defaults["fitness_score"] = float(fit_row["fitness"])
            except Exception:
                pass

    except Exception:
        # Cualquier falla DB · devolvemos defaults · el engine sigue siendo útil.
        pass

    return defaults


def _to_item(s: MacroSuggestion) -> SuggestionItem:
    return SuggestionItem(
        macro_id=s.macro_id,
        macro_name=s.macro_name,
        school=s.school,
        focus=s.focus,
        duration_weeks=s.duration_weeks,
        sessions_per_week=s.sessions_per_week,
        difficulty=s.difficulty,
        score=s.score,
        reasoning=s.reasoning,
        estimated_difficulty=s.estimated_difficulty,
        estimated_weeks=s.estimated_weeks,
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/suggest", response_model=SuggestResponse)
async def suggest_macros(
    payload: SuggestRequest,
    user: User = Depends(verify_token),
) -> SuggestResponse:
    """
    Devuelve top-3 macrociclos recomendados para el atleta.

    Autorización:
      - admin: bypass
      - athlete: solo sobre sí mismo
      - coach: debe ser el coach asignado al atleta (coach_owns_athlete)
    """
    if user.role == "athlete":
        if str(user.id) != str(payload.athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo podés pedir sugerencias sobre tu propio perfil",
            )
    elif user.role == "coach":
        if not await coach_owns_athlete(user.id, payload.athlete_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este atleta no está asignado a tu coaching",
            )
    elif user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Rol no autorizado",
        )

    profile = await _load_athlete_profile(payload.athlete_id)

    goal = payload.goal or profile.get("goal") or "general_strength"
    if goal not in VALID_GOALS:
        goal = "general_strength"

    inp = SuggesterInput(
        athlete_id=payload.athlete_id,
        snatch_kg=profile["snatch_kg"],
        clean_jerk_kg=profile["clean_jerk_kg"],
        back_squat_kg=profile["back_squat_kg"],
        body_weight_kg=profile["body_weight_kg"],
        weeks_training=profile["weeks_training"],
        fitness_score=profile["fitness_score"],
        last_macro_id=profile["last_macro_id"],
        last_macro_completed_weeks_ago=profile["last_macro_completed_weeks_ago"],
        goal=goal,
        product=profile["product"],
    )

    suggestions = _engine.suggest(inp, top_n=3)
    rationale = _engine.build_rationale(inp)
    level, _ = _engine.compute_level_index(
        inp.snatch_kg, inp.clean_jerk_kg, inp.back_squat_kg,
        inp.body_weight_kg, inp.weeks_training,
    )

    return SuggestResponse(
        suggestions=[_to_item(s) for s in suggestions],
        rationale=rationale,
        athlete_level=level,
        goal=goal,
        inputs_used={
            "snatch_kg": inp.snatch_kg,
            "clean_jerk_kg": inp.clean_jerk_kg,
            "back_squat_kg": inp.back_squat_kg,
            "body_weight_kg": inp.body_weight_kg,
            "weeks_training": inp.weeks_training,
            "fitness_score": inp.fitness_score,
            "last_macro_id": inp.last_macro_id,
            "last_macro_completed_weeks_ago": inp.last_macro_completed_weeks_ago,
        },
    )
