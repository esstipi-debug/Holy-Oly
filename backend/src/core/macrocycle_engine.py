"""
03. Macrocycle Engine

Manages 24 canonical training programs from 10 weightlifting schools
(mirror of frontend/src/data/macrocycles.ts · source: macrocycles/RAW_SOURCES/).
Creates athlete-specific sessions based on their 1RMs.
"""

from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum


# Escuelas REALES (fuente: macrocycles/RAW_SOURCES/ · espejo de frontend/src/data/macrocycles.ts).
# Se eliminaron las ficticias (Iranian/European/Japanese/Turkish) que no existen en la fuente.
class MacrocycleSchool(Enum):
    BULGARIAN = "Bulgarian"
    KOREAN = "Korean"
    CHINESE = "Chinese"
    CUBAN = "Cuban"
    POLISH = "Polish"
    RUSSIAN = "Russian"
    UKRAINIAN = "Ukrainian"
    COLOMBIAN = "Colombian"
    HYBRID = "Hybrid"
    USA = "USA"


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
    
    # 24 programas canónicos · espejo de frontend/src/data/macrocycles.ts (RAW_SOURCES).
    # ids, escuela, semanas, frecuencia e intensidad alineados a la fuente real.
    PROGRAMS = {
        # Búlgaro
        "bulgaro-6d": MacrocycleDefinition(
            id="bulgaro-6d", name="Búlgaro 6D",
            school="Bulgarian", duration_weeks=12, focus_type="Power",
            difficulty_level=5, description="Daily Max. Especificidad máxima, intensidad extrema.", sessions_per_week=6
        ),
        # Coreano
        "coreano-5d": MacrocycleDefinition(
            id="coreano-5d", name="Coreano 5D",
            school="Korean", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Estructura rígida, fuerza posicional, volumen de tirones.", sessions_per_week=5
        ),
        "coreano-6d": MacrocycleDefinition(
            id="coreano-6d", name="Coreano 6D",
            school="Korean", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Coreano de alta densidad, más volumen en 6 días.", sessions_per_week=6
        ),
        # Chino
        "chino-5d": MacrocycleDefinition(
            id="chino-5d", name="Chino 5D",
            school="Chinese", duration_weeks=4, focus_type="Hypertrophy",
            difficulty_level=4, description="Fuerza-técnica + culturismo funcional. Pulls y squats.", sessions_per_week=5
        ),
        # Cubano
        "cubano-novicio-2d": MacrocycleDefinition(
            id="cubano-novicio-2d", name="Cubano Novicio 2D",
            school="Cuban", duration_weeks=8, focus_type="Technical",
            difficulty_level=2, description="Iniciación, 2 sesiones, foco técnico.", sessions_per_week=2
        ),
        "cubano-novicio-3d": MacrocycleDefinition(
            id="cubano-novicio-3d", name="Cubano Novicio 3D",
            school="Cuban", duration_weeks=8, focus_type="Technical",
            difficulty_level=2, description="Volumen lun · técnico mié · intensidad vie.", sessions_per_week=3
        ),
        "cubano-int-5d": MacrocycleDefinition(
            id="cubano-int-5d", name="Cubano Intermedio 5D",
            school="Cuban", duration_weeks=12, focus_type="Strength",
            difficulty_level=3, description="Estructura clásica con base técnica establecida.", sessions_per_week=5
        ),
        "cubano-avanzado-5d": MacrocycleDefinition(
            id="cubano-avanzado-5d", name="Cubano Avanzado 5D",
            school="Cuban", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Mayor capacidad de trabajo, volumen alto.", sessions_per_week=5
        ),
        "cubano-competidor": MacrocycleDefinition(
            id="cubano-competidor", name="Cubano Competidor",
            school="Cuban", duration_weeks=16, focus_type="Peaking",
            difficulty_level=5, description="Salida competitiva: acumulación → realización.", sessions_per_week=5
        ),
        # Polaco
        "polaco-4d": MacrocycleDefinition(
            id="polaco-4d", name="Polaco 4D",
            school="Polish", duration_weeks=6, focus_type="Peaking",
            difficulty_level=4, description="Ciclo corto de choque, picos frecuentes.", sessions_per_week=4
        ),
        "polaco-5d": MacrocycleDefinition(
            id="polaco-5d", name="Polaco 5D",
            school="Polish", duration_weeks=6, focus_type="Peaking",
            difficulty_level=4, description="Series cortas (1-3), mucho pull desde bloques.", sessions_per_week=5
        ),
        # Ruso
        "ruso-5d": MacrocycleDefinition(
            id="ruso-5d", name="Ruso 5D",
            school="Russian", duration_weeks=16, focus_type="Strength",
            difficulty_level=3, description="Waviness: ondulación diaria + semanal. GPP extensa.", sessions_per_week=5
        ),
        # Ucraniano
        "ucraniano-3d": MacrocycleDefinition(
            id="ucraniano-3d", name="Ucraniano 3D",
            school="Ukrainian", duration_weeks=12, focus_type="Power",
            difficulty_level=4, description="Alta densidad pura, EMOM-heavy.", sessions_per_week=3
        ),
        "ucraniano-4d": MacrocycleDefinition(
            id="ucraniano-4d", name="Ucraniano 4D",
            school="Ukrainian", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Estándar, más volumen accesorio.", sessions_per_week=4
        ),
        # Colombiano
        "colombiano-5d": MacrocycleDefinition(
            id="colombiano-5d", name="Colombiano 5D",
            school="Colombian", duration_weeks=12, focus_type="Power",
            difficulty_level=4, description="Prioridad al C&J. Ondulación constante.", sessions_per_week=5
        ),
        # Híbrido
        "hibrido-3d": MacrocycleDefinition(
            id="hibrido-3d", name="Híbrido Moderno 3D",
            school="Hybrid", duration_weeks=12, focus_type="Strength",
            difficulty_level=3, description="Alta densidad por sesión, compuestos grandes.", sessions_per_week=3
        ),
        "hibrido-4d": MacrocycleDefinition(
            id="hibrido-4d", name="Híbrido Moderno 4D",
            school="Hybrid", duration_weeks=12, focus_type="Strength",
            difficulty_level=3, description="Block periodization: hipertrofia + fuerza + EMOM.", sessions_per_week=4
        ),
        "hibrido-5d": MacrocycleDefinition(
            id="hibrido-5d", name="Híbrido Moderno 5D",
            school="Hybrid", duration_weeks=12, focus_type="Power",
            difficulty_level=4, description="Acumulación → Transmutación → Realización.", sessions_per_week=5
        ),
        "hibrido-block": MacrocycleDefinition(
            id="hibrido-block", name="Híbrido Modular (BLOCK)",
            school="Hybrid", duration_weeks=12, focus_type="Strength",
            difficulty_level=4, description="Bloques concentrados con ondulación semanal.", sessions_per_week=4
        ),
        # USA
        "usa-school": MacrocycleDefinition(
            id="usa-school", name="USA Weightlifting",
            school="USA", duration_weeks=12, focus_type="Power",
            difficulty_level=3, description="Periodización lineal americana. Balance volumen/intensidad.", sessions_per_week=5
        ),
        "usa-principiante": MacrocycleDefinition(
            id="usa-principiante", name="USA Principiante",
            school="USA", duration_weeks=16, focus_type="Technical",
            difficulty_level=2, description="Lineal 16 sem: prep anatómica → fuerza base → integración.", sessions_per_week=4
        ),
        "usa-intermedio": MacrocycleDefinition(
            id="usa-intermedio", name="USA Intermedio",
            school="USA", duration_weeks=16, focus_type="Strength",
            difficulty_level=4, description="Bloques ondulantes: acumulación → transmutación → realización.", sessions_per_week=5
        ),
        "usa-avanzado": MacrocycleDefinition(
            id="usa-avanzado", name="USA Avanzado",
            school="USA", duration_weeks=8, focus_type="Peaking",
            difficulty_level=5, description="Peaking 8 sem pre-competencia: choque neural → tapering.", sessions_per_week=5
        ),
        "usa-master": MacrocycleDefinition(
            id="usa-master", name="USA Master 40+",
            school="USA", duration_weeks=12, focus_type="Strength",
            difficulty_level=3, description="Adaptado a máster: estabilidad articular → fuerza preservada.", sessions_per_week=3
        ),
    }
    
    # Simplified session templates per program
    SESSION_TEMPLATES = {
        "ruso-5d": [
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
        template_days = cls.SESSION_TEMPLATES.get(program_id, cls.SESSION_TEMPLATES["ruso-5d"])
        
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