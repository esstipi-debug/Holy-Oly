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
from .api.middleware import SecurityLoggingMiddleware, RateLimitMiddleware
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("motor25")

# Importaciones opcionales (agentes, RAG, coach, scheduler)
_rag_router = None
_rag_feedback_router = None
_coach_router = None
_response_router = None
_agents_router = None
_set_handlers = None
_init_scheduler = None
_scheduler_lifespan = None

try:
    from .rag.router import router as rag_router_import
    from .rag.feedback import router as rag_feedback_router_import
    _rag_router = rag_router_import
    _rag_feedback_router = rag_feedback_router_import
except Exception as e:
    logger.warning(f"RAG routers not loaded (optional): {e}")

try:
    from .coach.router import router as coach_router_import
    _coach_router = coach_router_import
except Exception as e:
    logger.warning(f"Coach router not loaded (optional): {e}")

try:
    from .agents.response_agent.router import router as response_router_import, set_handlers as set_handlers_import
    from .agents.router import router as agents_router_import
    _response_router = response_router_import
    _agents_router = agents_router_import
    _set_handlers = set_handlers_import
except Exception as e:
    logger.warning(f"Agents routers not loaded (optional): {e}")

try:
    from .scheduler import init_scheduler as init_scheduler_import, scheduler_lifespan as scheduler_lifespan_import
    _init_scheduler = init_scheduler_import
    _scheduler_lifespan = scheduler_lifespan_import
except Exception as e:
    logger.warning(f"Scheduler not loaded (optional): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan: init DB + agents (opcional) + scheduler on startup, cleanup on shutdown.
    """
    # --- Init DB ---
    try:
        from .database import init_db
        await init_db()
        logger.info("[Motor25] Database tables created/verified.")
    except Exception as e:
        logger.warning(f"DB init failed (optional): {e}")

    # --- Agents init (todos opcionales) ---
    try:
        logger.info("[Motor25] Initializing agents...")

        db_pool = getattr(app, "db_pool", None)
        gemini_client = getattr(app, "gemini_client", None)

        from .agents.budget import get_budget_manager
        budget_manager = get_budget_manager(db_pool)
        logger.info("[Motor25] Budget manager initialized.")

        from .agents.response_agent.email_handler import EmailInboundHandler
        from .agents.response_agent.webchat import WebChatHandler
        from .agents.response_agent.lead_capture import LeadCapture
        from .agents.response_agent.intent_classifier import IntentClassifier
        from .agents.response_agent.response_generator import ResponseGenerator

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

        if _set_handlers:
            _set_handlers(email_handler, webchat_handler, lead_capture)

        from .agents.security_agent import SecurityAgent
        from .agents.growth_agent import GrowthAgent
        from .agents.content_agent import ContentAgent

        agents = {
            "test": None,
            "security": SecurityAgent(db_pool=db_pool, gemini_client=gemini_client),
            "growth": GrowthAgent(db_pool=db_pool, gemini_client=gemini_client, resend_api_key=os.getenv("RESEND_API_KEY"), budget_manager=budget_manager),
            "content": ContentAgent(db_pool=db_pool, gemini_client=gemini_client),
        }

        from .agents.github_researcher import get_researcher
        researcher = get_researcher()
        researcher.token = os.getenv("GITHUB_TOKEN")

        if _init_scheduler:
            _init_scheduler(db_pool=db_pool, agents=agents)

        logger.info("[Motor25] Agents initialized.")
    except Exception as e:
        logger.warning(f"Agents initialization failed (optional): {e}")
        agents = {}

    # --- Scheduler lifespan ---
    if _scheduler_lifespan:
        try:
            async with _scheduler_lifespan(app):
                yield
        except Exception as e:
            logger.warning(f"Scheduler lifespan failed (optional): {e}")
            yield
    else:
        yield

    logger.info("[Motor25] Shutdown complete.")


app = FastAPI(
    title="Holy Oly API",
    description="Smart Training Platform - Stress, Adaptation & Macrocycle Engines + RAG + Motor 25 AI Agents",
    version="1.1.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    RateLimitMiddleware,
    max_requests=int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100")),
    window_seconds=int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
)

app.add_middleware(SecurityLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)

# Routers opcionales
if _rag_router:
    app.include_router(_rag_router)
if _rag_feedback_router:
    app.include_router(_rag_feedback_router)
if _coach_router:
    app.include_router(_coach_router)
if _response_router:
    app.include_router(_response_router)
if _agents_router:
    app.include_router(_agents_router)

# Router de atleta (siempre activo)
try:
    from .api.athlete_router import router as athlete_router
    app.include_router(athlete_router)
except Exception as e:
    logger.warning(f"Athlete router not loaded: {e}")

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
