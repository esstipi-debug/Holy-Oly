"""
03. Volta WOD Recommender Engine

Recomienda el WOD del día para un atleta de Volta (CrossFit) basado en:
- Readiness del Stress Engine (0-100) + CNS zone
- Intensidad de la sesión de ayer (heavy / medium / light)
- Wellness check-in del día (sleep + soreness + motivation, si existe)
- Skill focuses activos del coach (movimientos a trabajar esta semana)
- Días desde el último metcon / strength day (para variar el estímulo)

Decision tree pragmático → selecciona type (AMRAP / EMOM / For Time / Strength
/ Active Recovery) → filtra templates compatibles → ranking que privilegia
templates que matchean los skill focuses del coach. Output incluye `reasoning`
human-readable explicando POR QUÉ se eligió este WOD hoy.

Es DIFERENCIADOR del producto: ningún tracker de CrossFit hace este loop
wellness + stress + coach skill focus + variedad cíclica → recomendación
personalizada con justificación.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from ..data.volta_wod_templates import WOD_TEMPLATES, get_template_by_id


ENGINE_VERSION = "1.0.0"


# ---------------------------------------------------------------------------
# I/O dataclasses
# ---------------------------------------------------------------------------

@dataclass
class WodRecommendationInput:
    athlete_id: str
    # Stress engine
    readiness: float = 70.0              # 0-100
    cns_zone: Optional[str] = None       # green / yellow / orange / red
    # Yesterday session intensity (calculado por el caller a partir de load)
    yesterday_load_intensity: Optional[str] = None  # 'high' | 'medium' | 'low' | None
    # Wellness check-in opcional del día (puede estar stale o ausente)
    wellness_today: Optional[dict[str, Any]] = None
    # Skill focuses activos del coach (movement_ids · ej ['power_clean', 'snatch'])
    active_skill_focuses: list[str] = field(default_factory=list)
    # Variedad cíclica
    days_since_metcon: int = 1
    days_since_strength: int = 1


@dataclass
class RecommendedWod:
    title: str
    type: str  # 'AMRAP' | 'EMOM' | 'For Time' | 'Strength' | 'Active Recovery'
    duration_sec: int
    movements: list[dict[str, Any]]  # [{name, scaling: {rx, scaled, beginner}, tag}, ...]
    intensity_target: str  # 'low' | 'medium' | 'high'
    reasoning: str
    risk_score: int  # 0-100
    alternatives: list[str] = field(default_factory=list)
    template_id: Optional[str] = None
    engine_version: str = ENGINE_VERSION


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class VoltaWodEngine:
    """
    Decision tree determinístico (no LLM · simple, auditable, sin sorpresas).
    """

    # --- Helpers de derivación ---

    @staticmethod
    def _normalize_cns(zone: Optional[str]) -> Optional[str]:
        if zone is None:
            return None
        z = zone.lower().strip()
        if z in ("green", "yellow", "orange", "red"):
            return z
        return None

    @staticmethod
    def _wellness_signal(wellness: Optional[dict[str, Any]]) -> Optional[str]:
        """
        Convierte el check-in en un signal coarse: 'good' | 'meh' | 'poor' | None.
        Castiga sueño <6h, soreness>=8, motivation<=3.
        """
        if not wellness:
            return None
        sleep = wellness.get("sleep_hours") or 7
        soreness = wellness.get("soreness") or 4
        motivation = wellness.get("motivation") or 6
        score = 0
        score += 2 if sleep >= 7.5 else (1 if sleep >= 6 else -1)
        score += 2 if soreness <= 3 else (1 if soreness <= 6 else -1)
        score += 2 if motivation >= 7 else (1 if motivation >= 5 else -1)
        if score >= 4:
            return "good"
        if score >= 1:
            return "meh"
        return "poor"

    # --- Decision tree ---

    def _decide_type(self, inp: WodRecommendationInput) -> tuple[str, list[str]]:
        """
        Decide el TYPE del WOD y devuelve también los motivos que se usarán
        para construir el `reasoning` final.

        Branches:
        - readiness < 40 OR cns_zone == 'red'   → Active Recovery
        - readiness < 60 OR cns_zone == 'orange'→ EMOM (skill / light)
        - yesterday HIGH + days_since_metcon >1 → AMRAP (metcon medio)
        - days_since_strength >= 3 + readiness>70 → Strength
        - default                               → For Time
        """
        cns = self._normalize_cns(inp.cns_zone)
        wellness = self._wellness_signal(inp.wellness_today)
        motives: list[str] = []

        # Wellness "poor" empuja a recovery aunque el stress engine vea verde
        # (el atleta sabe algo que el modelo no).
        if wellness == "poor":
            motives.append("Tu check-in de hoy marca sueño/soreness comprometidos.")
            return "Active Recovery", motives

        if inp.readiness < 40 or cns == "red":
            motives.append(
                f"Readiness {inp.readiness:.0f} y CNS {cns or 'sin lectura'} — "
                "tu sistema pide bajar carga hoy."
            )
            return "Active Recovery", motives

        if inp.readiness < 60 or cns == "orange":
            motives.append(
                f"Readiness moderado ({inp.readiness:.0f}) — EMOM controlado "
                "para sumar volumen sin reventarte."
            )
            return "EMOM", motives

        if inp.yesterday_load_intensity == "high" and inp.days_since_metcon > 1:
            motives.append(
                "Ayer hiciste sesión heavy → hoy AMRAP medio para mantener "
                "el motor sin sumar fatiga neural."
            )
            return "AMRAP", motives

        if inp.days_since_strength >= 3 and inp.readiness >= 70:
            motives.append(
                f"Hace {inp.days_since_strength} días sin strength y readiness "
                f"{inp.readiness:.0f} — toca día de fuerza."
            )
            return "Strength", motives

        # Default · variado, intenso pero corto
        motives.append(
            f"Readiness {inp.readiness:.0f} con CNS {cns or 'green'} → For Time "
            "variado de intensidad media."
        )
        return "For Time", motives

    # --- Template selection ---

    def _select_template(
        self,
        wod_type: str,
        cns: Optional[str],
        active_focuses: list[str],
    ) -> dict[str, Any]:
        """
        Filtra templates del type elegido. Ranking:
        1. Templates cuyo `good_for_cns_zones` incluye la zona actual (o vacío
           si no hay zona).
        2. Bonus si el template tiene skill_tags que matchean focuses activos.
        Fallback: primer template del type.
        """
        candidates = [t for t in WOD_TEMPLATES if t["type"] == wod_type]
        if not candidates:
            # Type no soportado · fallback duro a recovery
            return next(t for t in WOD_TEMPLATES if t["type"] == "Active Recovery")

        zone = cns or "green"
        focus_set = {f.lower() for f in active_focuses}

        def score(t: dict[str, Any]) -> tuple[int, int]:
            zone_ok = 1 if (not t.get("good_for_cns_zones")) or zone in t["good_for_cns_zones"] else 0
            focus_match = len(focus_set & set(t.get("skill_tags", [])))
            return (zone_ok, focus_match)

        candidates.sort(key=score, reverse=True)
        return candidates[0]

    # --- Risk score (0-100, mayor = más exigente) ---

    @staticmethod
    def _risk_score(template: dict[str, Any], readiness: float) -> int:
        base = {"low": 20, "medium": 50, "high": 80}.get(template["intensity"], 50)
        # Cuanto más bajo el readiness, más riesgo "relativo" tiene la sesión.
        modifier = max(0.0, (75 - readiness) * 0.4)
        return int(max(0, min(100, base + modifier)))

    # --- Reasoning builder ---

    @staticmethod
    def _build_reasoning(motives: list[str], template: dict[str, Any], focuses: list[str]) -> str:
        parts = list(motives)
        if focuses:
            tags = set(template.get("skill_tags", []))
            matched = [f for f in focuses if f.lower() in tags]
            if matched:
                parts.append(
                    "Incluí " + ", ".join(matched) + " porque está en tu foco semanal con el coach."
                )
        parts.append(f"Plantilla: {template['title']} · ~{template['duration_sec']//60} min.")
        return " ".join(parts)

    @staticmethod
    def _alternatives(template: dict[str, Any]) -> list[str]:
        alt: list[str] = []
        if template["type"] in ("AMRAP", "For Time"):
            alt.append("Si no tenés barra disponible, sustituí por EMOM 20 con DBs en casa.")
        if template["type"] == "Strength":
            alt.append("Si el gym está lleno, hacé 5x5 al 70% en lugar de 5x3 al 80%.")
        if template["type"] == "Active Recovery":
            alt.append("Si te sentís mejor a media tarde, mové la sesión a una caminata zona 2 + mobility.")
        if template["type"] == "EMOM":
            alt.append("Si dominás los movimientos, subí 1 round (EMOM 24).")
        return alt

    # --- Public API ---

    def recommend(self, inp: WodRecommendationInput) -> RecommendedWod:
        wod_type, motives = self._decide_type(inp)
        cns = self._normalize_cns(inp.cns_zone)
        template = self._select_template(wod_type, cns, inp.active_skill_focuses)
        risk = self._risk_score(template, inp.readiness)
        reasoning = self._build_reasoning(motives, template, inp.active_skill_focuses)
        return RecommendedWod(
            title=template["title"],
            type=template["type"],
            duration_sec=template["duration_sec"],
            movements=template["movements"],
            intensity_target=template["intensity"],
            reasoning=reasoning,
            risk_score=risk,
            alternatives=self._alternatives(template),
            template_id=template["id"],
            engine_version=ENGINE_VERSION,
        )
