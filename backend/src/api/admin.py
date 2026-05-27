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
