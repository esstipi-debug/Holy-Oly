"""
Database configuration — SQLAlchemy async engine + session factory.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings
import logging

logger = logging.getLogger("motor25.database")


def get_async_url(url: str) -> str:
    """Convierte postgresql:// o postgres:// a postgresql+asyncpg://"""
    url = url.replace("postgresql://", "postgresql+asyncpg://")
    url = url.replace("postgres://", "postgresql+asyncpg://")
    return url


engine = create_async_engine(
    get_async_url(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """Dependencia FastAPI: provee AsyncSession y hace commit/rollback automático."""
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Crea todas las tablas si no existen (run on startup)."""
    # Import models so Base.metadata is populated
    from . import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized.")
