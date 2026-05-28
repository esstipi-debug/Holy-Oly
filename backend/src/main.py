import os
from dotenv import load_dotenv
from pathlib import Path
from contextlib import asynccontextmanager

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

from fastapi import FastAPI, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from .api.router import router
from .api.auth import auth_router, verify_token
from .api.baseline import router as baseline_router
from .api.wod_results import router as wod_results_router
from .api.skill_focus import router as skill_focus_router
from .api.notifications import notifications_router
from .api.wellness import router as wellness_router
from .api.deviations import router as deviations_router
from .api.macro_suggester import router as macro_suggester_router
from .api.volta_wod import router as volta_wod_router
from .api.manual_sessions import router as manual_sessions_router
from .api.hormonal import router as hormonal_router
from .api.progression import router as progression_router
from .api.wods import router as wods_router
from .api.inventory import router as inventory_router
from .api.coach_kpis import router as coach_kpis_router
from .api.macrocycles import router as macrocycles_router
from .api.alerts import router as alerts_router
from .api.lifestyle import router as lifestyle_router
from .api.explain import router as explain_router
from .api.volta import router as volta_router
from .api.skill_evaluation import router as skill_evaluation_router
from .api.analytics import router as analytics_router
from .api.competitor import router as competitor_router, custom_wod_router
from .api.social import router as social_router
from .api.payments import router as payments_router
from .api.admin import router as admin_router
from .rag.router import router as rag_router
from .rag.feedback import router as rag_feedback_router
from .coach.wise_router import router as wise_router
from .api.middleware import SecurityLoggingMiddleware, RateLimitMiddleware
from .api.security_headers import SecurityHeadersMiddleware
from .agents.response_agent.router import router as response_router, set_handlers
from .agents.router import router as agents_router
from .agents.response_agent.email_handler import EmailInboundHandler
from .agents.response_agent.webchat import WebChatHandler
from .agents.response_agent.lead_capture import LeadCapture
from .agents.response_agent.intent_classifier import IntentClassifier
from .agents.response_agent.response_generator import ResponseGenerator
from .scheduler import init_scheduler, scheduler_lifespan, get_all_jobs_status
from .agents.github_researcher import get_researcher
from .agents.budget import get_budget_manager
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("motor25")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan: init agents + scheduler on startup, cleanup on shutdown.
    """
    logger.info("[Motor25] Initializing agents...")

    # DB pool (si esta configurado)
    db_pool = getattr(app, "db_pool", None)

    # Gemini client (si esta configurado)
    gemini_client = getattr(app, "gemini_client", None)

    # --- Budget Manager (self-funding agents) ---
    budget_manager = get_budget_manager(db_pool)
    logger.info("[Motor25] Budget manager initialized. All agents start at Starter tier.")

    # --- Response Agent ---
    intent_classifier = IntentClassifier(gemini_client=gemini_client)
    response_generator = ResponseGenerator(gemini_client=gemini_client, budget_manager=budget_manager)
    lead_capture = LeadCapture(db_pool=db_pool)

    email_handler = EmailInboundHandler(
        intent_classifier=intent_classifier,
        response_generator=response_generator,
        lead_capture=lead_capture,
        resend_api_key=os.getenv("RESEND_API_KEY"),
        budget_manager=budget_manager,
    )

    webchat_handler = WebChatHandler(
        intent_classifier=intent_classifier,
        response_generator=response_generator,
        lead_capture=lead_capture,
    )

    # Set handlers en el router
    set_handlers(email_handler, webchat_handler, lead_capture)

    # --- Other Agents ---
    from .agents.security_agent import SecurityAgent
    from .agents.growth_agent import GrowthAgent
    from .agents.content_agent import ContentAgent

    agents = {
        "test": None,  # Test Agent se crea on-demand
        "security": SecurityAgent(db_pool=db_pool, gemini_client=gemini_client),
        "growth": GrowthAgent(db_pool=db_pool, gemini_client=gemini_client, resend_api_key=os.getenv("RESEND_API_KEY"), budget_manager=budget_manager),
        "content": ContentAgent(db_pool=db_pool, gemini_client=gemini_client),
    }

    # --- GitHub Research Agent (disponible para todos los agentes) ---
    researcher = get_researcher()
    researcher.token = os.getenv("GITHUB_TOKEN")

    # --- Scheduler ---
    init_scheduler(db_pool=db_pool, agents=agents)

    logger.info("[Motor25] Agents initialized. Starting scheduler...")

    async with scheduler_lifespan(app):
        yield

    logger.info("[Motor25] Shutdown complete.")


app = FastAPI(
    title="Holy Oly API",
    description="Smart Training Platform - Stress, Adaptation & Macrocycle Engines + RAG + Motor 25 AI Agents",
    version="1.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Global exception handler (P3)
# ---------------------------------------------------------------------------
# Convierte cualquier excepción NO manejada en JSON `{"detail": "..."}` con
# status 500 · en vez de `text/plain` crudo de uvicorn (que el frontend no puede
# parsear → "Failed to fetch" sin mensaje útil).
#
# IMPORTANTE: NO pisamos los handlers existentes de HTTPException ni de
# RequestValidationError → los re-registramos explícitamente con el comportamiento
# default de FastAPI/Starlette para conservar status codes correctos (401/403/404/422).
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("[Motor25] Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# CORS:
# - Default explícito (no "*") porque `allow_credentials=True` + `*` viola spec
#   y el middleware NO emite el header → frontend ve "Failed to fetch".
# - CORS_ORIGINS env var: AGREGA dominios extra (no reemplaza el default).
#   Esto evita que un env var mal configurado bloquee al frontend principal.
#   El default SIEMPRE incluye los dominios canónicos del producto.
_REQUIRED_ORIGINS = [
    "https://holy-oly.onrender.com",
    "https://holy-oly-3.onrender.com",
    "https://peakqual-v2.onrender.com",  # staging V2 (frontend Claude Design)
    "http://localhost:5173",
    "http://localhost:5174",  # vite fallback cuando 5173 ocupado
    "http://localhost:3000",
]
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
# Merge + dedup (preserva orden insertion)
origins = list(dict.fromkeys(_REQUIRED_ORIGINS + _extra_origins))

app.add_middleware(
    RateLimitMiddleware,
    max_requests=int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100")),
    window_seconds=int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
)

app.add_middleware(SecurityLoggingMiddleware)

# Security headers (HSTS, X-Frame, etc) · agregado ANTES de CORS por orden de wiring.
# NO incluye CSP (rompería Swagger/Redoc). Usa setdefault → no pisa handlers explícitos.
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(baseline_router)
app.include_router(wod_results_router)
app.include_router(skill_focus_router)
app.include_router(notifications_router)
app.include_router(wellness_router)
app.include_router(deviations_router)
app.include_router(macro_suggester_router)
app.include_router(volta_wod_router)
app.include_router(manual_sessions_router)
app.include_router(hormonal_router)
app.include_router(progression_router)
app.include_router(wods_router)
app.include_router(inventory_router)
app.include_router(coach_kpis_router)
app.include_router(macrocycles_router)
app.include_router(alerts_router)
app.include_router(lifestyle_router)
app.include_router(explain_router)
app.include_router(volta_router)
app.include_router(skill_evaluation_router)
app.include_router(analytics_router)
app.include_router(competitor_router)
app.include_router(custom_wod_router)
app.include_router(social_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(router)
app.include_router(rag_router)
app.include_router(rag_feedback_router)
app.include_router(wise_router)
app.include_router(response_router)
app.include_router(agents_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Holy Oly engines + Motor 25 agents running"}


@app.get("/")
def read_root():
    return {
        "module": "Holy Oly API",
        "version": "1.1.0",
        "auth": "/v1/auth/login",
        "docs": "/docs",
        "agents": "/api/v1/agents/status",
        "budget": "/api/v1/agents/budget",
        "research": "/api/v1/agents/research/repos",
        "webchat": "/api/v1/webchat/message",
    }
