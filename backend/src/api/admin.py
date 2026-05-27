"""
Admin endpoints · solo accesibles con PAYMENTS_ADMIN_TOKEN.

Útil para:
- Correr migraciones bajo demanda (si el pre-deploy command de Render no se configuró)
- Inspeccionar el estado de la DB
- Limpiar mocks / test data

Auth: header `X-Admin-Token` o query param `admin_token`.
"""
import os
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Header, status

from ..db import users_repo

router = APIRouter(prefix="/v1/admin", tags=["admin"])

ADMIN_TOKEN = os.getenv("PAYMENTS_ADMIN_TOKEN", "")

MIGRATION_FILES = [
    "000_init.sql",
    "001_enable_rls.sql",
    "002_enable_pgvector.sql",
    "003_wise_score.sql",
    "004_rag_self_healing.sql",
    "005_github_oauth.sql",
    "006_wod_results.sql",
    "007_push_subscriptions.sql",
    "008_coach_skill_focus.sql",
    "009_wellness_checkins.sql",
    "010_manual_sessions.sql",
    "011_coach_skill_evaluation.sql",
    "012_volta_competitor.sql",
    "013_custom_wods.sql",
    "014_hormonal_cycle.sql",
    "015_athlete_belts.sql",
    "016_box_inventory.sql",
    "017_macrocycle_templates.sql",
    "018_athlete_macro_assignments.sql",
    "019_smart_coach_alerts.sql",
    "020_lifestyle_inputs.sql",
]


def check_admin(token: Optional[str]):
    if not ADMIN_TOKEN:
        raise HTTPException(503, "Admin token not configured on server")
    if token != ADMIN_TOKEN:
        raise HTTPException(401, "Invalid admin token")


@router.post("/migrate")
async def run_migrations(x_admin_token: Optional[str] = Header(default=None)):
    """
    Corre las migraciones SQL en orden contra la DB.
    Cada una se ejecuta en su propia transacción — si una falla, las siguientes
    siguen corriendo. Idempotente porque las migraciones usan IF NOT EXISTS.
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available — check DATABASE_URL env var")

    # Las migraciones están en /app/migrations dentro del container, no /app/backend/migrations
    # porque el Dockerfile hace COPY backend/src/ ./src/ pero no copia migrations.
    # FIX: vamos a soportar 2 paths comunes
    candidates = [
        Path("/app/migrations"),                              # si Dockerfile copia migrations explícito
        Path("/app/src/../migrations"),                       # relativo a src
        Path(__file__).resolve().parent.parent.parent / "migrations",  # backend/migrations relativo al código
    ]
    migrations_dir = next((p for p in candidates if p.exists()), None)
    if migrations_dir is None:
        raise HTTPException(500, f"Migrations dir not found. Tried: {[str(p) for p in candidates]}")

    results = []
    async with pool.acquire() as conn:
        for fname in MIGRATION_FILES:
            fpath = migrations_dir / fname
            if not fpath.exists():
                results.append({"file": fname, "status": "missing"})
                continue
            sql = fpath.read_text(encoding="utf-8")
            try:
                await conn.execute(sql)
                results.append({"file": fname, "status": "ok"})
            except Exception as e:
                results.append({"file": fname, "status": "error", "error": str(e)[:300]})

    return {
        "migrations_dir": str(migrations_dir),
        "results": results,
    }


@router.post("/mp/create-plans")
async def create_mp_plans(x_admin_token: Optional[str] = Header(default=None)):
    """
    Crea los 4 preapproval_plan en MercadoPago Chile (una vez por entorno).
    Devuelve los plan_ids que tenés que setear como env vars:
      MP_PLAN_ID_ATHLETE_PRO_1M, MP_PLAN_ID_ATHLETE_PRO_12M,
      MP_PLAN_ID_COACH_PRO_1M,   MP_PLAN_ID_COACH_PRO_12M
    """
    check_admin(x_admin_token)
    from . import payments as P
    results = {}
    for plan_key, plan in P.PLANS.items():
        try:
            r = await P.create_mp_preapproval_plan(plan_key=plan_key, plan=plan)
            results[plan_key] = {"plan_id": r["plan_id"], "init_point": r["init_point"], "status": r["status"]}
        except Exception as e:
            results[plan_key] = {"error": str(e)[:300]}
    return {
        "plans": results,
        "next_step": "Setear las env vars MP_PLAN_ID_* en Render con los plan_ids de arriba y redeployar",
    }


@router.post("/promote-to-coach")
async def promote_to_coach(
    email: str,
    x_admin_token: Optional[str] = Header(default=None),
):
    """
    Cambia el role de un user de 'athlete' a 'coach'.

    Útil para:
    - Boss asignando coaches sin tocar la DB
    - Onboarding manual de partners box

    Idempotente: si ya es coach, devuelve el estado actual sin error.
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available")

    email_norm = email.strip().lower()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, role FROM users WHERE LOWER(email) = $1",
            email_norm,
        )
        if not row:
            raise HTTPException(404, f"User not found: {email_norm}")

        prev_role = row["role"]
        if prev_role == "coach":
            return {
                "ok": True,
                "user_id": str(row["id"]),
                "email": row["email"],
                "previous_role": prev_role,
                "current_role": prev_role,
                "changed": False,
                "note": "User already had coach role",
            }
        if prev_role == "admin":
            raise HTTPException(400, f"User is admin · refusing to demote to coach")

        await conn.execute(
            "UPDATE users SET role = 'coach' WHERE id = $1",
            row["id"],
        )

        return {
            "ok": True,
            "user_id": str(row["id"]),
            "email": row["email"],
            "previous_role": prev_role,
            "current_role": "coach",
            "changed": True,
        }


@router.post("/demote-to-athlete")
async def demote_to_athlete(
    email: str,
    x_admin_token: Optional[str] = Header(default=None),
):
    """Revertir promoción · útil si se asignó coach por error."""
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "No DB pool available")

    email_norm = email.strip().lower()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, role FROM users WHERE LOWER(email) = $1",
            email_norm,
        )
        if not row:
            raise HTTPException(404, f"User not found: {email_norm}")

        prev_role = row["role"]
        if prev_role == "athlete":
            return {
                "ok": True,
                "user_id": str(row["id"]),
                "email": row["email"],
                "previous_role": prev_role,
                "current_role": prev_role,
                "changed": False,
            }
        if prev_role == "admin":
            raise HTTPException(400, "Refusing to demote admin")

        await conn.execute(
            "UPDATE users SET role = 'athlete' WHERE id = $1",
            row["id"],
        )

        return {
            "ok": True,
            "user_id": str(row["id"]),
            "email": row["email"],
            "previous_role": prev_role,
            "current_role": "athlete",
            "changed": True,
        }


@router.post("/seed-macro-templates")
async def seed_macro_templates(x_admin_token: Optional[str] = Header(default=None)):
    """
    Migra los 23 PROGRAMS hardcoded en macrocycle_engine.py a tabla DB.
    Idempotente · ON CONFLICT DO NOTHING por program_id único.
    Plus 5 templates Volta (CF Open · CF Conditioning · CF Strength · HYROX · Open Prep).
    """
    check_admin(x_admin_token)

    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    from ..core.macrocycle_engine import MacrocycleEngine
    import json as _json

    # Equipment requirements heurísticos por focus
    EQUIPMENT_BY_FOCUS = {
        "Strength":   ["barbell_olympic_20kg", "plate_bumper_kg", "rig_pullup", "rack"],
        "Power":      ["barbell_olympic_20kg", "plate_bumper_kg", "rack"],
        "Hypertrophy":["barbell_olympic_20kg", "plate_bumper_kg", "dumbbell_set", "rack"],
        "Peaking":    ["barbell_olympic_20kg", "plate_bumper_kg", "plate_change", "rack"],
        "Technical":  ["barbell_training_15kg", "plate_change", "barbell_olympic_20kg"],
    }

    GOAL_BY_FOCUS = {
        "Strength":    ["strength", "fuerza"],
        "Power":       ["power", "explosividad"],
        "Hypertrophy": ["volume", "masa"],
        "Peaking":     ["meet_prep", "competition"],
        "Technical":   ["technique", "skill"],
    }

    LEVEL_BY_DIFFICULTY = {
        1: ("beginner", "intermediate"),
        2: ("beginner", "intermediate"),
        3: ("intermediate", "advanced"),
        4: ("intermediate", "elite"),
        5: ("advanced", "elite"),
    }

    results = []
    inserted = 0

    async with pool.acquire() as conn:
        # Holy Oly · 23 programas
        for p in MacrocycleEngine.PROGRAMS.values():
            level_min, level_max = LEVEL_BY_DIFFICULTY.get(p.difficulty_level, ("intermediate", "advanced"))
            equipment = EQUIPMENT_BY_FOCUS.get(p.focus_type, [])
            goals = GOAL_BY_FOCUS.get(p.focus_type, [])

            try:
                await conn.execute(
                    """
                    INSERT INTO macrocycle_templates
                        (program_id, name, school, product, description, total_weeks,
                         focus, level_min, level_max, goal_tags, required_equipment,
                         typical_athletes, is_system, coach_id)
                    VALUES ($1, $2, $3, 'holy-oly', $4, $5, $6, $7, $8,
                            $9::jsonb, $10::jsonb, 1, TRUE, NULL)
                    ON CONFLICT (program_id) DO NOTHING
                    """,
                    p.id, p.name, p.school.lower(), p.description, p.duration_weeks,
                    p.focus_type.lower(), level_min, level_max,
                    _json.dumps(goals), _json.dumps(equipment),
                )
                results.append({"program_id": p.id, "status": "inserted"})
                inserted += 1
            except Exception as e:
                results.append({"program_id": p.id, "status": "error", "error": str(e)[:200]})

        # Volta · 5 programas CrossFit/HYROX
        VOLTA_PROGRAMS = [
            {
                "program_id": "cf_open_prep",  "name": "CrossFit Open Prep",
                "school": "crossfit", "weeks": 8, "focus": "peaking",
                "description": "8 semanas pre-Open · ciclos cortos · benchmarks recurrentes",
                "equipment": ["barbell_olympic_20kg", "plate_bumper_kg", "rig_pullup", "rower", "bike_assault", "wall_ball", "kettlebell_set", "plyo_box"],
                "goals": ["crossfit_open", "metcon"], "athletes": 12,
            },
            {
                "program_id": "cf_conditioning", "name": "CrossFit Conditioning Block",
                "school": "crossfit", "weeks": 6, "focus": "conditioning",
                "description": "Pulse zones · capacidad aeróbica + anaeróbica",
                "equipment": ["rower", "bike_assault", "rope_jump", "kettlebell_set", "wall_ball"],
                "goals": ["conditioning", "engine"], "athletes": 15,
            },
            {
                "program_id": "cf_strength", "name": "CrossFit Strength Cycle",
                "school": "crossfit", "weeks": 10, "focus": "strength",
                "description": "Squat + DL + presses · base fuerza para WODs",
                "equipment": ["barbell_olympic_20kg", "plate_bumper_kg", "rack", "rig_pullup"],
                "goals": ["strength", "1rm"], "athletes": 10,
            },
            {
                "program_id": "hyrox_prep", "name": "HYROX Race Prep",
                "school": "hyrox", "weeks": 12, "focus": "endurance",
                "description": "8 estaciones · 1km run x8 · sled push/pull · burpee broad jumps",
                "equipment": ["rower", "bike_assault", "sled", "wall_ball", "kettlebell_set", "sandbag"],
                "goals": ["hyrox", "race", "endurance"], "athletes": 8,
            },
            {
                "program_id": "hyrox_strength_endurance", "name": "HYROX Strength-Endurance",
                "school": "hyrox", "weeks": 8, "focus": "endurance",
                "description": "Off-season HYROX · base strength + zone 2",
                "equipment": ["barbell_olympic_20kg", "kettlebell_set", "rower", "rope_jump"],
                "goals": ["hyrox_offseason", "base"], "athletes": 10,
            },
        ]

        for v in VOLTA_PROGRAMS:
            product = "axon" if v["school"] == "hyrox" else "volta"
            try:
                await conn.execute(
                    """
                    INSERT INTO macrocycle_templates
                        (program_id, name, school, product, description, total_weeks,
                         focus, level_min, level_max, goal_tags, required_equipment,
                         typical_athletes, is_system, coach_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, 'beginner', 'elite',
                            $8::jsonb, $9::jsonb, $10, TRUE, NULL)
                    ON CONFLICT (program_id) DO NOTHING
                    """,
                    v["program_id"], v["name"], v["school"], product,
                    v["description"], v["weeks"], v["focus"],
                    _json.dumps(v["goals"]), _json.dumps(v["equipment"]),
                    v["athletes"],
                )
                results.append({"program_id": v["program_id"], "status": "inserted", "product": product})
                inserted += 1
            except Exception as e:
                results.append({"program_id": v["program_id"], "status": "error", "error": str(e)[:200]})

        total = await conn.fetchval("SELECT COUNT(*) FROM macrocycle_templates")

    return {
        "ok": True,
        "inserted_this_run": inserted,
        "total_in_db": total,
        "details": results,
    }


@router.post("/seed-pills")
async def seed_knowledge_pills(x_admin_token: Optional[str] = Header(default=None)):
    """Pobla catálogo de píldoras educacionales · sleep · cafeína · alcohol · etc."""
    check_admin(x_admin_token)
    pool = await users_repo.get_pool()
    if pool is None:
        raise HTTPException(503, "DB no disponible")

    import json as _json

    PILLS = [
        # Sleep
        ("sleep_under_6h", "sleep", "warning",
         "Sueño <6h afecta tu entrenamiento",
         "Dormir menos de 6 horas reduce capacidad de recuperación 40% · evita carga pesada hoy.",
         "Dormir <6h reduce síntesis proteica muscular, eleva cortisol matinal, baja testosterona y reduce reaction time. La fuerza máxima cae 5-15% y el RPE percibido sube. Recomendación: hoy entrenar a 70% intensidad o priorizar técnica.",
         "Watson et al. 2017 · Sports Medicine"),
        ("sleep_7_9h", "sleep", "info",
         "Sueño óptimo · 7-9h",
         "7-9h es la ventana óptima para recovery + síntesis hormonal.",
         "Durante sueño profundo se libera 70% del GH diario, se consolida memoria motora (skill learning) y se restauran neurotransmisores. Atletas que duermen <7h tienen 1.7x más probabilidad de lesión.",
         "Mah et al. 2011 · Sleep"),

        # Caffeine
        ("caffeine_residual", "caffeine", "info",
         "Cafeína · ¿cuándo te afecta?",
         "Vida media 5h · 200mg a las 9am = 100mg a las 2pm · 25mg a las 7pm.",
         "Cafeína se metaboliza con t1/2=5h promedio (varía 2-12h según CYP1A2). Para dormir bien evitar consumo después de las 14h. Para entrenar fuerte: 3-6mg/kg 45min pre-WOD mejora rendimiento 5-15%.",
         "Goldstein et al. 2010 · J Int Soc Sports Nutr"),
        ("caffeine_too_much", "caffeine", "warning",
         "Cafeína >400mg/día puede ser contraproducente",
         "Más de 400mg/día eleva ansiedad, reduce calidad del sueño y desensibiliza el efecto ergogénico.",
         "Tolerancia a cafeína se desarrolla en 1-2 semanas con uso diario. Para mantener efecto ergogénico óptimo: ciclar (5 días on, 2 off) o limitar a <300mg/día. >500mg/día se asocia con hipertensión y disritmias.",
         "Nehlig 2018 · Pharmacol Rev"),

        # Alcohol
        ("alcohol_post_training", "alcohol", "warning",
         "Alcohol post-entrenamiento mata el progreso",
         "≥1 unidad reduce síntesis proteica muscular 24h · pésimo para PR hoy.",
         "Etanol bloquea mTOR (clave para síntesis proteica), reduce GH nocturno 70%, deshidrata y empeora sueño profundo. 2 unidades post-WOD = pierdes 24h de adaptación. Si vas a tomar: 3+ horas después del entrenamiento, agua + comida proteica.",
         "Parr et al. 2014 · PLoS One"),
        ("alcohol_2_units", "alcohol", "critical",
         "2+ unidades · evita PR mañana",
         "Tu performance caerá 11% en pruebas anaeróbicas el día siguiente.",
         "Estudios muestran caída de 11.4% en pruebas anaeróbicas y 6.8% en aeróbicas tras 1g/kg de alcohol. Recuperación cardiovascular tarda 2-3 días. Para halterofilia: máxima caída en jerk + back squat (afecta CNS).",
         "Lecoultre & Schutz 2009 · Med Sci Sports Exerc"),

        # Smoking
        ("smoking_vo2", "smoking", "warning",
         "Fumar reduce VO2max 5-15%",
         "Cada cigarrillo afecta capacidad pulmonar ~4h · CO en sangre desplaza O2.",
         "Carboxihemoglobina (HbCO) de fumar reduce transporte de oxígeno. En atletas se traduce en ~5% menos VO2max por cada 10 pack-years. Vida media de CO en sangre: 4-6h. Mejor opción: dejar de fumar 2h antes de entrenar.",
         "Suminski et al. 2009 · J Smok Cessation"),

        # Stress
        ("chronic_stress", "stress", "warning",
         "Stress crónico · enemigo de la fuerza",
         "Cortisol elevado >2 semanas reduce testosterona, masa muscular y motivación.",
         "El stress eleva cortisol agudo (normal) y luego crónico (problema). Atletas con HRV crónicamente baja muestran 22% más riesgo de overtraining. Estrategias: respiración 4-7-8, journaling, sleep priority, reducir volumen entrenamiento -20% durante semanas estresantes.",
         "Stults-Kolehmainen & Bartholomew 2012 · Med Sci Sports Exerc"),

        # Recovery
        ("recovery_active", "recovery", "info",
         "Recovery activo > recovery pasivo",
         "10-15min de movilidad + zona 2 acelera recuperación 30% vs reposo total.",
         "El flujo sanguíneo bajo intensidad (50-60% FCmax) acelera clearance de lactato y subproductos metabólicos. Recovery activo post-WOD: 5-10min bike easy + foam rolling. En días off: 20-30min caminata + movilidad articular.",
         "Bahnert et al. 2013 · Sports Med"),

        # Hormonal
        ("luteal_phase", "hormonal", "info",
         "Fase lútea · contexto importante",
         "Días 18-28 · más fatiga + menor tolerancia al calor · bajemos volumen 20-30%.",
         "En fase lútea el cuerpo prioriza función reproductiva: temperatura basal sube 0.3°C, retención de líquidos aumenta, motivación baja. Estrategia: priorizar técnica, reducir volumen 20-30%, evitar tests máximos. Atletas de élite reportan -5-10% en fuerza máxima durante esta fase.",
         "Sims & Heather 2018 · Exp Physiol"),

        # Training
        ("rest_day_purpose", "training", "info",
         "Día de descanso = día de progreso",
         "El cuerpo se adapta DURANTE el descanso · no entrenando · si lo saltás, retrocedés.",
         "Adaptaciones (supercompensación) ocurren post-entrenamiento. Sin recovery suficiente, no hay adaptación. 1-2 días off/semana son obligatorios. Síntomas de under-recovery: HRV ↓, sueño peor, motivación baja, RPE alto en esfuerzos submáximos.",
         "Bompa & Buzzichelli 2015 · Periodization training"),

        # Injury prevention
        ("warmup_15min", "injury_prevention", "info",
         "Calentamiento <10min · riesgo lesión sube 2x",
         "10-15min de warmup específico reduce lesiones 30-50%.",
         "Warmup eleva temperatura muscular (mejor compliance), activa CNS (mejor reclutamiento), aumenta rango articular. Estructura: 3min cardio leve + 5min movilidad dinámica + 5min activación específica del WOD.",
         "Fradkin et al. 2010 · J Strength Cond Res"),

        # Nutrition
        ("pre_wod_meal", "nutrition", "info",
         "Comida pre-WOD · 1-3h antes",
         "Última comida sólida 2-3h antes · evita PR con estómago lleno.",
         "Comer cerca del entrenamiento desvía flujo sanguíneo al sistema digestivo, reduciendo performance. Ideal: comida balanceada (carbs + proteína + poca grasa) 2-3h antes. Si no es posible: snack ligero (banana, dátiles) 30-60min antes.",
         "Burke et al. 2011 · J Sports Sci"),
    ]

    inserted = 0
    async with pool.acquire() as conn:
        for slug, category, severity, title, short_text, long_text, citation in PILLS:
            try:
                await conn.execute(
                    """
                    INSERT INTO knowledge_pills
                        (slug, category, severity, title, short_text, long_text, citation,
                         trigger_rules, related_engines)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, '{}'::jsonb, $8::jsonb)
                    ON CONFLICT (slug) DO NOTHING
                    """,
                    slug, category, severity, title, short_text, long_text, citation,
                    _json.dumps([category]),
                )
                inserted += 1
            except Exception as e:
                print(f"[seed-pills] {slug}: {e}")

        total = await conn.fetchval("SELECT COUNT(*) FROM knowledge_pills")

    return {"ok": True, "inserted_this_run": inserted, "total_in_db": total}


@router.post("/seed-demo")
async def run_seed_demo(
    reset: bool = False,
    x_admin_token: Optional[str] = Header(default=None),
):
    """
    Corre el seed de datos demo · pobla coach + 6 atletas + baselines +
    30 días wod_results + 90 días cf_sessions.

    Si reset=True, borra los users demo primero (CASCADE limpia todo lo asociado).

    Idempotente: re-correr sin reset no duplica datos.
    """
    check_admin(x_admin_token)

    # Import perezoso · evita ciclo en boot
    import os
    if reset:
        os.environ["DEMO_SEED_RESET"] = "1"
    try:
        from ..scripts.seed_demo import seed as _seed_demo  # type: ignore
    except ImportError:
        # Si la estructura de paquete no incluye scripts/, intentamos path absoluto
        import importlib.util
        from pathlib import Path
        candidates = [
            Path("/app/scripts/seed_demo.py"),
            Path("/app/backend/scripts/seed_demo.py"),
            Path(__file__).resolve().parent.parent.parent / "scripts" / "seed_demo.py",
        ]
        seed_path = next((p for p in candidates if p.exists()), None)
        if seed_path is None:
            raise HTTPException(500, f"seed_demo.py not found. Tried: {[str(p) for p in candidates]}")
        spec = importlib.util.spec_from_file_location("seed_demo", seed_path)
        if spec is None or spec.loader is None:
            raise HTTPException(500, "Could not load seed_demo spec")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _seed_demo = module.seed

    try:
        await _seed_demo()
    except Exception as e:
        raise HTTPException(500, f"Seed failed: {str(e)[:300]}")
    finally:
        os.environ.pop("DEMO_SEED_RESET", None)

    pool = await users_repo.get_pool()
    if pool is not None:
        async with pool.acquire() as conn:
            n_demo = await conn.fetchval(
                "SELECT COUNT(*) FROM users WHERE email LIKE '%.demo@holyoly.app' OR email = 'coach.demo@holyoly.app'",
            )
        return {
            "ok": True,
            "reset_used": reset,
            "demo_users_count": n_demo,
            "credentials": {
                "coach":  "coach.demo@holyoly.app  /  DemoCoach2026!",
                "athlete": "<nombre>.demo@holyoly.app  /  DemoAth2026!",
            },
        }
    return {"ok": True, "reset_used": reset}


@router.get("/db-status")
async def db_status(x_admin_token: Optional[str] = Header(default=None)):
    """Inspecciona qué tablas existen + count rápido."""
    check_admin(x_admin_token)
    pool = await users_repo.get_pool()
    if pool is None:
        return {"connected": False}

    async with pool.acquire() as conn:
        tables = await conn.fetch(
            """
            SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
            """
        )
        table_names = [r["tablename"] for r in tables]

        counts = {}
        for t in ["users", "baseline_results", "social_screenshots", "payment_intents"]:
            if t in table_names:
                try:
                    row = await conn.fetchrow(f"SELECT COUNT(*) as n FROM {t}")
                    counts[t] = row["n"]
                except Exception as e:
                    counts[t] = f"error: {str(e)[:100]}"

        return {
            "connected": True,
            "tables": table_names,
            "counts": counts,
        }
