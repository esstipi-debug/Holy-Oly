"""
Users repository — abstracts user storage.

Tries Postgres/AlloyDB first via DATABASE_URL; falls back to MOCK_USERS
if no DB pool is available (dev mode).

Used by:
- auth/jwt_utils.py (authenticate_user, get_user)
- auth/auth.py (login, register, GitHub OAuth callback)
"""
from typing import Optional, Any
import os
import logging

logger = logging.getLogger(__name__)

# Lazy import to avoid pulling asyncpg if DB not configured
_pool: Optional[Any] = None
_pool_attempted = False


async def get_pool():
    """Get or initialize the asyncpg pool. Returns None if DB not configured."""
    global _pool, _pool_attempted
    if _pool is not None:
        return _pool
    if _pool_attempted:
        return None
    _pool_attempted = True

    db_url = os.getenv("DATABASE_URL")
    if not db_url or db_url.startswith("postgresql://user:pass@localhost"):
        logger.info("[users_repo] DATABASE_URL not configured — using MOCK_USERS")
        return None

    try:
        import asyncpg
        _pool = await asyncpg.create_pool(db_url, min_size=1, max_size=5)
        logger.info("[users_repo] Connected to Postgres pool")
        return _pool
    except Exception as e:
        logger.warning(f"[users_repo] Failed to init pool ({e}) — falling back to MOCK_USERS")
        return None


async def find_by_email(email: str) -> Optional[dict]:
    """Find user by email. Returns dict or None."""
    pool = await get_pool()
    if pool is None:
        from ..api.auth.jwt_utils import MOCK_USERS
        return MOCK_USERS.get(email.lower().strip())

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, name, password_hash, role, coach_id,
                   github_id, github_login, product, tier, avatar_url
            FROM users WHERE email = $1
            """,
            email.lower().strip(),
        )
        return dict(row) if row else None


async def find_by_id(user_id: str) -> Optional[dict]:
    """Find user by ID."""
    pool = await get_pool()
    if pool is None:
        from ..api.auth.jwt_utils import MOCK_USERS
        for u in MOCK_USERS.values():
            if u["id"] == user_id:
                return u
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, name, password_hash, role, coach_id,
                   github_id, github_login, product, tier, avatar_url
            FROM users WHERE id = $1::uuid
            """,
            user_id,
        )
        return dict(row) if row else None


# ============================================================
# CREATE / WRITE
# ============================================================

async def create_user(
    *,
    email: str,
    name: str,
    password_hash: str,
    role: str = "athlete",
    product: str = "volta",
) -> dict:
    """
    Crea un nuevo usuario. Falls back to MOCK_USERS si no hay DATABASE_URL.
    Devuelve dict listo para serializar.
    """
    email = email.lower().strip()
    pool = await get_pool()

    if pool is None:
        from ..api.auth.jwt_utils import MOCK_USERS
        import uuid as _uuid
        user_id = f"{role}_{_uuid.uuid4().hex[:12]}"
        record = {
            "id": user_id, "email": email, "name": name,
            "hashed_password": password_hash, "password_hash": password_hash,
            "role": role, "product": product, "coach_id": None,
            "is_active": True, "tier": "trial",
        }
        MOCK_USERS[email] = record
        return record

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, name, password_hash, role, product, tier)
            VALUES ($1, $2, $3, $4::user_role, $5, 'trial'::subscription_tier)
            RETURNING id, email, name, role::text AS role, product, tier::text AS tier,
                      trial_ends_at, created_at
            """,
            email, name, password_hash, role, product,
        )
        result = dict(row)
        result["id"] = str(result["id"])
        return result


# ============================================================
# BASELINE RESULTS (Tests de Referencia)
# ============================================================

async def save_baseline_result(
    *, user_id: str, test_id: str, value: float, unit: str
) -> dict:
    pool = await get_pool()
    if pool is None:
        return {"id": "mock", "user_id": user_id, "test_id": test_id, "value": value, "unit": unit}
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO baseline_results (user_id, test_id, value, unit)
            VALUES ($1::uuid, $2, $3, $4)
            RETURNING id, user_id, test_id, value, unit, tested_at
            """,
            user_id, test_id, value, unit,
        )
        d = dict(row); d["id"] = str(d["id"]); d["user_id"] = str(d["user_id"])
        return d


async def get_baseline_results(user_id: str) -> list[dict]:
    """Último resultado por test_id."""
    pool = await get_pool()
    if pool is None:
        return []
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DISTINCT ON (test_id)
                   test_id, value, unit, tested_at
            FROM baseline_results
            WHERE user_id = $1::uuid
            ORDER BY test_id, tested_at DESC
            """,
            user_id,
        )
        return [dict(r) for r in rows]


async def delete_baseline_result(user_id: str, test_id: str) -> bool:
    pool = await get_pool()
    if pool is None:
        return False
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM baseline_results WHERE user_id = $1::uuid AND test_id = $2",
            user_id, test_id,
        )
        return result.endswith("0") is False  # 'DELETE N' — N>0 si borró


# ============================================================
# SOCIAL SCREENSHOTS (analytics de viralidad)
# ============================================================

async def log_screenshot(
    *,
    user_id: Optional[str],
    card_variant: str,
    achievement_type: str,
    achievement_id: Optional[str] = None,
    dwell_time_ms: Optional[int] = None,
    detection_method: str = "visibilitychange",
) -> dict:
    pool = await get_pool()
    if pool is None:
        return {"logged": False, "reason": "no_db"}
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO social_screenshots
                (user_id, card_variant, achievement_type, achievement_id,
                 dwell_time_ms, detection_method)
            VALUES ($1::uuid, $2, $3, $4, $5, $6)
            RETURNING id, created_at
            """,
            user_id, card_variant, achievement_type, achievement_id,
            dwell_time_ms, detection_method,
        )
        d = dict(row); d["id"] = str(d["id"]); d["logged"] = True
        return d

