"""
03. Macrocycle Engine

Manages 23 standardized training programs from 9 weightlifting schools.
Creates athlete-specific sessions based on their 1RMs.
"""

from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum


class MacrocycleSchool(Enum):
    BULGARIAN = "Bulgarian"
    RUSSIAN = "Russian"
    CHINESE = "Chinese"
    AMERICAN = "American"
    IRANIAN = "Iranian"
    EUROPEAN = "European"
    JAPANESE = "Japanese"
    UKRAINIAN = "Ukrainian"
    TURKISH = "Turkish"


class MacrocycleFocus(Enum):
    HYPERTROPHY = "Hypertrophy"
    STRENGTH = "Strength"
    POWER = "Power"
    PEAKING = "Peaking"
    TECHNICAL = "Technical"


class MacrocycleStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


@dataclass
class AthleteMaxes:
    """Athlete's 1RM maxes"""
    snatch: float
    clean: float
    jerk: float
    back_squat: float
    front_squat: float = 0.0
    body_weight: float = 0.0
    
    def get_movement(self, name: str) -> float:
        """Get max for a specific movement"""
        name_lower = name.lower()
        if "snatch" in name_lower:
            return self.snatch
        elif "clean" in name_lower or "jerk" in name_lower:
            return self.jerk if "jerk" in name_lower else self.clean
        elif "front" in name_lower:
            return self.front_squat if self.front_squat > 0 else self.back_squat * 0.85
        elif "squat" in name_lower or "back" in name_lower:
            return self.back_squat
        return self.snatch  # Default


@dataclass
class MacrocycleDefinition:
    """Definition of a macrocycle program"""
    id: str
    name: str
    school: str
    duration_weeks: int
    focus_type: str
    difficulty_level: int  # 1-5
    description: str = ""
    sessions_per_week: int = 5


@dataclass
class MacrocycleSessionExercise:
    """Single exercise in a session"""
    exercise_id: str
    exercise_name: str
    sets: int
    reps: int
    intensity_pct: float  # % of 1RM
    rpe: float
    notes: str = ""
    complexity: int = 5
    cns_demand: int = 5
    position: str = "Competition"
    exercise_order: int = 0


@dataclass
class MacrocycleSession:
    """Single training session"""
    id: str
    macrocycle_id: str
    week: int
    day_of_week: str
    session_theme: str
    estimated_duration: int = 90
    session_order: int = 0
    exercises: list = field(default_factory=list)


@dataclass
class GeneratedSession:
    """Generated session for a specific athlete"""
    id: str
    athlete_id: str
    macrocycle_id: str
    week: int
    day_of_week: str
    session_theme: str
    scheduled_date: str
    exercises: list = field(default_factory=list)
    status: str = "pending"  # pending, completed, skipped
    completed_at: Optional[str] = None
    rpe_reported: Optional[float] = None
    notes: str = ""


class MacrocycleEngine:
    """Macrocycle Engine implementation"""
    
    # 23 canonical programs
    PROGRAMS = {
        # Bulgarian
        "bulgarian_hf": MacrocycleDefinition(
            id="bulgarian_hf", name="High Frequency Pure Oly",
            school="Bulgarian", duration_weeks=8, focus_type="Power",
            difficulty_level=5, description="Daily singles, daily maxes", sessions_per_week=6
        ),
        "bulgarian_heavy": MacrocycleDefinition(
            id="bulgarian_heavy", name="Bulgarian Heavy",
            school="Bulgarian", duration_weeks=12, focus_type="Strength",
            difficulty_level=5, description="Extreme frequency + loads", sessions_per_week=6
        ),
        "bulgarian_strength": MacrocycleDefinition(
            id="bulgarian_strength", name="Bulgarian Strength Block",
            school="Bulgarian", duration_weeks=6, focus_type="Strength",
            difficulty_level=4, description="Lower frequency, higher intensity", sessions_per_week=4
        ),
        # Russian
        "russian_classic": MacrocycleDefinition(
            id="russian_classic", name="Russian Classic Periodization",
            school="Russian", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Hypertrophy → Strength → Power", sessions_per_week=5
        ),
        "russian_speed": MacrocycleDefinition(
            id="russian_speed", name="Russian Strength-Speed Block",
            school="Russian", duration_weeks=8, focus_type="Power",
            difficulty_level=4, description="Speed under load", sessions_per_week=5
        ),
        "russian_chains": MacrocycleDefinition(
            id="russian_chains", name="Russian Heavy Chains",
            school="Russian", duration_weeks=10, focus_type="Strength",
            difficulty_level=4, description="Wave loading with chains/bands", sessions_per_week=5
        ),
        "russian_comp": MacrocycleDefinition(
            id="russian_comp", name="Russian Competition Prep",
            school="Russian", duration_weeks=4, focus_type="Peaking",
            difficulty_level=5, description="Peaking taper", sessions_per_week=3
        ),
        # Chinese
        "chinese_extensive": MacrocycleDefinition(
            id="chinese_extensive", name="Chinese Extensive",
            school="Chinese", duration_weeks=16, focus_type="Hypertrophy",
            difficulty_level=3, description="High volume, moderate intensity", sessions_per_week=5
        ),
        "chinese_comp": MacrocycleDefinition(
            id="chinese_comp", name="Chinese Competition Phase",
            school="Chinese", duration_weeks=6, focus_type="Peaking",
            difficulty_level=4, description="Peaking focus", sessions_per_week=4
        ),
        "chinese_youth": MacrocycleDefinition(
            id="chinese_youth", name="Chinese Youth Development",
            school="Chinese", duration_weeks=12, focus_type="Technical",
            difficulty_level=2, description="Foundation building", sessions_per_week=4
        ),
        # American
        "american_hybrid": MacrocycleDefinition(
            id="american_hybrid", name="American Hybrid Complex",
            school="American", duration_weeks=10, focus_type="Power",
            difficulty_level=3, description="Oly + strength + CrossFit transfer", sessions_per_week=4
        ),
        "american_strength": MacrocycleDefinition(
            id="american_strength", name="American Strength Bias",
            school="American", duration_weeks=8, focus_type="Strength",
            difficulty_level=3, description="Heavy squats + pulls", sessions_per_week=4
        ),
        # Iranian
        "iranian_volume": MacrocycleDefinition(
            id="iranian_volume", name="Iranian High Volume",
            school="Iranian", duration_weeks=14, focus_type="Hypertrophy",
            difficulty_level=4, description="~20+ exercises per session", sessions_per_week=5
        ),
        "iranian_comp": MacrocycleDefinition(
            id="iranian_comp", name="Iranian Competition Block",
            school="Iranian", duration_weeks=5, focus_type="Peaking",
            difficulty_level=5, description="72h taper to peak", sessions_per_week=4
        ),
        # European
        "european_tech": MacrocycleDefinition(
            id="european_tech", name="European Technical Focus",
            school="European", duration_weeks=10, focus_type="Technical",
            difficulty_level=3, description="Technique refinement", sessions_per_week=4
        ),
        "european_waves": MacrocycleDefinition(
            id="european_waves", name="European Periodized Waves",
            school="European", duration_weeks=12, focus_type="Power",
            difficulty_level=4, description="3-week waves, undulating", sessions_per_week=4
        ),
        "european_enduro": MacrocycleDefinition(
            id="european_enduro", name="European Endurance-Strength Hybrid",
            school="European", duration_weeks=9, focus_type="Strength",
            difficulty_level=3, description="WL + conditioning", sessions_per_week=5
        ),
        # Japanese
        "japanese_precision": MacrocycleDefinition(
            id="japanese_precision", name="Japanese Precision OLY",
            school="Japanese", duration_weeks=10, focus_type="Technical",
            difficulty_level=4, description="Position work + technical fidelity", sessions_per_week=4
        ),
        "japanese_enduro": MacrocycleDefinition(
            id="japanese_enduro", name="Japanese Strength Endurance",
            school="Japanese", duration_weeks=12, focus_type="Strength",
            difficulty_level=3, description="High reps (5-6) at 85%+", sessions_per_week=4
        ),
        # Ukrainian
        "ukrainian_freq": MacrocycleDefinition(
            id="ukrainian_freq", name="Ukrainian Extreme Frequency",
            school="Ukrainian", duration_weeks=6, focus_type="Power",
            difficulty_level=5, description="10+ sessions/week", sessions_per_week=10
        ),
        "ukrainian_strength": MacrocycleDefinition(
            id="ukrainian_strength", name="Ukrainian Strength Block",
            school="Ukrainian", duration_weeks=8, focus_type="Strength",
            difficulty_level=4, description="3×/week with heavy squats", sessions_per_week=3
        ),
        # Turkish
        "turkish_volume": MacrocycleDefinition(
            id="turkish_volume", name="Turkish Volume Progression",
            school="Turkish", duration_weeks=14, focus_type="Hypertrophy",
            difficulty_level=3, description="Slow volume increase", sessions_per_week=4
        ),
        "turkish_speed": MacrocycleDefinition(
            id="turkish_speed", name="Turkish Speed-Strength",
            school="Turkish", duration_weeks=7, focus_type="Power",
            difficulty_level=4, description="Explosive + technical", sessions_per_week=4
        ),
    }
    
    # Simplified session templates per program
    SESSION_TEMPLATES = {
        "russian_classic": [
            {"day": "Monday", "theme": "Snatch Focus + Squat", "exercises": [
                {"name": "Snatch", "sets": 5, "reps": 3, "intensity": 0.70, "rpe": 8},
                {"name": "Clean", "sets": 4, "reps": 4, "intensity": 0.69, "rpe": 7.5},
                {"name": "Back Squat", "sets": 5, "reps": 6, "intensity": 0.60, "rpe": 7},
                {"name": "Snatch Pull", "sets": 3, "reps": 5, "intensity": 0.0, "rpe": 6}
            ]},
            {"day": "Wednesday", "theme": "Clean Focus + Front Squat", "exercises": [
                {"name": "Clean", "sets": 5, "reps": 5, "intensity": 0.69, "rpe": 7.5},
                {"name": "Jerk", "sets": 4, "reps": 4, "intensity": 0.76, "rpe": 8},
                {"name": "Front Squat", "sets": 4, "reps": 5, "intensity": 0.70, "rpe": 7},
                {"name": "Push Press", "sets": 3, "reps": 5, "intensity": 0.0, "rpe": 6}
            ]},
            {"day": "Friday", "theme": "Heavy Squat + Snatch", "exercises": [
                {"name": "Back Squat", "sets": 4, "reps": 4, "intensity": 0.80, "rpe": 8},
                {"name": "Snatch Pull", "sets": 3, "reps": 3, "intensity": 0.0, "rpe": 6},
                {"name": "Jerk Drive", "sets": 3, "reps": 4, "intensity": 0.0, "rpe": 7},
                {"name": "Core Work", "sets": 3, "reps": 10, "intensity": 0.0, "rpe": 4}
            ]},
        ]
    }
    
    @classmethod
    def get_program(cls, program_id: str) -> Optional[MacrocycleDefinition]:
        """Get program by ID"""
        return cls.PROGRAMS.get(program_id)
    
    @classmethod
    def list_programs(cls) -> list:
        """List all available programs"""
        return [
            {
                "id": p.id,
                "name": p.name,
                "school": p.school,
                "weeks": p.duration_weeks,
                "focus": p.focus_type,
                "difficulty": p.difficulty_level,
                "sessions_per_week": p.sessions_per_week
            }
            for p in cls.PROGRAMS.values()
        ]
    
    @classmethod
    def list_programs_by_school(cls, school: str) -> list:
        """List programs by school"""
        return [
            {"id": p.id, "name": p.name, "weeks": p.duration_weeks}
            for p in cls.PROGRAMS.values() if p.school.lower() == school.lower()
        ]
    
    @staticmethod
    def calculate_working_weight(max_weight: float, intensity_pct: float) -> float:
        """Calculate working weight from %1RM"""
        if intensity_pct <= 0:
            return 0  # Bodyweight/no load练习
        return round(max_weight * intensity_pct, 1)
    
    @classmethod
    def generate_week_sessions(
        cls,
        program_id: str,
        athlete_id: str,
        athlete_maxes: AthleteMaxes,
        week: int,
        start_date: str
    ) -> list:
        """Generate sessions for a specific week"""
        program = cls.get_program(program_id)
        if not program:
            return []
        
        # Get template for program (simplified)
        template_days = cls.SESSION_TEMPLATES.get(program_id, cls.SESSION_TEMPLATES["russian_classic"])
        
        sessions = []
        base_date = datetime.strptime(start_date, "%Y-%m-%d")
        
        for i, day_template in enumerate(template_days):
            session_date = (base_date + timedelta(days=i * 2)).strftime("%Y-%m-%d")  # Every 2 days
            
            exercises = []
            for j, ex in enumerate(day_template["exercises"]):
                # Get max for this movement
                max_weight = athlete_maxes.get_movement(ex["name"])
                working_weight = cls.calculate_working_weight(max_weight, ex["intensity"])
                
                # Complexity and CNS demand (simplified)
                complexity = 9 if "Snatch" in ex["name"] or "Clean" in ex["name"] else 6
                cns = 10 if "Snatch" in ex["name"] else 7
                
                exercises.append({
                    "exercise_name": ex["name"],
                    "sets": ex["sets"],
                    "reps": ex["reps"],
                    "intensity_pct": ex["intensity"] * 100,
                    "working_weight": working_weight,
                    "rpe": ex["rpe"],
                    "complexity": complexity,
                    "cns_demand": cns,
                    "exercise_order": j
                })
            
            sessions.append({
                "athlete_id": athlete_id,
                "macrocycle_id": program_id,
                "week": week,
                "day_of_week": day_template["day"],
                "session_theme": day_template["theme"],
                "scheduled_date": session_date,
                "exercises": exercises,
                "status": "pending"
            })
        
        return sessions
    
    @classmethod
    def generate_full_program(
        cls,
        program_id: str,
        athlete_id: str,
        athlete_maxes: AthleteMaxes,
        start_date: str
    ) -> list:
        """Generate all weeks for a program"""
        program = cls.get_program(program_id)
        if not program:
            return []
        
        all_sessions = []
        base_date = datetime.strptime(start_date, "%Y-%m-%d")
        
        for week in range(1, program.duration_weeks + 1):
            week_sessions = cls.generate_week_sessions(
                program_id, athlete_id, athlete_maxes, week,
                base_date.strftime("%Y-%m-%d")
            )
            all_sessions.extend(week_sessions)
            base_date += timedelta(days=7)  # Next week
        
        return all_sessions
    
    @classmethod
    def calculate_weekly_load(cls, exercises: list) -> float:
        """Calculate total weekly load estimate"""
        total = 0
        for ex in exercises:
            load = ex.get("sets", 1) * ex.get("reps", 1)
            if ex.get("working_weight", 0) > 0:
                load *= ex["working_weight"]
            total += load
        return round(total, 1)
    
    @classmethod
    def get_weeks_for_phase(cls, program_id: str, phase: str) -> list:
        """Get week numbers for a specific phase"""
        program = cls.get_program(program_id)
        if not program:
            return []
        
        # Simplified phases
        weeks_per_phase = {
            "Hypertrophy": list(range(1, 5)),
            "Strength": list(range(5, 9)),
            "Power": list(range(9, 12)),
            "Peaking": [12]
        }
        
        return weeks_per_phase.get(phase, [])
    
    @classmethod
    def validate_program(cls, sessions: list) -> dict:
        """Validate session balance"""
        issues = []
        
        # Check for snatch/clean days
        has_snatch = any("Snatch" in str(ex.get("exercise_name", "")) for s in sessions for ex in s.get("exercises", []))
        has_clean = any("Clean" in str(ex.get("exercise_name", "")) for s in sessions for ex in s.get("exercises", []))
        
        if not has_snatch:
            issues.append("No snatch exercises found")
        if not has_clean:
            issues.append("No clean exercises found")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "total_sessions": len(sessions),
            "total_exercises": sum(len(s.get("exercises", [])) for s in sessions)
        }


# Singleton
macrocycle_engine = MacrocycleEngine()