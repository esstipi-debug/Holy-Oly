# coach/router.py
# Holy Oly — Smart Coach API Router

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text

from ..api.auth.auth import verify_token
from ..infrastructure.vector_store import VectorStore
from .smart_coach import AthleteContext, CoachResponse, run_smart_coach

router = APIRouter(prefix="/v1/coach", tags=["smart-coach"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CoachAskRequest(BaseModel):
    athlete_id: str
    question: str
    k: int = 6
    # Override de estado — si el cliente ya calculó readiness (post check-in)
    readiness: Optional[float] = None
    readiness_category: Optional[str] = None
    cns_zone: Optional[str] = None


class CoachAskResponse(BaseModel):
    answer: str
    athlete_id: str
    sources: list[str]
    chunks_used: int
    has_athlete_data: bool


# ---------------------------------------------------------------------------
# Helper: fetch athlete data from DB
# ---------------------------------------------------------------------------

def _fetch_athlete(athlete_id: str) -> AthleteContext:
    """Obtiene perfil del atleta desde AlloyDB. Falla silencioso si no existe."""
    try:
        from sqlalchemy import create_engine
        import os

        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            return AthleteContext(athlete_id=athlete_id)

        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT name, gender,
                           snatch_1rm, clean_1rm, jerk_1rm, back_squat_1rm
                    FROM users
                    WHERE id = :uid
                    LIMIT 1
                """),
                {"uid": athlete_id},
            ).fetchone()

        if not row:
            return AthleteContext(athlete_id=athlete_id)

        return AthleteContext(
            athlete_id=athlete_id,
            name=row[0] or "Atleta",
            gender=row[1] or "M",
            snatch_1rm=float(row[2]) if row[2] else None,
            clean_1rm=float(row[3]) if row[3] else None,
            jerk_1rm=float(row[4]) if row[4] else None,
            back_squat_1rm=float(row[5]) if row[5] else None,
        )
    except Exception as e:
        # DB no disponible — continuar sin datos de atleta
        print(f"[SmartCoach] DB fetch failed for {athlete_id}: {e}")
        return AthleteContext(athlete_id=athlete_id)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/ask",
    response_model=CoachAskResponse,
    summary="Smart Coach - RAG + datos del atleta",
)
async def coach_ask(
    request: CoachAskRequest,
    _: dict = Depends(verify_token),
):
    """
    Pipeline Smart Coach:
    1. Fetch datos del atleta (DB)
    2. RAG retrieval (knowledge base)
    3. Gemini genera respuesta personalizada
    """
    try:
        # 1. Datos atleta
        ctx = _fetch_athlete(request.athlete_id)

        # 2. Merge override de readiness si viene en la request
        if request.readiness is not None:
            ctx.readiness = request.readiness
        if request.readiness_category is not None:
            ctx.readiness_category = request.readiness_category
        if request.cns_zone is not None:
            ctx.cns_zone = request.cns_zone

        # 3. Pipeline
        result = run_smart_coach(
            question=request.question,
            athlete_ctx=ctx,
            k=request.k,
        )

        return CoachAskResponse(
            answer=result.answer,
            athlete_id=result.athlete_id,
            sources=result.sources,
            chunks_used=result.chunks_used,
            has_athlete_data=result.has_athlete_data,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", summary="Smart Coach health check")
async def coach_health():
    return {"status": "ok", "module": "smart-coach"}
