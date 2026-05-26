# coach/wise_router.py
# WISE — el coach inteligente de Holy Oly con system prompt viral
# Mistral (primary) -> Gemini (fallback) -> Lite (templates)
from __future__ import annotations

import hashlib
import os
import re
import time
from collections import OrderedDict, defaultdict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import random

from ..api.auth.auth import verify_token
from .smart_coach import AthleteContext, _generate_with_fallback

router = APIRouter(prefix="/v1/wise", tags=["wise"])


# ---------------------------------------------------------------------------
# Per-user rate limiting + prompt sanitization (audit fixes #2 + #4)
# ---------------------------------------------------------------------------

_USER_REQUESTS: dict[str, list[float]] = defaultdict(list)
_WISE_USER_MAX_PER_MIN = int(os.getenv("WISE_USER_MAX_PER_MIN", "20"))
_WISE_USER_MAX_PER_DAY = int(os.getenv("WISE_USER_MAX_PER_DAY", "200"))
_SUSPICIOUS_RE = re.compile(
    r"\b(ignore|ignora|forget|olvida|disregard|previous|previa|prior|anterior|system|sistema|instruction|instrucci)\b",
    re.IGNORECASE,
)


def _check_user_rate_limit(user_id: str) -> Optional[str]:
    """Per-user in-memory rate limit. Retorna None si OK, mensaje si excedió."""
    if not user_id:
        # Sin user_id no podemos limitar per-user; dejamos pasar (global middleware igual aplica).
        return None
    now = time.time()
    history = _USER_REQUESTS[user_id]
    cutoff_day = now - 86400
    history[:] = [t for t in history if t > cutoff_day]
    if len(history) >= _WISE_USER_MAX_PER_DAY:
        return f"Límite diario alcanzado ({_WISE_USER_MAX_PER_DAY} consultas/día)"
    cutoff_min = now - 60
    recent = sum(1 for t in history if t > cutoff_min)
    if recent >= _WISE_USER_MAX_PER_MIN:
        return f"Límite por minuto alcanzado ({_WISE_USER_MAX_PER_MIN}/min)"
    history.append(now)
    return None


def _sanitize_question(q: Optional[str]) -> str:
    """Trim, truncate 500 chars, strip control chars (excepto \\n y \\t)."""
    if not q:
        return ""
    q = q.strip()[:500]
    q = "".join(
        c for c in q
        if c == "\n" or c == "\t" or not (ord(c) < 32 or ord(c) == 127)
    )
    return q


# ---------------------------------------------------------------------------
# LRU cache para respuestas WISE (audit fix · ahorra 30-50% tokens)
# ---------------------------------------------------------------------------

_WISE_CACHE_ENABLED = os.getenv("WISE_CACHE_ENABLED", "true").lower() in ("true", "1", "yes")
_WISE_CACHE_MAX = 256
_WISE_CACHE_TTL = 3600  # 1 hora
_WHITESPACE_RE = re.compile(r"\s+")

# OrderedDict permite LRU manual (move_to_end + popitem(last=False)).
# Cada entry: {"answer": str, "phrase": Optional[str], "ts": float}
_WISE_CACHE: "OrderedDict[tuple, dict]" = OrderedDict()


def _normalize_question(q: str) -> str:
    """Lowercase + collapse whitespace + strip punctuation final para hashing estable."""
    n = _WHITESPACE_RE.sub(" ", q.lower().strip())
    # strip puntuación trailing común (?, !, .)
    return n.rstrip("?!. ")


def _cache_key(question: str, athlete_id: str, tier: str) -> tuple:
    qhash = hashlib.md5(_normalize_question(question).encode("utf-8")).hexdigest()
    return (qhash, athlete_id or "", tier or "")


def _cache_get(key: tuple) -> Optional[dict]:
    if not _WISE_CACHE_ENABLED:
        return None
    entry = _WISE_CACHE.get(key)
    if entry is None:
        return None
    if (time.time() - entry["ts"]) > _WISE_CACHE_TTL:
        # Expirado — descartar
        _WISE_CACHE.pop(key, None)
        return None
    # LRU touch
    _WISE_CACHE.move_to_end(key)
    return entry


def _cache_set(key: tuple, entry: dict) -> None:
    if not _WISE_CACHE_ENABLED:
        return
    entry = {
        "answer": entry.get("answer", ""),
        "phrase": entry.get("phrase"),
        "ts": time.time(),
    }
    _WISE_CACHE[key] = entry
    _WISE_CACHE.move_to_end(key)
    # Evict si supera cap
    while len(_WISE_CACHE) > _WISE_CACHE_MAX:
        _WISE_CACHE.popitem(last=False)


# ---------------------------------------------------------------------------
# Async athlete fetch (audit fix · evita engine sync por request)
# ---------------------------------------------------------------------------

async def _fetch_athlete_async(athlete_id: str) -> AthleteContext:
    """Lee datos del atleta vía asyncpg pool. Si no hay pool/usuario, retorna ctx vacío."""
    if not athlete_id:
        return AthleteContext(athlete_id="")
    try:
        from ..db import users_repo
        pool = await users_repo.get_pool()
        if pool is None:
            # Sin pool asyncpg disponible → no rompemos, ctx vacío
            return AthleteContext(athlete_id=athlete_id)
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT name, gender,
                       snatch_1rm, clean_1rm, jerk_1rm, back_squat_1rm
                FROM users
                WHERE id = $1::uuid
                LIMIT 1
                """,
                athlete_id,
            )
        if not row:
            return AthleteContext(athlete_id=athlete_id)
        return AthleteContext(
            athlete_id=athlete_id,
            name=row["name"] or "Atleta",
            gender=row["gender"] or "M",
            snatch_1rm=float(row["snatch_1rm"]) if row["snatch_1rm"] else None,
            clean_1rm=float(row["clean_1rm"]) if row["clean_1rm"] else None,
            jerk_1rm=float(row["jerk_1rm"]) if row["jerk_1rm"] else None,
            back_squat_1rm=float(row["back_squat_1rm"]) if row["back_squat_1rm"] else None,
        )
    except Exception as e:
        print(f"[WISE] async DB fetch failed for {athlete_id}: {e}")
        return AthleteContext(athlete_id=athlete_id)


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
    cached: bool = False


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
async def wise_ask(req: WiseAskRequest, current_user=Depends(verify_token)):
    # 0. Rate limit per-user (audit fix #2) + sanitización (#4)
    user_id = getattr(current_user, "id", None) or ""
    err = _check_user_rate_limit(user_id)
    if err:
        raise HTTPException(status_code=429, detail=err)

    question = _sanitize_question(req.question)
    if not question:
        raise HTTPException(status_code=400, detail="Pregunta vacía")
    if _SUSPICIOUS_RE.search(question):
        print(
            f"[WISE] suspicious question pattern from user={user_id}: {question[:100]}"
        )
    # Usar question sanitizada para el resto del flow
    req.question = question

    # 1. Cargar contexto DB si tenemos athlete_id válido (async asyncpg)
    db_ctx = AthleteContext(athlete_id=req.athlete_id or "")
    if req.athlete_id:
        db_ctx = await _fetch_athlete_async(req.athlete_id)

    profile, has_data = _build_profile_block(req, db_ctx)

    # 1.5 · Cache lookup (solo si tenemos athlete_id, para no compartir cache anónimo cruzado)
    cache_key = _cache_key(question, req.athlete_id or user_id or "anon", req.tier or "free")
    cached = _cache_get(cache_key)
    if cached is not None:
        return WiseAskResponse(
            answer=cached["answer"],
            phrase=cached.get("phrase"),
            level="llm",
            has_athlete_data=has_data,
            cached=True,
        )

    # 2. Armar prompt y llamar LLM (Mistral -> Gemini)
    user_prompt = f"""=== PERFIL ===
{profile}

=== PREGUNTA DEL ATLETA ===
{question}
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

    # 5. Guardar en cache (solo level=llm, NO lite por el branch de arriba)
    _cache_set(cache_key, {"answer": answer, "phrase": phrase})

    return WiseAskResponse(
        answer=answer,
        phrase=phrase,
        level="llm",
        has_athlete_data=has_data,
        cached=False,
    )


@router.get("/health")
async def wise_health():
    return {"status": "ok", "module": "wise"}
