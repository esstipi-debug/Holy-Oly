from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from .auth.auth import verify_token
from ..infrastructure.gemini_provider import gemini_provider
from ..core.rag_retriever import rag_retriever
from ..core.stress_engine import (
    StressEngine, StressEngineInput, StressEngineOutput
)
from ..core.session_adaptation_engine import (
    SessionAdaptationEngine, PreCheckInput, ExercisePlan, AdaptationOutput
)
from ..core.macrocycle_engine import (
    MacrocycleEngine, AthleteMaxes, macrocycle_engine
)

router = APIRouter(
    prefix="/v1", 
    tags=["holy-oly"],
    dependencies=[Depends(verify_token)]
)

# ============ AGENT ROUTER ============

class QueryRequest(BaseModel):
    user_id: str = "guest"
    user_type: str  # "coach" or "athlete"
    query: str
    athlete_state: dict = None


class QueryResponse(BaseModel):
    response: str
    category: str
    context_used: str = ""
    model: str


@router.post("/agent/query", response_model=QueryResponse)
async def handle_agent_query(request: QueryRequest):
    """Agent Router - RAG-powered AI assistant"""
    try:
        routing_prompt = f"""Classify the following training query:
Query: "{request.query}"
User Type: {request.user_type}

Categories: 
- COACH_ANALYTICS: Technical data, PRs, program volume, metrics.
- ATHLETE_RECOVERY: Fatigue, sleep, cold plunge, stress, damage control.
- GENERAL: Other.

Return ONLY the category name.
"""
        category = gemini_provider.generate_flash(routing_prompt).strip()

        rag_data = await rag_retriever.answer_with_context(
            query=request.query,
            user_role=request.user_type
        )

        return QueryResponse(
            response=rag_data["answer"],
            category=category,
            context_used=rag_data["context_used"],
            model=rag_data["model"]
        )
    except Exception as e:
        print(f"[Router Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ STRESS ENGINE ============

class StressInputRequest(BaseModel):
    athlete_id: str
    gender: str = "M"
    age: int = 25
    session_load: float = 0.0
    sleep_hours: Optional[float] = None
    rpe_reported: Optional[float] = None
    rpe_expected: Optional[float] = None
    completed_sessions: int = 0
    planned_sessions: int = 0
    prior_fitness: float = 50.0
    prior_fatigue: float = 50.0
    hrv: Optional[float] = None
    resting_hr: Optional[float] = None
    soreness: Optional[int] = None
    motivation: Optional[int] = None
    life_stress: Optional[int] = None


@router.post("/stress/calculate")
async def calculate_stress(request: StressInputRequest):
    """Calculate fitness, fatigue, and readiness"""
    try:
        input_data = StressEngineInput(
            athlete_id=request.athlete_id,
            gender=request.gender,
            age=request.age,
            session_load=request.session_load,
            sleep_hours=request.sleep_hours,
            rpe_reported=request.rpe_reported,
            rpe_expected=request.rpe_expected,
            completed_sessions=request.completed_sessions,
            planned_sessions=request.planned_sessions,
            prior_fitness=request.prior_fitness,
            prior_fatigue=request.prior_fatigue,
            hrv=request.hrv,
            resting_hr=request.resting_hr,
            soreness=request.soreness,
            motivation=request.motivation,
            life_stress=request.life_stress
        )

        engine = StressEngine()
        result = engine.calculate(input_data)

        return {
            "athlete_id": result.athlete_id,
            "calculated_at": result.calculated_at,
            "fitness": result.fitness,
            "fatigue": result.fatigue,
            "readiness": result.readiness,
            "readiness_category": result.readiness_category,
            "cns_score": result.cns_score,
            "cns_zone": result.cns_zone,
            "breakdown": {
                "base": result.readiness_base,
                "sleep_mod": result.sleep_mod,
                "rpe_divergence_mod": result.rpe_divergence_mod,
                "compliance_mod": result.compliance_mod
            },
            "projection": result.projection
        }
    except Exception as e:
        print(f"[Stress Engine Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ SESSION ADAPTATION ============

class PreCheckRequest(BaseModel):
    coordination_score: int
    fatigue_level: int
    soreness_level: int
    mental_focus: int
    sleep_hours: Optional[float] = None


class ExercisePlanRequest(BaseModel):
    exercise_id: str
    exercise_name: str
    sets: int
    reps: int
    weight_pct: float
    complexity: int
    cns_demand: int


@router.post("/session/adapt")
async def adapt_session(
    pre_check: PreCheckRequest,
    original_plan: List[ExercisePlanRequest]
):
    """Adapt session based on pre-check data"""
    try:
        engine = SessionAdaptationEngine()

        pre_check_data = PreCheckInput(
            coordination_score=pre_check.coordination_score,
            fatigue_level=pre_check.fatigue_level,
            soreness_level=pre_check.soreness_level,
            mental_focus=pre_check.mental_focus,
            sleep_hours=pre_check.sleep_hours
        )

        exercises = [
            ExercisePlan(
                exercise_id=ep.exercise_id,
                exercise_name=ep.exercise_name,
                sets=ep.sets,
                reps=ep.reps,
                weight_pct=ep.weight_pct,
                complexity=ep.complexity,
                cns_demand=ep.cns_demand
            )
            for ep in original_plan
        ]

        result = engine.adapt_session(pre_check_data, exercises)

        return {
            "approved": result.approved,
            "modified": result.modified,
            "risk_score": result.risk_score,
            "risk_zone": result.risk_zone,
            "breakdown": {
                "coordination": result.breakdown.coordination,
                "fatigue": result.breakdown.fatigue,
                "sleep": result.breakdown.sleep,
                "soreness": result.breakdown.soreness,
                "mental": result.breakdown.mental
            },
            "recommendation": result.recommendation,
            "original_plan": result.original_plan,
            "adapted_plan": [
                {
                    "exercise": ap.exercise.exercise_name,
                    "sets": ap.sets,
                    "reps": ap.reps,
                    "weight": f"{ap.weight_pct}%",
                    "degradation": ap.degradation_level,
                    "reasoning": ap.reasoning
                }
                for ap in result.adapted_plan
            ],
            "warnings": result.warnings
        }
    except Exception as e:
        print(f"[Adaptation Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ MACROCYCLE ENGINE ============

class AthleteMaxesRequest(BaseModel):
    snatch: float
    clean: float
    jerk: float
    back_squat: float
    front_squat: float = 0.0
    body_weight: float = 0.0


class GenerateProgramRequest(BaseModel):
    athlete_id: str
    program_id: str
    maxes: AthleteMaxesRequest
    start_date: str


@router.get("/macrocycles")
async def list_macrocycles():
    """List all available macrocycle programs"""
    try:
        programs = MacrocycleEngine.list_programs()
        return {"programs": programs, "total": len(programs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/macrocycles/{program_id}")
async def get_macrocyle(program_id: str):
    """Get specific macrocycle program"""
    try:
        program = MacrocycleEngine.get_program(program_id)
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        return {
            "id": program.id,
            "name": program.name,
            "school": program.school,
            "weeks": program.duration_weeks,
            "focus": program.focus_type,
            "difficulty": program.difficulty_level,
            "sessions_per_week": program.sessions_per_week,
            "description": program.description
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/macrocycles/{program_id}/weeks/{week}")
async def get_week_sessions(program_id: str, week: int):
    """Get sessions for a specific week"""
    try:
        # Return template (would come from DB in production)
        template = MacrocycleEngine.SESSION_TEMPLATES.get(
            program_id,
            MacrocycleEngine.SESSION_TEMPLATES["russian_classic"]
        )
        return {"program_id": program_id, "week": week, "sessions": template}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/macrocycles/generate")
async def generate_program(request: GenerateProgramRequest):
    """Generate full program for athlete"""
    try:
        maxes = AthleteMaxes(
            snatch=request.maxes.snatch,
            clean=request.maxes.clean,
            jerk=request.maxes.jerk,
            back_squat=request.maxes.back_squat,
            front_squat=request.maxes.front_squat,
            body_weight=request.maxes.body_weight
        )

        sessions = MacrocycleEngine.generate_full_program(
            program_id=request.program_id,
            athlete_id=request.athlete_id,
            athlete_maxes=maxes,
            start_date=request.start_date
        )

        return {
            "athlete_id": request.athlete_id,
            "program_id": request.program_id,
            "total_sessions": len(sessions),
            "sessions": sessions
        }
    except Exception as e:
        print(f"[Macrocycle Error] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ HEALTH ============

@router.get("/health")
async def health():
    """Health check"""
    return {
        "status": "ok",
        "engines": {
            "stress": "ready",
            "adaptation": "ready",
            "macrocycle": "ready"
        }
    }


@router.get("/")
async def root():
    """Root endpoint"""
    return {
        "module": "Holy Oly API",
        "version": "1.0.0",
        "endpoints": ["/v1/agent", "/v1/stress", "/v1/session", "/v1/macrocycles"]
    }