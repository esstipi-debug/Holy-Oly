"""
Pattern Detector · convierte AnalysisReport en RecommendationCandidates.

8 patrones detectados:
A · Overreach inminente
B · Stagnation
C · Strength bias (3+ sem solo strength · 0 engine)
D · Skill gap (keystones sin entrenar 21+ d)
E · Block mismatch (RPE no llega target del bloque)
F · Domain imbalance (1+ domains 0 sesiones 2 sem)
G · Recovery needed (sleep+stress+RPE convergen)
H · Benchmark due (>90 días sin retest)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, List

from .analyzer import AnalysisReport
from .skill_tree_engine import SkillTreeSnapshot, KEYSTONES


@dataclass
class Factor:
    metric: str
    value: float | str
    threshold: float | str
    note: str = ""


@dataclass
class RecommendationCandidate:
    code: str
    severity: str        # 'critical' | 'warning' | 'info'
    priority: int        # 1-100
    title: str
    description: str
    factors: List[Factor]
    suggested_action: dict


# ============================================================================
# Detectores · cada uno retorna 0 o 1 candidate
# ============================================================================

def detect_overreach(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """A · ACWR >1.5 + RPE alto + adherence bajo."""
    factors: list[Factor] = []

    if report.acwr is not None and report.acwr > 1.5:
        factors.append(Factor("acwr", report.acwr, 1.5, "Carga aguda muy alta vs crónica"))
    if report.rpe_avg_4w > 7.5:
        factors.append(Factor("rpe_avg_4w", report.rpe_avg_4w, 7.5, "RPE promedio elevado"))
    if report.sleep_avg_4w is not None and report.sleep_avg_4w < 6.5:
        factors.append(Factor("sleep_avg_4w", report.sleep_avg_4w, 6.5, "Sueño bajo crónico"))

    if len(factors) >= 2:
        return RecommendationCandidate(
            code="overreach_imminent",
            severity="critical",
            priority=95,
            title="Sobreentrenamiento inminente",
            description=f"Tu carga aguda está {report.acwr}× la crónica · combinado con RPE alto y sueño bajo. Necesitamos deload.",
            factors=factors,
            suggested_action={
                "type": "deload_week",
                "duration_days": 5,
                "volume_pct": 0.6,
                "intensity_cap": 0.7,
                "message": "Próximos 5 días: 60% volumen, máximo RPE 7. Mantener técnica + zone 2.",
            },
        )
    return None


def detect_stagnation(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """B · Sin PR 4+ semanas + RPE zona amarilla repetida."""
    factors: list[Factor] = []

    if report.days_since_last_pr is not None and report.days_since_last_pr >= 28:
        factors.append(Factor(
            "days_since_pr", report.days_since_last_pr, 28,
            f"Sin PR hace {report.days_since_last_pr} días",
        ))
    if 6 < report.rpe_avg_4w <= 8:
        factors.append(Factor("rpe_avg_4w", report.rpe_avg_4w, 7.0, "Zona amarilla persistente"))

    if len(factors) >= 2:
        return RecommendationCandidate(
            code="stagnation",
            severity="warning",
            priority=70,
            title="Estancamiento detectado",
            description=f"Sin PR en {report.days_since_last_pr} días · zona amarilla constante. Posible plateau · cambiar estímulo.",
            factors=factors,
            suggested_action={
                "type": "block_rotation",
                "options": ["change_macrocycle_template", "introduce_new_movement_focus", "increase_intensity_block"],
                "message": "Considerá rotar a un bloque distinto · introducir variante técnica · o subir intensidad target.",
            },
        )
    return None


def detect_skill_gaps(skill_snap: SkillTreeSnapshot, level: int) -> Optional[RecommendationCandidate]:
    """D · Keystones sin entrenar o atleta nivel intermedio sin keystones."""
    if skill_snap.keystones_unlocked < 1 and skill_snap.skills_mastered >= 10:
        return RecommendationCandidate(
            code="skill_gap_no_keystones",
            severity="warning",
            priority=65,
            title="Sin keystones desbloqueados",
            description=f"Tenés {skill_snap.skills_mastered} skills · pero 0 keystones (MU/HSPU/Pistol/etc). Es momento de atacar uno.",
            factors=[
                Factor("skills_mastered", skill_snap.skills_mastered, 10),
                Factor("keystones_unlocked", skill_snap.keystones_unlocked, 1),
            ],
            suggested_action={
                "type": "skill_focus_assign",
                "candidates": skill_snap.skill_gaps[:3],
                "message": "Asignar skill work 2× semana en uno de los gaps prioritarios.",
            },
        )
    if skill_snap.skills_stale >= 5:
        return RecommendationCandidate(
            code="skill_gap_stale",
            severity="info",
            priority=40,
            title=f"{skill_snap.skills_stale} skills sin practicar 21+ días",
            description="Habilidades se atrofian si no se mantienen · refrescar 1 por semana.",
            factors=[Factor("skills_stale", skill_snap.skills_stale, 5)],
            suggested_action={
                "type": "rotate_skill_practice",
                "message": "Engine va a inyectar 1 skill stale por semana en el warmup/skill block.",
            },
        )
    return None


def detect_domain_imbalance(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """F · Dominios sin cubrir 4 semanas."""
    if len(report.domain_gaps) >= 2:
        return RecommendationCandidate(
            code="domain_imbalance",
            severity="warning",
            priority=55,
            title="Desbalance de dominios CompTrain",
            description=f"Dominios sin trabajo en 4 sem: {report.domain_gaps}. El cuerpo necesita 7 capacidades.",
            factors=[Factor("missing_domains", str(report.domain_gaps), "<2")],
            suggested_action={
                "type": "rebalance_domains",
                "target_domains": report.domain_gaps,
                "message": "Próximas 2 semanas: forzar sesiones en estos dominios.",
            },
        )
    return None


def detect_recovery_needed(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """G · Sleep + stress + RPE convergen → recovery."""
    factors: list[Factor] = []

    if report.sleep_avg_4w is not None and report.sleep_avg_4w < 6.5:
        factors.append(Factor("sleep_avg", report.sleep_avg_4w, 6.5))
    if report.stress_avg_4w is not None and report.stress_avg_4w >= 7:
        factors.append(Factor("stress_avg", report.stress_avg_4w, 7.0))
    if report.high_rpe_sessions_pct > 50:
        factors.append(Factor("high_rpe_pct", report.high_rpe_sessions_pct, 50.0))
    if report.pain_zones_active >= 2:
        factors.append(Factor("pain_zones", report.pain_zones_active, 2))

    if len(factors) >= 3:
        return RecommendationCandidate(
            code="recovery_needed",
            severity="critical",
            priority=90,
            title="Recovery prioritario",
            description=f"3+ factores convergen indicando que tu sistema no está recuperando. Pausemos.",
            factors=factors,
            suggested_action={
                "type": "active_recovery_block",
                "duration_days": 3,
                "focus": "mobility_zone2",
                "message": "3 días de movilidad + zone 2 + sleep priority. Sin pesado.",
            },
        )
    return None


def detect_benchmark_due(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """H · 90+ días sin retest benchmark."""
    if report.days_since_last_pr is not None and report.days_since_last_pr > 90:
        return RecommendationCandidate(
            code="benchmark_due",
            severity="info",
            priority=45,
            title="Tiempo de retest benchmark",
            description=f"Hace {report.days_since_last_pr} días sin PR. Programar retest Fran/Helen/Murph esta semana.",
            factors=[Factor("days_since_pr", report.days_since_last_pr, 90)],
            suggested_action={
                "type": "schedule_benchmark",
                "candidates": ["fran", "helen", "grace", "diane"],
                "message": "Engine va a agendar retest en próximo día de Stamina del bloque.",
            },
        )
    return None


def detect_adherence_drop(report: AnalysisReport) -> Optional[RecommendationCandidate]:
    """E · Adherence <70% en 4 sem."""
    if report.adherence_pct < 70 and report.sessions_planned_4w >= 8:
        return RecommendationCandidate(
            code="adherence_drop",
            severity="warning",
            priority=60,
            title=f"Adherencia baja · {report.adherence_pct}%",
            description="El plan no está siendo seguido · necesitamos entender por qué y ajustar.",
            factors=[Factor("adherence_pct", report.adherence_pct, 70.0)],
            suggested_action={
                "type": "consult_coach",
                "message": "Tu coach va a revisar las sesiones perdidas y ajustar el plan a tu realidad actual.",
            },
        )
    return None


# ============================================================================
# Orchestrator
# ============================================================================

def detect_all(
    report: AnalysisReport,
    skill_snapshot: Optional[SkillTreeSnapshot] = None,
) -> List[RecommendationCandidate]:
    """Corre los 7 detectores · retorna lista priorizada por priority desc."""
    candidates: list[RecommendationCandidate] = []

    for detector in (
        detect_overreach,
        detect_stagnation,
        detect_domain_imbalance,
        detect_recovery_needed,
        detect_benchmark_due,
        detect_adherence_drop,
    ):
        rec = detector(report)
        if rec: candidates.append(rec)

    if skill_snapshot is not None and report.athlete_level is not None:
        skill_rec = detect_skill_gaps(skill_snapshot, report.athlete_level)
        if skill_rec: candidates.append(skill_rec)

    candidates.sort(key=lambda c: c.priority, reverse=True)
    return candidates
