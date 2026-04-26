# rag/chain.py
# Holy Oly — RAG Chain
# Stack: Vertex AI Gemini 2.5 Flash + pgvector

import os
from typing import Optional
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from .service import search_documents
from ..config import settings

# Inicializar Vertex AI
vertexai.init(
    project=settings.GOOGLE_PROJECT_ID,
    location=settings.GOOGLE_LOCATION,
)

MODEL_ID = "gemini-2.5-flash"

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
    3. Generación con Gemini 2.5 Flash
    """
    # 1. Recuperar contexto relevante
    results = search_documents(query=question, k=k, filters=filters)
    context = _format_context(results)

    # 2. Construir prompt
    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)

    # 3. Generar respuesta
    model = GenerativeModel(MODEL_ID)
    config = GenerationConfig(temperature=temperature, max_output_tokens=1024)
    response = model.generate_content(prompt, generation_config=config)

    return response.text


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

    model = GenerativeModel(MODEL_ID)
    config = GenerationConfig(temperature=0.2, max_output_tokens=1024)
    response = model.generate_content(prompt, generation_config=config)

    sources = list({r.get("source", "") for r in results if r.get("source")})

    return {
        "answer": response.text,
        "sources": sources,
        "chunks_used": len(results),
    }
