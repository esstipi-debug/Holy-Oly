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
