from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.router import router as agent_router

app = FastAPI(
    title="Holy Oly AI Brain",
    description="Backend RAG y Agent Router para la plataforma Holy Oly",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Engine running smoothly"}

@app.get("/")
def read_root():
    return {"module": "Agent Router", "message": "Esperando peticiones..."}

app.include_router(agent_router)

