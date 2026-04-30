"""
01. Stress Engine - Banister Fitness-Fatigue Model

Calculates athlete readiness using the Banister model:
- Fitness Score: Long-term training adaptation (28-day EMA)
- Fatigue Score: Short-term accumulated stress (7-day EMA)
- Readiness: Current readiness to train
- CNS Score: Central nervous system state (independent)
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
import math


@dataclass
class StressEngineInput:
    """Input data for stress calculation"""
    athlete_id: str
    gender: str = "M"  # 'M' or 'F'
    age: int = 25
    
    # Training data
    session_load: float = 0.0  # Sets × Reps × Weight × RPE × Intensity × Sport
    
    # Daily metrics
    sleep_hours: Optional[float] = None
    rpe_reported: Optional[float] = None
    rpe_expected: Optional[float] = None
    
    # Compliance (last 7 days)
    completed_sessions: int = 0
    planned_sessions: int = 0
    
    # CNS signals (optional)
    hrv: Optional[float] = None
    resting_hr: Optional[float] = None
    soreness: Optional[int] = None  # 1-10
    motivation: Optional[int] = None  # 1-10
    life_stress: Optional[int] = None  # 1-10
    
    # Prior state (for EMA continuation)
    prior_fitness: float = 50.0
    prior_fatigue: float = 50.0


@dataclass
class StressEngineOutput:
    """Output from stress calculation"""
    athlete_id: str
    calculated_at: str
    
    # Core scores
    fitness: float
    fatigue: float
    readiness: float
    readiness_category: str  # "Low", "Moderate", "High"
    
    # CNS score
    cns_score: Optional[float] = None
    cns_zone: Optional[str] = None
    
    # Breakdown
    readiness_base: float = 0.0
    sleep_mod: float = 0.0
    rpe_divergence_mod: float = 0.0
    compliance_mod: float = 0.0
    
    # Projection (next 28 days)
    projection: list = None
    
    def __post_init__(self):
        if self.projection is None:
            self.projection = []


class StressEngine:
    """Banister Fitness-Fatigue Model implementation"""
    
    # Fatigue window by age
    FATIGUE_WINDOWS = {
        (0, 24): 5,
        (25, 34): 7,
        (35, 44): 9,
        (45, 100): 11
    }
    
    # Fitness window by age
    FITNESS_WINDOWS = {
        (0, 24): 21,
        (25, 34): 28,
        (35, 44): 35,
        (45, 100): 42
    }
    
    # RPE factors
    RPE_FACTORS = {
        10: 1.00, 9.5: 0.975, 9: 0.95, 8.5: 0.925,
        8: 0.90, 7.5: 0.875, 7: 0.85, 6.5: 0.825,
        6: 0.80, 5.5: 0.775, 5: 0.75
    }
    
    # Intensity multipliers
    INTENSITY_MULTIPLIERS = {
        (0, 70): 1.0,      # Metabolic/Hypertrophy
        (70, 85): 1.2,     # Strength
        (85, 95): 1.5,      # High CNS
        (95, 100): 2.0     # Maximum Neural Drive
    }
    
    @staticmethod
    def get_window(windows: dict, age: int) -> int:
        """Get window value for age"""
        for (min_age, max_age), window in windows.items():
            if min_age <= age <= max_age:
                return window
        return 7  # Default
    
    @staticmethod
    def get_alpha(age: int) -> float:
        """Get fatigue alpha (2 / (window + 1))"""
        window = StressEngine.get_window(StressEngine.FATIGUE_WINDOWS, age)
        return 2 / (window + 1)
    
    @staticmethod
    def get_beta(age: int) -> float:
        """Get fitness beta (2 / (window + 1))"""
        window = StressEngine.get_window(StressEngine.FITNESS_WINDOWS, age)
        return 2 / (window + 1)
    
    @staticmethod
    def get_rpe_factor(rpe: float) -> float:
        """Get RPE factor"""
        if rpe is None:
            return 1.0
        # Find closest RPE
        rpe = max(5, min(10, rpe))
        closest = min(StressEngine.RPE_FACTORS.keys(), key=lambda x: abs(x - rpe))
        return StressEngine.RPE_FACTORS[closest]
    
    @staticmethod
    def get_intensity_multiplier(intensity_pct: float) -> float:
        """Get intensity multiplier based on %1RM"""
        for (min_int, max_int), mult in StressEngine.INTENSITY_MULTIPLIERS.items():
            if min_int <= intensity_pct < max_int:
                return mult
        return 1.0
    
    @staticmethod
    def calculate_session_load(
        sets: int,
        reps: int,
        weight: float,
        rpe: float,
        intensity_pct: float,
        sport: str = "halterofilia"
    ) -> float:
        """Calculate training load for a single exercise
        
        Formula: Load = Sets × Reps × Weight × RPE × Intensity × Sport
        """
        rpe_factor = StressEngine.get_rpe_factor(rpe)
        intensity_mult = StressEngine.get_intensity_multiplier(intensity_pct)
        
        # Sport bias
        sport_bias = {"halterofilia": 1.0, "crossfit": 1.2, "hyrox": 1.2}.get(sport, 1.0)
        
        load = sets * reps * weight * rpe_factor * intensity_mult * sport_bias
        return round(load, 2)
    
    @staticmethod
    def calculate_fitness(beta: float, load: float, prior_fitness: float) -> float:
        """Fitness EMA - builds slowly, persists longer"""
        fitness = beta * load + (1 - beta) * prior_fitness
        return round(fitness, 2)
    
    @staticmethod
    def calculate_fatigue(alpha: float, load: float, prior_fatigue: float) -> float:
        """Fatigue EMA - decays fast"""
        fatigue = alpha * load + (1 - alpha) * prior_fatigue
        return round(fatigue, 2)
    
    @staticmethod
    def calculate_readiness_base(fitness: float, fatigue: float) -> float:
        """Base readiness: (Fitness - Fatigue) / Fitness × 100"""
        if fitness <= 0:
            return 0.0
        readiness = ((fitness - fatigue) / fitness) * 100
        return round(max(0, min(100, readiness)), 2)
    
    @staticmethod
    def apply_sleep_modifier(sleep_hours: float, gender: str) -> float:
        """Sleep modifier affects readiness"""
        if sleep_hours is None:
            return 0.0
        
        if gender == "M":
            if sleep_hours < 6:
                return -10
            elif sleep_hours < 7:
                return -5
        else:  # F
            if sleep_hours < 7:
                return -10
            elif sleep_hours < 8:
                return -5
        
        return 0.0
    
    @staticmethod
    def apply_rpe_divergence_modifier(rpe_reported: float, rpe_expected: float) -> float:
        """RPE divergence modifier"""
        if rpe_reported is None or rpe_expected is None:
            return 0.0
        
        divergence = rpe_reported - rpe_expected
        if divergence > 1.5:
            return -5
        return 0.0
    
    @staticmethod
    def apply_compliance_modifier(completed: int, planned: int) -> float:
        """Compliance modifier based on completion rate"""
        if planned == 0:
            return 0.0
        
        rate = (completed / planned) * 100
        
        if rate < 50:
            return -7
        elif rate < 70:
            return -3
        return 0.0
    
    @staticmethod
    def calculate_cns_score(
        hrv: Optional[float] = None,
        sleep_hours: Optional[float] = None,
        resting_hr: Optional[float] = None,
        soreness: Optional[int] = None,
        motivation: Optional[int] = None,
        life_stress: Optional[int] = None,
        hrv_baseline: float = 50.0,
        rhr_baseline: float = 60.0
    ) -> Optional[float]:
        """CNS Score - Central Nervous System state (0-100)
        
        Formula: 0.30*hrvNorm + 0.25*sleepNorm + 0.20*rhrNorm + 0.25*subjectiveNorm
        """
        # Check if we have enough data
        has_data = any(x is not None for x in [hrv, sleep_hours, resting_hr, soreness, motivation, life_stress])
        if not has_data:
            return None
        
        # Normalize each signal to 0-100
        scores = {}
        
        # HRV normalized (30%)
        if hrv is not None and hrv_baseline > 0:
            hrv_norm = max(0, min(100, 50 + (hrv - hrv_baseline) / hrv_baseline * 200))
            scores['hrv'] = hrv_norm * 0.30
        
        # Sleep normalized (25%)
        if sleep_hours is not None:
            sleep_norm = min(100, (sleep_hours / 8) * 100) * 0.25
            scores['sleep'] = sleep_norm * 0.25
        
        # RHR normalized (20%)
        if resting_hr is not None and rhr_baseline > 0:
            rhr_norm = max(0, min(100, 100 - (resting_hr - rhr_baseline) * 4))
            scores['rhr'] = rhr_norm * 0.20
        
        # Subjective normalized (25%)
        subjective_count = 0
        subjective_sum = 0
        if soreness is not None:
            subjective_sum += (10 - soreness)  # Inverse: less is better
            subjective_count += 1
        if motivation is not None:
            subjective_sum += motivation
            subjective_count += 1
        if life_stress is not None:
            subjective_sum += (10 - life_stress)  # Inverse
            subjective_count += 1
        
        if subjective_count > 0:
            subjective_norm = (subjective_sum / subjective_count) * 10
            scores['subjective'] = subjective_norm * 0.25
        
        # Calculate total
        total = sum(scores.values())
        return round(total, 1) if total > 0 else None
    
    @staticmethod
    def get_cns_zone(cns_score: float) -> str:
        """Get CNS zone"""
        if cns_score >= 75:
            return "ready"
        elif cns_score >= 50:
            return "moderate"
        return "drained"
    
    @staticmethod
    def get_readiness_category(readiness: float) -> str:
        """Get readiness category"""
        if readiness >= 60:
            return "High"
        elif readiness >= 40:
            return "Moderate"
        return "Low"
    
    @staticmethod
    def project_readiness(
        current_fitness: float,
        current_fatigue: float,
        avg_daily_load: float,
        days: int = 28
    ) -> list:
        """Project readiness for next N days"""
        projection = []
        
        alpha = 0.25  # Assume age 25-35 baseline
        beta = 0.069
        
        fitness = current_fitness
        fatigue = current_fatigue
        
        today = datetime.utcnow()
        
        for day in range(1, days + 1):
            # Apply day's load (if same pattern continues)
            fitness = StressEngine.calculate_fitness(beta, avg_daily_load, fitness)
            fatigue = StressEngine.calculate_fatigue(alpha, avg_daily_load, fatigue)
            
            readiness = StressEngine.calculate_readiness_base(fitness, fatigue)
            
            projection.append({
                "date": (today + timedelta(days=day)).strftime("%Y-%m-%d"),
                "readiness": readiness,
                "fitness": round(fitness, 1),
                "fatigue": round(fatigue, 1)
            })
        
        return projection
    
    def calculate(self, input_data: StressEngineInput) -> StressEngineOutput:
        """Main calculation entry point"""
        
        # Get age-based parameters
        alpha = self.get_alpha(input_data.age)
        beta = self.get_beta(input_data.age)
        
        # Calculate EMA
        fitness = self.calculate_fitness(
            beta, 
            input_data.session_load, 
            input_data.prior_fitness
        )
        fatigue = self.calculate_fatigue(
            alpha, 
            input_data.session_load, 
            input_data.prior_fatigue
        )
        
        # Base readiness
        readiness_base = self.calculate_readiness_base(fitness, fatigue)
        
        # Apply modifiers
        sleep_mod = self.apply_sleep_modifier(input_data.sleep_hours, input_data.gender)
        rpe_div_mod = self.apply_rpe_divergence_modifier(
            input_data.rpe_reported, 
            input_data.rpe_expected
        )
        compliance_mod = self.apply_compliance_modifier(
            input_data.completed_sessions,
            input_data.planned_sessions
        )
        
        # Final readiness
        readiness_raw = readiness_base + sleep_mod + rpe_div_mod + compliance_mod
        readiness = round(max(0, min(100, readiness_raw)), 1)
        
        # CNS score (optional)
        cns_score = self.calculate_cns_score(
            input_data.hrv,
            input_data.sleep_hours,
            input_data.resting_hr,
            input_data.soreness,
            input_data.motivation,
            input_data.life_stress
        )
        
        cns_zone = self.get_cns_zone(cns_score) if cns_score else None
        
        return StressEngineOutput(
            athlete_id=input_data.athlete_id,
            calculated_at=datetime.utcnow().isoformat(),
            fitness=fitness,
            fatigue=fatigue,
            readiness=readiness,
            readiness_category=self.get_readiness_category(readiness),
            cns_score=cns_score,
            cns_zone=cns_zone,
            readiness_base=round(readiness_base, 1),
            sleep_mod=sleep_mod,
            rpe_divergence_mod=rpe_div_mod,
            compliance_mod=compliance_mod,
            projection=self.project_readiness(fitness, fatigue, input_data.session_load / 7)  # Assume avg load
        )


# Singleton instance
stress_engine = StressEngine()