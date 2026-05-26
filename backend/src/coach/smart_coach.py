# coach/smart_coach.py
# Holy Oly — Shared coach helpers used by wise_router
# (Legacy run_smart_coach pipeline removed: endpoint /v1/coach/ask deprecated.)

from __future__ import annotations
import os
from typing import Optional
from dataclasses import dataclass, field

from ..infrastructure.mistral_provider import mistral_provider

try:
    from ..infrastructure.gemini_provider import gemini_provider
except Exception:  # pragma: no cover - optional dependency
    gemini_provider = None


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


_MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
_WISE_MAX_TOKENS = int(os.getenv("WISE_MAX_TOKENS", "400"))
_WISE_TEMPERATURE = float(os.getenv("WISE_TEMPERATURE", "0.7"))


def _generate_with_fallback(
    prompt: str,
    system: Optional[str] = None,
    max_tokens: int = _WISE_MAX_TOKENS,
    temperature: float = _WISE_TEMPERATURE,
) -> str:
    """Intenta Mistral primero, cae a Gemini si falla o no está configurado."""
    # Try Mistral
    try:
        out = mistral_provider.generate(
            prompt,
            model=_MISTRAL_MODEL,
            system_instruction=system,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        if out and not out.startswith("Mistral error") and not out.startswith("Mistral not configured"):
            return out
    except Exception as e:
        print(f"[SmartCoach] Mistral failed: {e}")

    # Fallback Gemini
    if gemini_provider is not None:
        try:
            out = gemini_provider.generate_flash(prompt, system_instruction=system)
            if out and not out.startswith("Gemini not configured"):
                return out
        except Exception as e:
            print(f"[SmartCoach] Gemini failed: {e}")

    return "Por ahora estoy sin conexión a mi cerebro. Probá de nuevo en un momento."
