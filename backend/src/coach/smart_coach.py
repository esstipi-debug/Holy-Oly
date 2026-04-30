# coach/smart_coach.py
# Holy Oly — Smart Coach Pipeline
# RAG (knowledge base) + Athlete DB data -> Gemini personalized answer

from __future__ import annotations
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class AthleteContext:
    """Datos del atleta extraídos de la DB."""
    athlete_id: str
    name: str = "Atleta"
    gender: str = "M"
    snatch_1rm: Optional[float] = None
    clean_1rm: Optional[float] = None
    jerk_1rm: Optional[float] = None
    back_squat_1rm: Optional[float] = None
    # Estado de fatiga/readiness actual (calculado en último check-in)
    readiness: Optional[float] = None
    readiness_category: Optional[str] = None
    cns_zone: Optional[str] = None
    # Datos extra de contexto libre
    extra: dict = field(default_factory=dict)


@dataclass
class CoachResponse:
    answer: str
    athlete_id: str
    sources: list[str]
    chunks_used: int
    has_athlete_data: bool


SMART_COACH_PROMPT = """\
Eres el Smart Coach de Holy Oly, plataforma de alto rendimiento para halterofilia y CrossFit.
Combinas ciencia del entrenamiento con conocimiento real del atleta para dar consejos concretos y accionables.
Responde en el mismo idioma que la pregunta. Sé directo y específico.

=== PERFIL DEL ATLETA ===
{athlete_profile}

=== CONOCIMIENTO TÉCNICO (RAG) ===
{rag_context}

=== PREGUNTA ===
{question}

=== RESPUESTA DEL COACH ===
"""


def _build_athlete_profile(ctx: AthleteContext) -> str:
    lines = [f"Atleta: {ctx.name} | ID: {ctx.athlete_id} | Género: {ctx.gender}"]

    maxes = []
    if ctx.snatch_1rm:
        maxes.append(f"Arranque {ctx.snatch_1rm}kg")
    if ctx.clean_1rm:
        maxes.append(f"Clin {ctx.clean_1rm}kg")
    if ctx.jerk_1rm:
        maxes.append(f"Envión {ctx.jerk_1rm}kg")
    if ctx.back_squat_1rm:
        maxes.append(f"Sentadilla trasera {ctx.back_squat_1rm}kg")
    if maxes:
        lines.append("Maximos: " + ", ".join(maxes))

    if ctx.readiness is not None:
        lines.append(
            f"Estado actual: Readiness {ctx.readiness:.0f}% "
            f"({ctx.readiness_category or 'sin categoría'}) | "
            f"CNS zone: {ctx.cns_zone or 'N/A'}"
        )

    for k, v in ctx.extra.items():
        lines.append(f"{k}: {v}")

    return "\n".join(lines)


def run_smart_coach(
    question: str,
    athlete_ctx: AthleteContext,
    k: int = 6,
    temperature: float = 0.25,
) -> CoachResponse:
    """
    Pipeline completo:
    1. Recuperar contexto RAG
    2. Armar profile del atleta
    3. Llamar Gemini con prompt combinado
    """
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    from ..config import settings
    from ..rag.service import search_documents

    vertexai.init(project=settings.GOOGLE_PROJECT_ID, location=settings.GOOGLE_LOCATION)

    # 1. RAG
    results = search_documents(query=question, k=k)
    rag_parts = []
    for i, r in enumerate(results, 1):
        rag_parts.append(f"[{i}] ({r.get('source', '?')})\n{r.get('content', '')}")
    rag_context = "\n\n".join(rag_parts) if rag_parts else "Sin contexto técnico disponible."

    # 2. Athlete profile
    athlete_profile = _build_athlete_profile(athlete_ctx)
    has_data = bool(
        athlete_ctx.snatch_1rm or athlete_ctx.readiness is not None
    )

    # 3. Prompt + Gemini
    prompt = SMART_COACH_PROMPT.format(
        athlete_profile=athlete_profile,
        rag_context=rag_context,
        question=question,
    )

    model = GenerativeModel("gemini-2.5-flash")
    config = GenerationConfig(temperature=temperature, max_output_tokens=1024)
    response = model.generate_content(prompt, generation_config=config)

    sources = list({r.get("source", "") for r in results if r.get("source")})

    return CoachResponse(
        answer=response.text,
        athlete_id=athlete_ctx.athlete_id,
        sources=sources,
        chunks_used=len(results),
        has_athlete_data=has_data,
    )
