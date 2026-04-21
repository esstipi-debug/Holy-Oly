from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..infrastructure.gemini_provider import gemini_provider
from ..core.rag_retriever import rag_retriever

router = APIRouter(prefix="/v1/agent", tags=["agent-router"])

class QueryRequest(BaseModel):
    user_id: str = "guest"
    user_type: str # "coach" o "athlete"
    query: str
    athlete_state: dict = None

class QueryResponse(BaseModel):
    response: str
    category: str
    context_used: str = ""
    model: str

@router.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    """
    Enrutador principal de Holy Oly.
    Clasifica la consulta, recupera contexto de pgvector y genera respuesta empática.
    """
    try:
        # 1. Routing via Gemini Flash
        routing_prompt = f"""Classify the following training query for an AI sports assistant:
Query: "{request.query}"
User Type: {request.user_type}

Categories: 
- COACH_ANALYTICS: Technical data, PRs, program volume, metrics.
- ATHLETE_RECOVERY: Fatigue, sleep, cold plunge, stress, damage control.
- GENERAL: Other.

Return ONLY the category name.
"""
        category = gemini_provider.generate_flash(routing_prompt).strip()

        # 2. RAG Augmented Response via Gemini Pro
        # We use the rag_retriever which handles search + generation
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
