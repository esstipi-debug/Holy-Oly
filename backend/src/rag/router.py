# rag/router.py
# Holy Oly — RAG API Router

import os
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from .models import DocumentInput
from .service import add_document, search_documents
from .chain import query_rag, query_rag_with_sources

router = APIRouter(prefix="/v1/rag", tags=["rag"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str
    k: int = 5
    brand: Optional[str] = None       # filtro: 'volta', 'axon', 'holy_oly'
    sport: Optional[str] = None       # filtro: 'crossfit', 'weightlifting'
    topic: Optional[str] = None       # filtro: 'programming', 'nutrition', etc.

class QueryResponse(BaseModel):
    answer: str

class QueryWithSourcesResponse(BaseModel):
    answer: str
    sources: list[str]
    chunks_used: int

class SearchResponse(BaseModel):
    results: list[dict]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/ingest", summary="Indexar un documento")
async def ingest_document(doc: DocumentInput):
    """Ingesta un documento al vector store con su embedding."""
    try:
        add_document(doc)
        return {"message": "Documento indexado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse, summary="Consulta RAG")
async def ask_question(request: QueryRequest):
    """Pipeline RAG completo: búsqueda semántica + Gemini 2.5 Flash."""
    if os.getenv("GOOGLE_API_KEY", "") == "":
        raise HTTPException(
            status_code=503,
            detail="RAG no disponible · GOOGLE_API_KEY no configurada en backend"
        )
    try:
        filters = {
            k: v for k, v in {
                "brand": request.brand,
                "sport": request.sport,
                "topic": request.topic,
            }.items() if v is not None
        }
        answer = query_rag(
            question=request.question,
            k=request.k,
            filters=filters or None,
        )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/sources", response_model=QueryWithSourcesResponse, summary="Consulta RAG con fuentes")
async def ask_with_sources(request: QueryRequest):
    """Como /query pero incluye las fuentes usadas en la respuesta."""
    if os.getenv("GOOGLE_API_KEY", "") == "":
        raise HTTPException(
            status_code=503,
            detail="RAG no disponible · GOOGLE_API_KEY no configurada en backend"
        )
    try:
        filters = {
            k: v for k, v in {
                "brand": request.brand,
                "sport": request.sport,
                "topic": request.topic,
            }.items() if v is not None
        }
        result = query_rag_with_sources(
            question=request.question,
            k=request.k,
            filters=filters or None,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=SearchResponse, summary="Búsqueda semántica directa")
async def semantic_search(
    q: str = Query(..., description="Texto de búsqueda"),
    k: int = Query(5, description="Número de resultados"),
    brand: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
):
    """Devuelve chunks relevantes sin pasar por el LLM."""
    try:
        filters = {
            k_: v for k_, v in {
                "brand": brand,
                "sport": sport,
                "topic": topic,
            }.items() if v is not None
        }
        results = search_documents(query=q, k=k, filters=filters or None)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
