from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/v1/agent", tags=["agent-router"])

class QueryRequest(BaseModel):
    user_type: str # "coach" o "athlete"
    query: str
    athlete_state: dict = None

class QueryResponse(BaseModel):
    response: str
    source_methodology: list = []

@router.post("/query", response_model=QueryResponse)
def handle_query(request: QueryRequest):
    """
    Este endpoint representa el Agent Router. 
    Según el tipo de usuario, enruta la petición al modelo RAG correspondiente.
    """
    if request.user_type == "coach":
        # Enviaríamos esto al engine de Programación y Métricas
        return QueryResponse(
            response=f"Evaluando métricas para coach... query original: {request.query}",
            source_methodology=["USAW", "Hyrox"]
        )
    elif request.user_type == "athlete":
        # Enviaríamos al engine empático "Control de Daños" (Huberman + Recuperación)
        estado = request.athlete_state or {}
        return QueryResponse(
            response=f"Control de Daños activado. Evaluando estado de fatiga {estado}... query: {request.query}",
            source_methodology=["Huberman Lab Protocols", "Sleep Science"]
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid user_type")
