# coach/wise_router.py
# WISE — el coach inteligente de Holy Oly con system prompt viral
# Mistral (primary) -> Gemini (fallback) -> Lite (templates)
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import random

from ..api.auth.auth import verify_token
from .smart_coach import AthleteContext, _generate_with_fallback
from .router import _fetch_athlete

router = APIRouter(prefix="/v1/wise", tags=["wise"])


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class WiseAskRequest(BaseModel):
    question: str
    athlete_id: Optional[str] = None
    # Contexto opcional que el frontend ya tiene (evita roundtrips a DB)
    name: Optional[str] = None
    sport: Optional[str] = None  # "weightlifting" | "crossfit"
    tier: Optional[str] = None
    streak_days: Optional[int] = None
    hrv: Optional[float] = None
    hrv_baseline: Optional[float] = None
    sleep_hours: Optional[float] = None
    vform_color: Optional[str] = None  # "green"|"yellow"|"red"
    belt: Optional[str] = None
    last_pr: Optional[str] = None  # ej "Snatch 105kg"
    macro_block: Optional[str] = None  # ej "Conditioning W4/8"
    role: Optional[Literal["athlete", "coach"]] = "athlete"
    product: Optional[Literal["holy-oly", "volta"]] = "holy-oly"


class WiseAskResponse(BaseModel):
    answer: str
    phrase: Optional[str] = None  # frase viral memorable separada
    level: Literal["llm", "lite"]
    has_athlete_data: bool


# ---------------------------------------------------------------------------
# System prompt viral (del spec)
# ---------------------------------------------------------------------------

WISE_SYSTEM_PROMPT = """\
Sos WISE, el coach inteligente de Holy Oly.

DATOS DEL ATLETA disponibles (cuando vengan): nombre, sport, cinturón/tier, racha,
HRV, sueño, V-Form (semaforo verde/amarillo/rojo), PRs recientes, macrociclo.

REGLAS:
1. Español rioplatense (vos, no tú). Sin "tu", sin "puedes".
2. Cuando el atleta logra algo o pregunta algo importante, generá UNA frase memorable
   que pueda compartir (un tweet).
3. Frase máx 140 chars, una sola idea, sin emojis.
4. Incluí nombre + dato específico cuando exista (peso, racha, cinturón, color V-Form).
5. NUNCA digas "como entrenador", "te recomiendo", "como tu coach". Habla como mentor
   directo. Frases cortas. 3-6 palabras cuando se pueda.
6. Metáforas del deporte (hierro, tatami, barra, viento, kilómetros), no del negocio.
7. Si el HRV está bajo o V-Form rojo: bajá la carga sin paternalismos.
8. Si el HRV está alto y racha viva: empujá. No regales aplausos genéricos.

FORMATO de respuesta:
[Respuesta útil 2-4 oraciones máx]
---
[Frase memorable opcional]

Si no tiene sentido una frase memorable, omití el "---" y la frase.
"""


# ---------------------------------------------------------------------------
# Athlete context builder
# ---------------------------------------------------------------------------

def _build_profile_block(req: WiseAskRequest, db_ctx: AthleteContext) -> tuple[str, bool]:
    """Combina datos de la request + DB. Devuelve (texto, tiene_data_util)."""
    name = req.name or db_ctx.name or "Atleta"
    parts = [f"Nombre: {name}"]

    if req.sport:
        parts.append(f"Sport: {req.sport}")
    if req.role:
        parts.append(f"Rol: {req.role}")
    if req.product:
        parts.append(f"Producto: {req.product}")
    if req.tier:
        parts.append(f"Tier suscripción: {req.tier}")
    if req.belt:
        parts.append(f"Cinturón actual: {req.belt}")
    if req.streak_days is not None:
        parts.append(f"Racha: {req.streak_days} días consecutivos entrenando")
    if req.hrv is not None:
        hrv_line = f"HRV hoy: {req.hrv:.0f}ms"
        if req.hrv_baseline:
            delta = req.hrv - req.hrv_baseline
            tag = "alto" if delta > 5 else ("bajo" if delta < -5 else "normal")
            hrv_line += f" (baseline {req.hrv_baseline:.0f}, {tag})"
        parts.append(hrv_line)
    if req.sleep_hours is not None:
        parts.append(f"Sueño anoche: {req.sleep_hours:.1f}h")
    if req.vform_color:
        parts.append(f"V-Form semáforo: {req.vform_color.upper()}")
    if req.last_pr:
        parts.append(f"Último PR: {req.last_pr}")
    if req.macro_block:
        parts.append(f"Bloque actual: {req.macro_block}")

    # DB-side data (1RMs)
    maxes = []
    if db_ctx.snatch_1rm:
        maxes.append(f"Snatch {db_ctx.snatch_1rm}kg")
    if db_ctx.clean_1rm:
        maxes.append(f"Clean {db_ctx.clean_1rm}kg")
    if db_ctx.jerk_1rm:
        maxes.append(f"Jerk {db_ctx.jerk_1rm}kg")
    if db_ctx.back_squat_1rm:
        maxes.append(f"Back Squat {db_ctx.back_squat_1rm}kg")
    if maxes:
        parts.append("Máximos: " + ", ".join(maxes))

    has_data = bool(
        req.hrv is not None
        or req.streak_days
        or req.vform_color
        or req.last_pr
        or maxes
    )

    return "\n".join(parts), has_data


# ---------------------------------------------------------------------------
# Lite mode (sin LLM)
# ---------------------------------------------------------------------------

LITE_BANK = {
    "hrv_low": [
        "Hoy gana el cuerpo. Mañana ganamos los dos.",
        "El descanso también es entrenamiento. Y hoy te toca.",
        "HRV abajo no es debilidad, es información. Bajá la carga.",
    ],
    "hrv_high": [
        "Cuerpo verde, barra arriba. Hoy se puede.",
        "Sistema listo. La barra está esperando.",
    ],
    "streak": [
        "{streak} días atrás no podías. Hoy no podés parar.",
        "Racha viva, {name}. Eso ya no se compra.",
    ],
    "pr": [
        "El hierro no miente. Hoy dijiste la verdad.",
        "{pr}. Eso ya es tuyo para siempre.",
    ],
    "vform_red": [
        "Rojo es pará. Mañana volvemos.",
        "Cuando el semáforo es rojo, hasta el campeón frena.",
    ],
    "vform_yellow": [
        "Amarillo no es rojo. Pero tampoco es verde.",
        "Amarillo: 80% técnica, 0% ego.",
    ],
    "default": [
        "Una sesión más, {name}. Esa es la diferencia.",
        "Lo que hagas hoy lo vas a tener mañana.",
    ],
}


def _lite_phrase(req: WiseAskRequest) -> str:
    name = req.name or "Atleta"
    if req.vform_color == "red" or (req.hrv_baseline and req.hrv and req.hrv < req.hrv_baseline - 5):
        bank = LITE_BANK["hrv_low"] if req.hrv else LITE_BANK["vform_red"]
    elif req.vform_color == "yellow":
        bank = LITE_BANK["vform_yellow"]
    elif req.last_pr:
        bank = LITE_BANK["pr"]
    elif req.streak_days and req.streak_days >= 7:
        bank = LITE_BANK["streak"]
    elif req.hrv_baseline and req.hrv and req.hrv > req.hrv_baseline + 3:
        bank = LITE_BANK["hrv_high"]
    else:
        bank = LITE_BANK["default"]

    phrase = random.choice(bank).format(
        name=name,
        streak=req.streak_days or 0,
        pr=req.last_pr or "PR",
    )
    return phrase


def _lite_answer(req: WiseAskRequest) -> str:
    """Respuesta heurística inteligente cuando no hay LLM disponible."""
    q = req.question.lower()
    name = req.name or "Atleta"

    if any(w in q for w in ("hoy", "listo", "puedo entrenar", "como estoy")):
        if req.vform_color == "red" or (req.hrv_baseline and req.hrv and req.hrv < req.hrv_baseline - 5):
            return f"{name}, hoy el cuerpo pide bajar la carga. HRV abajo del baseline. Hacé técnica al 60-70% o movilidad."
        if req.vform_color == "yellow":
            return f"Semáforo amarillo, {name}. Trabajá al 80%, foco en técnica. Nada de ir a PR hoy."
        if req.hrv_baseline and req.hrv and req.hrv > req.hrv_baseline + 3:
            return f"Sistema verde, {name}. Hoy podés empujar. Si el plan es fuerza, andá a por intensidad."
        return f"Sin datos de HRV no sé del todo, {name}. Si dormiste bien y comiste, entrená normal."

    if any(w in q for w in ("snatch", "arrancada", "arrancad")):
        max_s = ""  # could query DB but kept light
        return (
            f"Para arrancada: foco en la primera tracción lenta y controlada, segunda explosiva. "
            f"Trabajá un complejo: 1 snatch pull + 1 hang snatch + 1 snatch al 75% del max. 4x3."
        )

    if any(w in q for w in ("clean", "envión", "envion", "jerk")):
        return (
            "Para clean & jerk: encajá el codo rápido en el catch. Trabajá front squat pesado lunes y "
            "complejos de jerk técnico martes/jueves. Sin perder el split de la pierna trasera."
        )

    if any(w in q for w in ("cansado", "agotado", "fatig")):
        return (
            f"{name}, si estás cansado escuchá. Hoy: 30min movilidad + 15min aeróbico zona 1. "
            f"Mañana revisás HRV y decidís. La fatiga acumulada es la peor inversión."
        )

    if any(w in q for w in ("plan", "macro", "semana")):
        if req.macro_block:
            return f"Estás en {req.macro_block}. Mantené adherencia, esa es la única variable que importa esta fase."
        return "Sin un macrociclo cargado no puedo planificar. Definí el objetivo (fuerza/condicional/competencia) y armamos."

    if any(w in q for w in ("hrv", "frecuencia", "ritmo")):
        if req.hrv and req.hrv_baseline:
            delta = req.hrv - req.hrv_baseline
            if delta < -5:
                return f"HRV {req.hrv:.0f}ms, {delta:+.0f} vs baseline. Cuerpo pidiendo recovery. Bajá la carga 24-48h."
            if delta > 5:
                return f"HRV {req.hrv:.0f}ms, {delta:+.0f} vs baseline. Sistema fresco. Hoy podés cargar."
            return f"HRV {req.hrv:.0f}ms, en línea con tu baseline. Entrená según el plan."
        return "Cargá tu lectura de HRV de la mañana y te leo el estado del sistema."

    return (
        f"Estoy con vos, {name}. Decime qué pasa con el entreno (técnica, plan, sensaciones) "
        f"y te ayudo concreto."
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/ask", response_model=WiseAskResponse)
async def wise_ask(req: WiseAskRequest, _: dict = Depends(verify_token)):
    # 1. Cargar contexto DB si tenemos athlete_id válido
    db_ctx = AthleteContext(athlete_id=req.athlete_id or "")
    if req.athlete_id:
        try:
            db_ctx = _fetch_athlete(req.athlete_id)
        except Exception as e:
            print(f"[WISE] DB fetch failed: {e}")

    profile, has_data = _build_profile_block(req, db_ctx)

    # 2. Armar prompt y llamar LLM (Mistral -> Gemini)
    user_prompt = f"""=== PERFIL ===
{profile}

=== PREGUNTA DEL ATLETA ===
{req.question}
"""

    try:
        raw = _generate_with_fallback(user_prompt, system=WISE_SYSTEM_PROMPT)
    except Exception as e:
        print(f"[WISE] generate failed: {e}")
        raw = ""

    # 3. Validar si LLM respondió bien
    is_lite = (
        not raw
        or raw.startswith("Por ahora estoy sin")
        or raw.startswith("Mistral error")
        or raw.startswith("Mistral not configured")
        or raw.startswith("Gemini")
    )

    if is_lite:
        answer = _lite_answer(req)
        phrase = _lite_phrase(req)
        return WiseAskResponse(
            answer=answer,
            phrase=phrase,
            level="lite",
            has_athlete_data=has_data,
        )

    # 4. LLM real — separar respuesta y frase viral
    answer = raw
    phrase: Optional[str] = None
    if "---" in raw:
        parts = raw.split("---", 1)
        answer = parts[0].strip()
        phrase_candidate = parts[1].strip()
        if phrase_candidate and len(phrase_candidate) <= 200:
            phrase = phrase_candidate

    return WiseAskResponse(
        answer=answer,
        phrase=phrase,
        level="llm",
        has_athlete_data=has_data,
    )


@router.get("/health")
async def wise_health():
    return {"status": "ok", "module": "wise"}
