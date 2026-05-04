# rag/chain.py
# Holy Oly — RAG Chain
# Stack: Mistral + pgvector

from typing import Optional
from .service import search_documents
from ..infrastructure.mistral_provider import mistral_provider

RAG_PROMPT_TEMPLATE = """\
Eres el asistente inteligente de Holy Oly, una plataforma de entrenamiento de alto rendimiento.
Responde basándote ÚNICAMENTE en el contexto proporcionado.
Si la información no está en el contexto, di "No tengo esa información en mi base de conocimiento."
Responde en el mismo idioma que la pregunta.

CONTEXTO:
{context}

PREGUNTA:
{question}

RESPUESTA:"""


def _format_context(results: list) -> str:
    if not results:
        return "No se encontraron documentos relevantes."
    parts = []
    for i, r in enumerate(results, 1):
        source = r.get("source", "desconocido")
        content = r.get("content", "")
        parts.append(f"[{i}] ({source})\n{content}")
    return "\n\n".join(parts)


def query_rag(
    question: str,
    k: int = 5,
    filters: Optional[dict] = None,
    temperature: float = 0.2,
) -> str:
    """
    Pipeline RAG completo:
    1. Búsqueda semántica en pgvector
    2. Construcción del prompt con contexto
    3. Generación con Mistral
    """
    results = search_documents(query=question, k=k, filters=filters)
    context = _format_context(results)

    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)

    return mistral_provider.generate(prompt, model="mistral-small-2603")


def query_rag_with_sources(
    question: str,
    k: int = 5,
    filters: Optional[dict] = None,
) -> dict:
    """
    Como query_rag pero retorna también las fuentes usadas.
    """
    results = search_documents(query=question, k=k, filters=filters)
    context = _format_context(results)

    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)
    answer = mistral_provider.generate(prompt, model="mistral-small-latest")

    sources = list({r.get("source", "") for r in results if r.get("source")})

    return {
        "answer": answer,
        "sources": sources,
        "chunks_used": len(results),
    }
