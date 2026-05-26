import os
from dotenv import load_dotenv
from pathlib import Path
from contextlib import asynccontextmanager

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
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
from .api.skill_evaluation import router as skill_evaluation_router
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

# CORS:
# - Default explícito (no "*") porque `allow_credentials=True` + `*` viola spec
#   y el middleware NO emite el header → frontend ve "Failed to fetch".
# - CORS_ORIGINS env var: AGREGA dominios extra (no reemplaza el default).
#   Esto evita que un env var mal configurado bloquee al frontend principal.
#   El default SIEMPRE incluye los dominios canónicos del producto.
_REQUIRED_ORIGINS = [
    "https://holy-oly.onrender.com",
    "https://holy-oly-3.onrender.com",
    "http://localhost:5173",
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
app.include_router(skill_evaluation_router)
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
