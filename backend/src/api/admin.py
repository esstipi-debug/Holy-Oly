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
