# rag/feedback.py
# Peak Qual — Feedback loop del RAG
# Registra respuestas malas y las procesa en el job nocturno

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from ..infrastructure.vector_store import VectorStore

router = APIRouter(prefix="/v1/rag/feedback", tags=["rag-feedback"])

LOW_SCORE_THRESHOLD = 3  # feedback negativos para flaggear un chunk


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    chunk_id:      Optional[str] = None   # ID del chunk recuperado (viene en la respuesta)
    query:         str                    # pregunta que hizo el usuario
    response:      Optional[str] = None  # respuesta que dio el sistema
    feedback_type: str                    # 'wrong' | 'incomplete' | 'outdated' | 'good'
    note:          Optional[str] = None  # comentario libre
    user_id:       Optional[str] = None  # se sobreescribe desde JWT en producción


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/", summary="Registrar feedback sobre una respuesta del RAG")
async def submit_feedback(req: FeedbackRequest):
    """
    El atleta o coach marca una respuesta como mala.
    El job nocturno procesa el feedback y flaggea chunks problemáticos.
    """
    if req.feedback_type not in ("wrong", "incomplete", "outdated", "good"):
        raise HTTPException(status_code=400, detail="feedback_type inválido")

    vs = VectorStore()
    session = vs.Session()
    try:
        session.execute(text("""
            INSERT INTO rag_feedback
              (chunk_id, user_id, query, response, feedback_type, note)
            VALUES
              (:chunk_id, :user_id, :query, :response, :feedback_type, :note)
        """), {
            "chunk_id":      req.chunk_id,
            "user_id":       req.user_id,
            "query":         req.query,
            "response":      req.response,
            "feedback_type": req.feedback_type,
            "note":          req.note,
        })
        session.commit()
        return {"message": "Feedback registrado"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()


@router.get("/flagged", summary="Ver chunks flaggeados por feedback negativo")
async def get_flagged_chunks():
    """Lista chunks marcados como problemáticos para revisión del admin."""
    vs = VectorStore()
    session = vs.Session()
    try:
        rows = session.execute(text("""
            SELECT id, source, LEFT(content, 120) as preview,
                   low_score_count, quality_score, updated_at
            FROM knowledge_base
            WHERE flagged = TRUE
            ORDER BY low_score_count DESC
            LIMIT 50
        """)).fetchall()
        return {"flagged": [dict(r._mapping) for r in rows]}
    finally:
        session.close()


@router.post("/unflag/{chunk_id}", summary="Desmarcar chunk (admin)")
async def unflag_chunk(chunk_id: str):
    """
    Admin confirma que el chunk fue corregido en el .md fuente.
    Resetea flags — el próximo etl_universal.py lo re-ingesta limpio.
    """
    vs = VectorStore()
    session = vs.Session()
    try:
        session.execute(text("""
            UPDATE knowledge_base
            SET flagged = FALSE, low_score_count = 0, quality_score = 1.0
            WHERE id = :id
        """), {"id": chunk_id})
        session.commit()
        return {"message": f"Chunk {chunk_id} desflaggeado"}
    finally:
        session.close()
