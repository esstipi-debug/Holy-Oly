"""
02. Session Adaptation Engine

Calculates risk score based on athlete's pre-session check-in:
- Risk Score: 0-100 combining coordination, fatigue, sleep, soreness, mental
- Risk Zones: GREEN, YELLOW, ORANGE, RED
- Degradation Levels: 0-3 per exercise
- Substitutions: chains for complex movements
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class RiskZone(Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class DegradationLevel(Enum):
    NONE = 0  # Execute as planned
    MILD = 1  # Reduce volume
    MODERATE = 2  # Reduce load
    HEAVY = 3  # Substitute or technique


@dataclass
class PreCheckInput:
    """Pre-session check-in data"""
    coordination_score: int  # 1-5 (1=terrible, 5=excellent)
    fatigue_level: int  # 1-5 (1=fresh, 5=destroyed)
    soreness_level: int  # 1-5 (1=none, 5=severe)
    mental_focus: int  # 1-5 (1=unfocused, 5=locked)
    sleep_hours: Optional[float] = None  # numeric hours


@dataclass
class ExercisePlan:
    """Single exercise in a session"""
    exercise_id: str
    exercise_name: str
    sets: int
    reps: int
    weight_pct: float  # % of 1RM
    complexity: int  # 1-10
    cns_demand: int  # 1-10


@dataclass
class AdaptedExercise:
    """Adapted exercise after degradation"""
    exercise_id: str
    exercise_name: str
    sets: int
    reps: int
    weight_pct: float
    degradation_level: int
    reasoning: str
    substituted_from: Optional[str] = None


@dataclass
class RiskBreakdown:
    """Individual risk components"""
    coordination: dict
    fatigue: dict
    sleep: dict
    soreness: dict
    mental: dict


@dataclass
class AdaptationOutput:
    """Output from session adaptation"""
    approved: bool  # Coach can execute
    modified: bool  # Adaptations applied
    risk_score: float
    risk_zone: str
    
    breakdown: RiskBreakdown
    recommendation: str
    
    original_plan: list
    adapted_plan: list
    warnings: list


class SessionAdaptationEngine:
    """Session Adaptation Engine implementation"""
    
    # Risk weights
    WEIGHTS = {
        "coordination": 0.30,
        "fatigue": 0.25,
        "sleep": 0.20,
        "soreness": 0.15,
        "mental": 0.10
    }
    
    # Risk zone thresholds
    ZONES = {
        RiskZone.GREEN: (0, 25),
        RiskZone.YELLOW: (26, 50),
        RiskZone.ORANGE: (51, 75),
        RiskZone.RED: (76, 100)
    }
    
    # Substitutions chains
    SUBSTITUTION_CHAINS = {
        "Snatch": [
            "Snatch Balance",
            "Power Snatch",
            "Hang Snatch",
            "Snatch Pull",
            "Snatch Push Press"
        ],
        "Clean & Jerk": [
            "Power Clean",
            "Hang Clean",
            "Clean Pull",
            "Muscle Clean"
        ],
        "Clean": [
            "Power Clean",
            "Hang Clean",
            "Clean Pull",
            "Muscle Clean"
        ],
        "Jerk": [
            "Power Jerk",
            "Push Jerk",
            "Jerk from Rack"
        ],
        "Back Squat": [
            "Leg Press",
            "Belt Squat",
            "Smith Machine Squat"
        ],
        "Front Squat": [
            "Leg Press",
            "Goblet Squat",
            "Box Squat"
        ],
        "Deadlift": [
            "Deficit Deadlift",
            "Romanian Deadlift",
            "Trap Bar Deadlift"
        ],
        "Bench Press": [
            "Dumbbell Press",
            "Floor Press",
            "Bands Press"
        ]
    }
    
    # Degradation intensity reductions
    DEGRADATION_INTENSITY = {
        DegradationLevel.NONE: 1.0,
        DegradationLevel.MILD: 1.0,  # Keep intensity, reduce sets
        DegradationLevel.MODERATE: 0.75,
        DegradationLevel.HEAVY: 0.40
    }
    
    DEGRADATION_SETS = {
        DegradationLevel.NONE: 1.0,
        DegradationLevel.MILD: 0.6,  # Reduce sets by 40%
        DegradationLevel.MODERATE: 0.6,
        DegradationLevel.HEAVY: 0.4
    }
    
    @staticmethod
    def normalize_coord_risk(score: int) -> float:
        """Coordination: 5=excellent (0 risk), 1=terrible (100 risk)"""
        return ((5 - score) / 4) * 100
    
    @staticmethod
    def normalize_fatigue_risk(level: int) -> float:
        """Fatigue: 1=fresh (0 risk), 5=destroyed (100 risk)"""
        return ((level - 1) / 4) * 100
    
    @staticmethod
    def normalize_soreness_risk(level: int) -> float:
        """Soreness: 1=none (0 risk), 5=severe (100 risk)"""
        return ((level - 1) / 4) * 100
    
    @staticmethod
    def normalize_mental_risk(focus: int) -> float:
        """Mental focus: 5=locked (0 risk), 1=unfocused (100 risk)"""
        return ((5 - focus) / 4) * 100
    
    @staticmethod
    def normalize_sleep_risk(hours: Optional[float]) -> float:
        """Sleep: 8+ hours = 0 risk, 4 hours = 100 risk"""
        if hours is None:
            return 50  # Unknown = moderate risk
        return ((8 - hours) / 4) * 100
    
    @staticmethod
    def calculate_risk_score(pre_check: PreCheckInput) -> float:
        """Calculate final risk score (0-100)"""
        coord_risk = SessionAdaptationEngine.normalize_coord_risk(pre_check.coordination_score)
        fatigue_risk = SessionAdaptationEngine.normalize_fatigue_risk(pre_check.fatigue_level)
        soreness_risk = SessionAdaptationEngine.normalize_soreness_risk(pre_check.soreness_level)
        mental_risk = SessionAdaptationEngine.normalize_mental_risk(pre_check.mental_focus)
        sleep_risk = SessionAdaptationEngine.normalize_sleep_risk(pre_check.sleep_hours)
        
        weighted_sum = (
            coord_risk * SessionAdaptationEngine.WEIGHTS["coordination"] +
            fatigue_risk * SessionAdaptationEngine.WEIGHTS["fatigue"] +
            sleep_risk * SessionAdaptationEngine.WEIGHTS["sleep"] +
            soreness_risk * SessionAdaptationEngine.WEIGHTS["soreness"] +
            mental_risk * SessionAdaptationEngine.WEIGHTS["mental"]
        )
        
        return round(max(0, min(100, weighted_sum)), 1)
    
    @staticmethod
    def get_risk_zone(risk_score: float) -> RiskZone:
        """Map risk score to zone"""
        for zone, (min_val, max_val) in SessionAdaptationEngine.ZONES.items():
            if min_val <= risk_score <= max_val:
                return zone
        return RiskZone.RED
    
    @staticmethod
    def get_risk_zone_name(risk_score: float) -> str:
        """Get zone name string"""
        return SessionAdaptationEngine.get_risk_zone(risk_score).value
    
    @staticmethod
    def get_risk_breakdown(pre_check: PreCheckInput) -> RiskBreakdown:
        """Get detailed risk breakdown"""
        return RiskBreakdown(
            coordination={
                "raw": pre_check.coordination_score,
                "risk": SessionAdaptationEngine.normalize_coord_risk(pre_check.coordination_score)
            },
            fatigue={
                "raw": pre_check.fatigue_level,
                "risk": SessionAdaptationEngine.normalize_fatigue_risk(pre_check.fatigue_level)
            },
            sleep={
                "raw": pre_check.sleep_hours,
                "risk": SessionAdaptationEngine.normalize_sleep_risk(pre_check.sleep_hours)
            },
            soreness={
                "raw": pre_check.soreness_level,
                "risk": SessionAdaptationEngine.normalize_soreness_risk(pre_check.soreness_level)
            },
            mental={
                "raw": pre_check.mental_focus,
                "risk": SessionAdaptationEngine.normalize_mental_risk(pre_check.mental_focus)
            }
        )
    
    @staticmethod
    def calculate_exercise_risk(complexity: int, cns_demand: int) -> float:
        """Calculate exercise-specific risk"""
        return (complexity * 0.6 + cns_demand * 0.4) / 10
    
    @staticmethod
    def determine_degradation_level(
        complexity: int,
        cns_demand: int,
        risk_zone: RiskZone
    ) -> int:
        """Determine degradation level for an exercise"""
        if risk_zone == RiskZone.GREEN:
            return 0
        
        if risk_zone == RiskZone.RED:
            if complexity >= 5:
                return 3
            return 2
        
        # YELLOW or ORANGE
        exercise_risk = SessionAdaptationEngine.calculate_exercise_risk(complexity, cns_demand)
        
        if risk_zone == RiskZone.ORANGE:
            if exercise_risk > 0.7:
                return 3
            elif exercise_risk > 0.4:
                return 2
            return 1
        
        # YELLOW
        if exercise_risk > 0.7:
            return 2
        elif exercise_risk > 0.5:
            return 1
        return 0
    
    @staticmethod
    def get_recommendation(risk_zone: RiskZone, warnings: list) -> str:
        """Get recommendation text based on zone"""
        recommendations = {
            RiskZone.GREEN: "Execute session as planned",
            RiskZone.YELLOW: "Reduce load or simplify variants",
            RiskZone.ORANGE: "Substitute complex exercises + reduce volume",
            RiskZone.RED: "Technique-only with light bar or rest"
        }
        
        base = recommendations[risk_zone]
        
        if warnings:
            base += ". Warnings: " + "; ".join(warnings)
        
        return base
    
    @staticmethod
    def apply_degradation(
        exercise: ExercisePlan,
        degradation_level: int
    ) -> AdaptedExercise:
        """Apply degradation to an exercise"""
        # Get degrdation multipliers
        intensity_mult = SessionAdaptationEngine.DEGRADATION_INTENSITY.get(
            DegradationLevel(degradation_level), 1.0
        )
        sets_mult = SessionAdaptationEngine.DEGRADATION_SETS.get(
            DegradationLevel(degradation_level), 1.0
        )
        
        new_weight_pct = exercise.weight_pct * intensity_mult
        new_sets = max(1, int(exercise.sets * sets_mult))
        
        # Reasoning
        reasonings = {
            0: "Green zone - no change",
            1: "Yellow zone - reduce volume",
            2: "Orange/yellow with high complexity - reduce load",
            3: "Red zone or high risk - heavy degradation or substitute"
        }
        
        return AdaptedExercise(
            exercise_id=exercise.exercise_id,
            exercise_name=exercise.exercise_name,
            sets=new_sets,
            reps=exercise.reps,
            weight_pct=round(new_weight_pct, 1),
            degradation_level=degradation_level,
            reasoning=reasonings.get(degradation_level, "")
        )
    
    @staticmethod
    def get_substitution(exercise_name: str) -> Optional[str]:
        """Get substitution for an exercise (return first in chain)"""
        for base_name, chain in SessionAdaptationEngine.SUBSTITUTION_CHAINS.items():
            if base_name.lower() in exercise_name.lower():
                return chain[0] if len(chain) > 0 else None
        return None
    
    @staticmethod
    def generate_warnings(pre_check: PreCheckInput, breakdown: RiskBreakdown) -> list:
        """Generate warnings based on inputs"""
        warnings = []
        
        if pre_check.sleep_hours and pre_check.sleep_hours < 6:
            warnings.append(f"Sleep was low ({pre_check.sleep_hours}h) - consider extra recovery")
        
        if pre_check.fatigue_level >= 4:
            warnings.append("Fatigue elevated - monitor for overtraining")
        
        if pre_check.coordination_score <= 2:
            warnings.append("Coordination compromised - reduce technical demand")
        
        if pre_check.mental_focus <= 2:
            warnings.append("Mental focus low - consider lighter session")
        
        return warnings
    
    def adapt_session(
        self,
        pre_check: PreCheckInput,
        original_plan: list
    ) -> AdaptationOutput:
        """Main adaptation entry point"""
        
        # Calculate risk
        risk_score = self.calculate_risk_score(pre_check)
        risk_zone = self.get_risk_zone(risk_score)
        
        # Get breakdown
        breakdown = self.get_risk_breakdown(pre_check)
        
        # Generate warnings
        warnings = self.generate_warnings(pre_check, breakdown)
        
        # Determine if modification needed
        modified = risk_zone != RiskZone.GREEN
        
        # Adapt each exercise
        adapted_plan = []
        
        for exercise in original_plan:
            complexity = exercise.complexity
            cns = exercise.cns_demand
            
            degr_level = self.determine_degradation_level(
                complexity, cns, risk_zone
            )
            
            if degr_level >= 3 and risk_zone == RiskZone.RED:
                # Try substitution
                substitution = self.get_substitution(exercise.exercise_name)
                if substitution:
                    adapted = AdaptedExercise(
                        exercise_id=exercise.exercise_id,
                        exercise_name=substitution,
                        sets=max(1, int(exercise.sets * 0.4)),
                        reps=exercise.reps,
                        weight_pct=40.0,
                        degradation_level=3,
                        reasoning="Red zone - substituted for safety",
                        substituted_from=exercise.exercise_name
                    )
                else:
                    adapted = self.apply_degradation(exercise, degr_level)
            else:
                adapted = self.apply_degradation(exercise, degr_level)
            
            adapted_plan.append(adapted)
        
        # Recommendation
        recommendation = self.get_recommendation(risk_zone, warnings)
        
        # Approved always (never blocks)
        approved = True
        
        return AdaptationOutput(
            approved=approved,
            modified=modified,
            risk_score=risk_score,
            risk_zone=risk_zone.value,
            breakdown=breakdown,
            recommendation=recommendation,
            original_plan=[
                {
                    "exercise": e.exercise_name,
                    "sets": e.sets,
                    "reps": e.reps,
                    "weight": f"{e.weight_pct}%",
                    "complexity": e.complexity
                }
                for e in original_plan
            ],
            adapted_plan=[
                {
                    "exercise": a.exercise_name,
                    "sets": a.sets,
                    "reps": a.reps,
                    "weight": f"{a.weight_pct}%",
                    "degradation": a.degradation_level,
                    "reasoning": a.reasoning
                }
                for a in adapted_plan
            ],
            warnings=warnings
        )


# Singleton
session_adaptation_engine = SessionAdaptationEngine()