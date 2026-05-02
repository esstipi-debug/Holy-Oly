import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .api.router import router
from .api.auth import auth_router, verify_token
from .rag.router import router as rag_router
from .rag.feedback import router as rag_feedback_router
from .coach.router import router as coach_router
from .api.middleware import SecurityLoggingMiddleware, RateLimitMiddleware

app = FastAPI(
    title="Holy Oly API",
    description="Smart Training Platform - Stress, Adaptation & Macrocycle Engines + RAG",
    version="1.0.0"
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
app.include_router(rag_router)
app.include_router(rag_feedback_router)
app.include_router(coach_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Holy Oly engines running"}

@app.get("/")
def read_root():
    return {
        "module": "Holy Oly API",
        "version": "1.0.0",
        "auth": "/v1/auth/login",
        "docs": "/docs"
    }
