"""
Engine 24 · IA Explica · capa transversal "¿por qué?"

Llamada desde cualquier métrica · chip <ExplainButton> en el frontend dispara
GET /v1/explain/{metric}?context=...

Combina:
- Snapshot del atleta (Stress + Lifestyle + Hormonal + Smart Coach)
- Mistral para generar explicación contextual + empática
- Fallback a templates locales si Mistral falla

Core de la misión: "ganar conciencia de la salud" hecha pregunta-respuesta.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from ..infrastructure.mistral_provider import mistral_provider
from . import smart_coach_engine
from . import lifestyle_service


SYSTEM_PROMPT_BASE = """Sos un coach de halterofilia/CrossFit con base científica.
Tu misión: explicar al atleta QUÉ pasa con su cuerpo cuando ve una métrica.
Estilo:
- Directo · sin filler · sin emojis decorativos
- Frases cortas
- Mencioná 2-3 factores concretos que explican el número
- 1 acción recomendable al final
- NO regañes · NO uses culpa · acompañá
- Si hay decisión mala previa, explicá impacto + plan recuperación
- Máximo 120 palabras
- Tono peer-to-peer · "tu fatiga", "vamos a", "tu cuerpo"
"""


@dataclass
class Explanation:
    metric: str
    value: str
    short_answer: str
    long_answer: str
    factors: list
    suggested_action: Optional[str] = None
    source: str = "ai"  # 'ai' · 'template' · 'cache'


# ============================================================================
# Templates locales · fallback sin Mistral
# ============================================================================

TEMPLATES = {
    "stress_fatigue": {
        "title": "Tu fatiga acumulada",
        "explain": "Tu CTL/ATL (Banister) mide el cansancio acumulado de las últimas semanas. Un valor alto indica que tu sistema necesita recovery.",
        "thresholds": {
            (0, 30):  "Fatiga baja · listo para cargar fuerte",
            (30, 55): "Fatiga moderada · normal tras semana intensa",
            (55, 75): "Fatiga alta · considerá reducir intensidad",
            (75, 100): "Fatiga crítica · deload obligatorio",
        },
    },
    "cns_zone": {
        "title": "Estado del sistema nervioso central",
        "explain": "El CNS responde a carga + sueño + stress. Cuando entra en rojo, fuerza máxima cae 5-15%.",
        "thresholds": None,
    },
    "oly_index": {
        "title": "OLY Index · fuerza relativa",
        "explain": "(Snatch + Clean) / Bodyweight × 100. Estandariza tu fuerza independiente del peso corporal.",
        "thresholds": {
            (0, 150):   "Principiante · base técnica",
            (150, 220): "Intermedio · sólido",
            (220, 280): "Avanzado · competidor regional",
            (280, 350): "Élite · nacional",
            (350, 500): "Top mundial",
        },
    },
    "belt": {
        "title": "Tu disco · conciencia de salud, no volumen",
        "explain": "Subimos de disco cuando combinás 3 cosas: inputs constantes + macrocycle adherence + alertas resueltas a tiempo. NO se sube por tonelaje.",
        "thresholds": None,
    },
    "streak": {
        "title": "Tu racha",
        "explain": "Días consecutivos con actividad o input. Tenés 1 día de gracia · si saltás 2 seguidos, se resetea.",
        "thresholds": None,
    },
    "recovery_debt": {
        "title": "Deuda de recovery",
        "explain": "Combina sueño + stress + alcohol + fumar en un score 0-100. Mayor = peor capacidad de recuperar.",
        "thresholds": {
            (0, 25):  "Recovery OK · sin deuda significativa",
            (25, 50): "Deuda media · ajustar prioridades",
            (50, 75): "Deuda alta · entrenamiento se ve afectado",
            (75, 100): "Deuda crítica · suspendé volumen pesado",
        },
    },
}


def _template_threshold_message(metric: str, value: float) -> Optional[str]:
    t = TEMPLATES.get(metric)
    if not t or not t.get("thresholds"):
        return None
    for (lo, hi), msg in t["thresholds"].items():
        if lo <= value < hi:
            return msg
    return None


# ============================================================================
# Builder · genera prompt con contexto del atleta
# ============================================================================

async def build_context_prompt(user_id: str, metric: str, value: str, context: Optional[str] = None) -> str:
    """Construye prompt con snapshot del atleta."""
    snap_smart = await smart_coach_engine.build_snapshot(user_id)
    snap_life = await lifestyle_service.build_snapshot(user_id)

    parts = [
        f"El atleta consulta '{metric}' con valor '{value}'.",
        f"Contexto: {context}" if context else "",
        "",
        "Estado actual:",
    ]

    if snap_smart.fitness is not None:
        parts.append(f"- Fitness Banister: {snap_smart.fitness:.0f}")
    if snap_smart.fatigue is not None:
        parts.append(f"- Fatiga Banister: {snap_smart.fatigue:.0f}")
    if snap_smart.cns_zone:
        parts.append(f"- CNS: {snap_smart.cns_zone}")
    if snap_smart.cns_consecutive_red >= 2:
        parts.append(f"- CNS rojo {snap_smart.cns_consecutive_red} sesiones consecutivas")
    if snap_smart.rpe_avg_7d is not None:
        parts.append(f"- RPE promedio 7d: {snap_smart.rpe_avg_7d:.1f}")
    if snap_life.sleep_avg_7d is not None:
        parts.append(f"- Sleep promedio 7d: {snap_life.sleep_avg_7d:.1f}h")
    if snap_life.life_stress is not None:
        parts.append(f"- Stress vida hoy: {snap_life.life_stress}/10")
    if snap_life.alcohol_units > 0:
        parts.append(f"- Alcohol hoy: {snap_life.alcohol_units} unidades")
    if snap_life.caffeine_residual_mg:
        parts.append(f"- Cafeína residual: {snap_life.caffeine_residual_mg}mg")
    if snap_smart.hormonal_phase:
        parts.append(f"- Fase hormonal: {snap_smart.hormonal_phase}")
    if snap_life.pain_zones_active > 0:
        parts.append(f"- Dolor activo en {snap_life.pain_zones_active} zonas (máx {snap_life.pain_max_level}/10)")
    if snap_smart.last_pr_date:
        from datetime import date
        days = (date.today() - snap_smart.last_pr_date).days
        parts.append(f"- Último PR hace {days} días")
    if snap_smart.macro_active:
        parts.append(f"- Macrocycle activo: {snap_smart.macro_id}")

    parts.extend([
        "",
        "Explicá en 120 palabras máximo:",
        "1. Qué significa este valor",
        "2. Por qué está en este nivel (1-2 factores convergentes)",
        "3. Qué acción concreta tomar (sin culpa · acompañando)",
    ])
    return "\n".join(p for p in parts if p)


# ============================================================================
# Entry point
# ============================================================================

async def explain(
    user_id: str,
    metric: str,
    value: str = "",
    context: Optional[str] = None,
    use_ai: bool = True,
) -> Explanation:
    """
    Genera explicación contextual de una métrica.
    use_ai=False fuerza template fallback (testing).
    """
    factors: list = []

    # Intentar Mistral
    if use_ai and mistral_provider._configured:
        try:
            prompt = await build_context_prompt(user_id, metric, value, context)
            ai_text = mistral_provider.generate(
                prompt=prompt,
                system_instruction=SYSTEM_PROMPT_BASE,
                max_tokens=300,
                temperature=0.5,
            )
            if ai_text and not ai_text.startswith("Mistral"):
                # Primeras 100 chars como short answer · el resto long
                short = ai_text.split(".")[0][:120] + "."
                return Explanation(
                    metric=metric,
                    value=value,
                    short_answer=short,
                    long_answer=ai_text,
                    factors=factors,
                    source="ai",
                )
        except Exception as e:
            print(f"[explain] Mistral failed: {e}")

    # Fallback template
    t = TEMPLATES.get(metric)
    if not t:
        return Explanation(
            metric=metric,
            value=value,
            short_answer="Sin explicación disponible para esta métrica.",
            long_answer="No tenemos contenido educacional sobre esta métrica todavía.",
            factors=factors,
            source="template",
        )

    threshold_msg = None
    try:
        val_float = float(value)
        threshold_msg = _template_threshold_message(metric, val_float)
    except (ValueError, TypeError):
        pass

    long_text = t["explain"]
    if threshold_msg:
        long_text = f"{threshold_msg}\n\n{t['explain']}"

    return Explanation(
        metric=metric,
        value=value,
        short_answer=t["title"],
        long_answer=long_text,
        factors=factors,
        source="template",
    )
