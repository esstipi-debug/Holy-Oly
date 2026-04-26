# rag/service.py
# Holy Oly — RAG Service
# Stack: Vertex AI (text-embedding-004) + Cloud SQL Postgres + pgvector

from typing import List, Dict, Any, Optional
from ..infrastructure.vector_store import VectorStore
from .models import DocumentInput

# Instancia compartida
_vector_store: Optional[VectorStore] = None

def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store


def add_document(doc: DocumentInput) -> bool:
    """Genera embedding e ingesta un documento al vector store."""
    vs = get_vector_store()
    import uuid
    doc_id = str(uuid.uuid4())
    vs.upsert(
        id=doc_id,
        content=doc.content,
        metadata=doc.metadata or {},
        source=doc.metadata.get("source", "api") if doc.metadata else "api",
    )
    return True


def search_documents(
    query: str,
    k: int = 5,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Búsqueda semántica con filtros opcionales de metadata."""
    vs = get_vector_store()
    return vs.search(query=query, limit=k, filters=filters)
