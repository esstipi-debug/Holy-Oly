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
import uuid
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


async def find_by_github_id(github_id: int) -> Optional[dict]:
    """Find user by GitHub ID."""
    pool = await get_pool()
    if pool is None:
        from ..api.auth.jwt_utils import MOCK_USERS
        for u in MOCK_USERS.values():
            if u.get("github_id") == github_id:
                return u
        return None

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, name, password_hash, role, coach_id,
                   github_id, github_login, product, tier, avatar_url
            FROM users WHERE github_id = $1
            """,
            github_id,
        )
        return dict(row) if row else None


async def create_github_user(
    email: str,
    name: str,
    github_id: int,
    github_login: str,
    avatar_url: Optional[str] = None,
    role: str = "athlete",
    product: str = "volta",
) -> dict:
    """Create a new user authenticated via GitHub."""
    pool = await get_pool()
    if pool is None:
        from ..api.auth.jwt_utils import MOCK_USERS
        user_id = f"{role}_{uuid.uuid4().hex[:12]}"
        user_data = {
            "id": user_id,
            "email": email.lower().strip(),
            "name": name,
            "hashed_password": None,
            "role": role,
            "product": product,
            "coach_id": None,
            "is_active": True,
            "github_id": github_id,
            "github_login": github_login,
            "avatar_url": avatar_url,
        }
        MOCK_USERS[email.lower().strip()] = user_data
        return user_data

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, name, role, product, github_id, github_login, avatar_url)
            VALUES ($1, $2, $3::user_role, $4, $5, $6, $7)
            RETURNING id, email, name, role, product, github_id, github_login, avatar_url
            """,
            email.lower().strip(),
            name,
            role,
            product,
            github_id,
            github_login,
            avatar_url,
        )
        return dict(row)
