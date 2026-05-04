"""
Athlete endpoints — dashboard, sessions CRUD.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from ..database import get_db
from ..models import User, Session
from .auth.auth import verify_token
from .auth.jwt_utils import User as CurrentUser

router = APIRouter(prefix="/v1/athlete", tags=["athlete"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: CurrentUser = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Resumen del atleta: conteo de sesiones + últimas 10."""
    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id)
        .order_by(desc(Session.date))
        .limit(10)
    )
    sessions_list = result.scalars().all()

    return {
        "user": {"id": current_user.id, "email": current_user.email},
        "sessions_count": len(sessions_list),
        "recent_sessions": [
            {
                "id": s.id,
                "date": s.date.isoformat(),
                "rpe": s.rpe,
                "completed": s.completed,
                "duration_minutes": s.duration_minutes,
            }
            for s in sessions_list
        ],
        "oly_index": 74,   # calculado en futuro
        "readiness": 85,
    }


@router.post("/sessions")
async def create_session(
    data: dict,
    current_user: CurrentUser = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Crea una nueva sesión de entrenamiento."""
    session = Session(
        user_id=current_user.id,
        rpe=data.get("rpe"),
        duration_minutes=data.get("duration_minutes"),
        notes=data.get("notes", ""),
        type=data.get("type", "olympic"),
        completed=True,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return {
        "id": session.id,
        "date": session.date.isoformat(),
        "rpe": session.rpe,
        "duration_minutes": session.duration_minutes,
        "completed": session.completed,
    }


@router.get("/sessions")
async def get_sessions(
    current_user: CurrentUser = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas las sesiones del atleta."""
    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id)
        .order_by(desc(Session.date))
    )
    sessions = result.scalars().all()

    return [
        {
            "id": s.id,
            "date": s.date.isoformat(),
            "rpe": s.rpe,
            "completed": s.completed,
            "duration_minutes": s.duration_minutes,
            "type": s.type,
            "notes": s.notes,
        }
        for s in sessions
    ]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: CurrentUser = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene una sesión específica del atleta."""
    from fastapi import HTTPException
    result = await db.execute(
        select(Session).where(
            Session.id == session_id,
            Session.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    return {
        "id": session.id,
        "date": session.date.isoformat(),
        "rpe": session.rpe,
        "completed": session.completed,
        "duration_minutes": session.duration_minutes,
        "type": session.type,
        "notes": session.notes,
    }
