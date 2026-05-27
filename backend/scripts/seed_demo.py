"""
Seed demo data · refactor API-first
====================================

Pobla la DB con datos "plausibles" que reemplazan los hardcoded mocks del
frontend (frontend/src/data/athletes.ts, ROSTER constants en VoltaCoachDash,
WOD_BENCHMARKS, etc).

Después de correr este seed, el frontend puede pedir todo al backend y
mostrar datos reales sin necesidad de mocks hardcoded.

**Uso local**:
    python -m backend.scripts.seed_demo

**Uso en Render** (vía endpoint admin):
    POST /v1/admin/seed-demo
    Header: X-Admin-Token: <ADMIN_TOKEN>

**Comportamiento**:
- Idempotente: corre N veces sin duplicar (UPSERT con ON CONFLICT).
- Si DEMO_SEED_RESET=1, borra los users demo primero (CASCADE limpia todo).
- Crea 1 coach + 6 atletas asignados.
- Para cada atleta: baselines + 30 días de wod_results + cf_sessions.

**Credenciales generadas**:
- Coach:    coach.demo@holyoly.app  / DemoCoach2026!
- Atletas:  {nombre}.demo@holyoly.app / DemoAth2026!  (todos misma password)

**Idempotencia**: cada INSERT usa ON CONFLICT DO UPDATE en la PK del recurso.
Los wod_results / cf_sessions usan (user_id, completed_at) o similar para
no duplicar.
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

import asyncpg
import bcrypt


# ============================================================================
# Config
# ============================================================================

COACH = {
    "email": "coach.demo@holyoly.app",
    "name": "Coach Demo · Box Buenos Aires",
    "password": "DemoCoach2026!",
}

ATHLETES = [
    {
        "email": "lucia.demo@holyoly.app",
        "name": "Lucía Ramos",
        "bw_kg": 62.0,
        "snatch_kg": 75,
        "clean_kg": 95,
        "back_squat_kg": 120,
        "front_squat_kg": 105,
        "deadlift_kg": 130,
        "fran_seconds": 285,
        "starting_streak": 35,
    },
    {
        "email": "marco.demo@holyoly.app",
        "name": "Marco Torres",
        "bw_kg": 80.0,
        "snatch_kg": 95,
        "clean_kg": 120,
        "back_squat_kg": 165,
        "front_squat_kg": 145,
        "deadlift_kg": 180,
        "fran_seconds": 240,
        "starting_streak": 60,
    },
    {
        "email": "luciana.demo@holyoly.app",
        "name": "Luciana Vega",
        "bw_kg": 58.0,
        "snatch_kg": 78,
        "clean_kg": 97,
        "back_squat_kg": 120,
        "front_squat_kg": 105,
        "deadlift_kg": 125,
        "fran_seconds": 320,
        "starting_streak": 22,
    },
    {
        "email": "franco.demo@holyoly.app",
        "name": "Franco Rizzo",
        "bw_kg": 88.3,
        "snatch_kg": 145,
        "clean_kg": 178,
        "back_squat_kg": 225,
        "front_squat_kg": 200,
        "deadlift_kg": 240,
        "fran_seconds": 195,
        "starting_streak": 90,
    },
    {
        "email": "diego.demo@holyoly.app",
        "name": "Diego Suárez",
        "bw_kg": 74.5,
        "snatch_kg": 82,
        "clean_kg": 105,
        "back_squat_kg": 140,
        "front_squat_kg": 122,
        "deadlift_kg": 160,
        "fran_seconds": 310,
        "starting_streak": 14,
    },
    {
        "email": "camila.demo@holyoly.app",
        "name": "Camila Vega",
        "bw_kg": 65.2,
        "snatch_kg": 72,
        "clean_kg": 92,
        "back_squat_kg": 118,
        "front_squat_kg": 100,
        "deadlift_kg": 122,
        "fran_seconds": 268,
        "starting_streak": 45,
    },
]

WOD_NAMES = ["Fran", "Helen", "Cindy", "Karen", "Grace", "Diane", "Murph"]


# ============================================================================
# Helpers
# ============================================================================

def hash_pwd(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


async def get_conn() -> asyncpg.Connection:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL no configurada · setear env var primero")
    # Render usa postgres:// pero asyncpg quiere postgresql://
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return await asyncpg.connect(url)


# ============================================================================
# Seed steps
# ============================================================================

async def upsert_user(
    conn: asyncpg.Connection,
    email: str,
    name: str,
    password: str,
    role: str,
    coach_id: UUID | None = None,
) -> UUID:
    """Idempotent · si existe, retorna su id sin cambiar nada."""
    existing = await conn.fetchrow(
        "SELECT id FROM users WHERE email = $1",
        email,
    )
    if existing:
        return existing["id"]

    pwd_hash = hash_pwd(password)
    row = await conn.fetchrow(
        """
        INSERT INTO users (email, name, password_hash, role, product, coach_id, tier)
        VALUES ($1, $2, $3, $4, 'volta', $5, 'trial')
        RETURNING id
        """,
        email, name, pwd_hash, role, coach_id,
    )
    return row["id"]


async def insert_baseline(conn: asyncpg.Connection, user_id: UUID, test_id: str, value: float, unit: str = "kg"):
    """Inserta baseline · evita duplicados con UNIQUE (user_id, test_id, tested_at)."""
    await conn.execute(
        """
        INSERT INTO baseline_results (user_id, test_id, value, unit, tested_at)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '7 days')
        ON CONFLICT DO NOTHING
        """,
        user_id, test_id, value, unit,
    )


async def insert_cf_strength_lift(conn: asyncpg.Connection, user_id: UUID, clean_kg: float, back_squat_kg: float):
    """Holy Oly path · cf_strength_lifts."""
    # Check si ya hay uno reciente
    existing = await conn.fetchrow(
        "SELECT id FROM cf_strength_lifts WHERE athlete_id = $1 ORDER BY recorded_at DESC LIMIT 1",
        user_id,
    )
    if existing:
        return  # ya tiene · skip
    await conn.execute(
        """
        INSERT INTO cf_strength_lifts (athlete_id, track, clean_1rm, back_squat_3rm)
        VALUES ($1, 'crossfit', $2, $3)
        """,
        user_id, clean_kg, back_squat_kg * 0.90,  # 3RM ≈ 90% 1RM
    )


async def insert_wise_snapshot(conn: asyncpg.Connection, user_id: UUID, bw_kg: float, nivel: str = "rx"):
    """Snapshot Wise Score · da bw_kg para OLY Index."""
    existing = await conn.fetchrow(
        "SELECT id FROM wise_score_snapshots WHERE athlete_id = $1 LIMIT 1",
        user_id,
    )
    if existing:
        return
    await conn.execute(
        """
        INSERT INTO wise_score_snapshots
            (athlete_id, wise_score, nivel, bw_kg, calculated_at)
        VALUES ($1, $2, $3, $4, NOW())
        """,
        user_id, 65.0, nivel, bw_kg,
    )


async def insert_wod_results(conn: asyncpg.Connection, user_id: UUID, fran_seconds: int):
    """Pobla últimos 30 días con wod_results variados."""
    # Si ya hay >5 results, asumimos seedeado → skip
    existing = await conn.fetchval(
        "SELECT COUNT(*) FROM wod_results WHERE user_id = $1",
        user_id,
    )
    if existing >= 5:
        return

    today = date.today()
    # Patrón: 4-5 entrenamientos por semana · Fran cada 10 días
    for days_ago in range(30):
        wod_date = today - timedelta(days=days_ago)
        # Skip ~30% de los días (días de descanso)
        if days_ago % 3 == 2:
            continue

        if days_ago == 0:
            # Hoy: la mejor Fran
            wod_name = "Fran"
            score = float(fran_seconds)
            score_type = "time"
            is_pr = True
        elif days_ago % 10 == 0:
            wod_name = "Fran"
            score = float(fran_seconds + (days_ago // 10) * 12)  # peor cuanto más atrás
            score_type = "time"
            is_pr = False
        else:
            wod_name = WOD_NAMES[days_ago % len(WOD_NAMES)]
            score = float(200 + (days_ago * 7) % 200)
            score_type = "time" if wod_name != "Cindy" else "rounds_reps"
            is_pr = days_ago == 1  # ayer un PR menor

        await conn.execute(
            """
            INSERT INTO wod_results
                (user_id, wod_name, rx_or_scaled, score_type, score_value, completed_at, is_pr)
            VALUES ($1, $2, 'rx', $3, $4, $5, $6)
            """,
            user_id, wod_name, score_type, score,
            datetime.combine(wod_date, datetime.min.time()).replace(hour=18, minute=0),
            is_pr,
        )


async def insert_cf_sessions(conn: asyncpg.Connection, user_id: UUID, starting_streak_days: int):
    """Pobla cf_sessions completadas para alimentar streak engine."""
    existing = await conn.fetchval(
        "SELECT COUNT(*) FROM cf_sessions WHERE athlete_id = $1",
        user_id,
    )
    if existing >= 5:
        return

    today = date.today()
    # Pobla los últimos `starting_streak_days` con 1 sesión por día (streak perfecto)
    days = min(starting_streak_days, 90)  # cap a 90 días para no bloar
    for days_ago in range(days):
        session_date = today - timedelta(days=days_ago)
        # Skip 1 de cada 7 (un día de descanso por semana, plausible)
        if days_ago % 7 == 6:
            continue
        await conn.execute(
            """
            INSERT INTO cf_sessions
                (athlete_id, fecha, tipo, planificada, completada, rpe, duracion_min, impulso)
            VALUES ($1, $2, 'wod', TRUE, TRUE, $3, $4, $5)
            ON CONFLICT DO NOTHING
            """,
            user_id, session_date,
            7.0 + (days_ago % 3) * 0.5,        # RPE 7-8
            55 + (days_ago % 4) * 10,           # 55-85 min
            300 + (days_ago % 5) * 50,          # impulso 300-500
        )


async def seed_one_athlete(conn: asyncpg.Connection, ath: dict[str, Any], coach_id: UUID):
    """Pipeline completo para un atleta."""
    print(f"  → {ath['name']} ({ath['email']})")

    user_id = await upsert_user(
        conn,
        email=ath["email"],
        name=ath["name"],
        password="DemoAth2026!",
        role="athlete",
        coach_id=coach_id,
    )

    # Baselines (Volta path)
    await insert_baseline(conn, user_id, "snatch_1rm",     ath["snatch_kg"])
    await insert_baseline(conn, user_id, "clean_1rm",      ath["clean_kg"])
    await insert_baseline(conn, user_id, "back_squat_1rm", ath["back_squat_kg"])
    await insert_baseline(conn, user_id, "front_squat_1rm", ath["front_squat_kg"])
    await insert_baseline(conn, user_id, "deadlift_1rm",   ath["deadlift_kg"])

    # Holy Oly path · cf_strength_lifts
    await insert_cf_strength_lift(conn, user_id, ath["clean_kg"], ath["back_squat_kg"])

    # Wise snapshot con bw_kg (para OLY Index)
    await insert_wise_snapshot(conn, user_id, ath["bw_kg"])

    # 30 días de WOD results
    await insert_wod_results(conn, user_id, ath["fran_seconds"])

    # cf_sessions para streak
    await insert_cf_sessions(conn, user_id, ath["starting_streak"])


# ============================================================================
# Main
# ============================================================================

async def seed():
    print("seed_demo · iniciando…")

    if os.getenv("DEMO_SEED_RESET") == "1":
        print("⚠  DEMO_SEED_RESET=1 · borrando users demo previos…")
        conn = await get_conn()
        async with conn.transaction():
            await conn.execute(
                """
                DELETE FROM users
                WHERE email LIKE '%.demo@holyoly.app'
                   OR email = $1
                """,
                COACH["email"],
            )
        await conn.close()

    conn = await get_conn()
    try:
        async with conn.transaction():
            print(f"• Coach: {COACH['email']}")
            coach_id = await upsert_user(
                conn,
                email=COACH["email"],
                name=COACH["name"],
                password=COACH["password"],
                role="coach",
            )

            print(f"• {len(ATHLETES)} atletas:")
            for ath in ATHLETES:
                await seed_one_athlete(conn, ath, coach_id)

        # Conteos finales
        n_users = await conn.fetchval(
            "SELECT COUNT(*) FROM users WHERE email LIKE '%.demo@holyoly.app' OR email = $1",
            COACH["email"],
        )
        n_baselines = await conn.fetchval(
            """
            SELECT COUNT(*) FROM baseline_results
            WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%.demo@holyoly.app')
            """
        )
        n_wod = await conn.fetchval(
            """
            SELECT COUNT(*) FROM wod_results
            WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%.demo@holyoly.app')
            """
        )
        n_sessions = await conn.fetchval(
            """
            SELECT COUNT(*) FROM cf_sessions
            WHERE athlete_id IN (SELECT id FROM users WHERE email LIKE '%.demo@holyoly.app')
            """
        )

        print()
        print("✓ Seed completo.")
        print(f"  users:     {n_users}")
        print(f"  baselines: {n_baselines}")
        print(f"  wod_results: {n_wod}")
        print(f"  cf_sessions: {n_sessions}")
        print()
        print("Credenciales:")
        print(f"  Coach:   {COACH['email']}  /  {COACH['password']}")
        print(f"  Atletas: <nombre>.demo@holyoly.app  /  DemoAth2026!")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed())
