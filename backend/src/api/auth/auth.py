from fastapi import HTTPException, Security, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Literal
import uuid
from .jwt_utils import (
    decode_token, authenticate_user, create_access_token,
    get_user, User, TokenData, MOCK_USERS, get_password_hash
)
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from context import current_user_id_var

# Esquemas de seguridad
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verifica el token JWT y retorna el usuario autenticado.

    Busca primero en Postgres (vía users_repo) si hay DB pool configurado.
    Fallback a MOCK_USERS (in-memory, dev).
    """
    token = credentials.credentials
    token_data = decode_token(token)

    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Intentar Postgres (UUID válido)
    user: Optional[User] = None
    try:
        from ...db import users_repo
        row = await users_repo.find_by_id(token_data.user_id)
        if row:
            user = User(
                id=str(row["id"]),
                email=row["email"],
                role=row.get("role", "athlete"),
                coach_id=str(row["coach_id"]) if row.get("coach_id") else None,
                is_active=row.get("is_active", True),
            )
    except Exception:
        # Si find_by_id falla (ej. ID no es UUID válido en Postgres), fallback
        user = None

    # 2. Fallback a MOCK_USERS
    if user is None:
        user = get_user(token_data.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )

    current_user_id_var.set(user.id)
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Obtiene el usuario actual desde el token OAuth2."""
    token_data = decode_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user(token_data.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Establecemos el ID del usuario en el contexto para RLS
    current_user_id_var.set(user.id)
    
    return user

def authorize_role(required_roles: List[str]):
    """
    Factory de dependencias para autorización por roles.
    
    Uso:
        @router.get("/admin-only", dependencies=[Depends(authorize_role(["admin"]))])
        
        @router.get("/coach-only", dependencies=[Depends(authorize_role(["coach", "admin"]))])
    """
    def role_checker(current_user: User = Depends(verify_token)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de los siguientes roles: {', '.join(required_roles)}"
            )
        return current_user
    return role_checker

def authorize_coach_or_admin(current_user: User = Depends(verify_token)) -> User:
    """Autoriza solo coaches y admins."""
    if current_user.role not in ["coach", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de coach o administrador"
        )
    return current_user

def authorize_athlete_or_coach(current_user: User = Depends(verify_token)) -> User:
    """Autoriza atletas (solo sus datos) y coaches (sus atletas)."""
    if current_user.role not in ["athlete", "coach", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso no autorizado"
        )
    return current_user

def can_access_athlete_data(athlete_id: str, current_user: User = Depends(verify_token)) -> bool:
    """
    Verifica si el usuario actual puede acceder a los datos de un atleta específico.
    
    Reglas:
    - Admin: puede ver todos los datos
    - Coach: puede ver datos de sus atletas asignados
    - Athlete: solo puede ver sus propios datos
    """
    if current_user.role == "admin":
        return True
    
    if current_user.role == "coach":
        # Aquí deberíamos verificar en la BD si el atleta pertenece al coach
        # Por ahora, mock simple
        return True  # TODO: Implementar verificación real
    
    if current_user.role == "athlete":
        return current_user.id == athlete_id
    
    return False

# Endpoints de autenticación
from fastapi import APIRouter
auth_router = APIRouter(prefix="/v1/auth", tags=["auth"])

@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint para obtener token JWT.

    Busca primero en Postgres (vía users_repo) si hay DB pool configurado,
    fallback a MOCK_USERS in-memory.
    """
    from ...db import users_repo
    from .jwt_utils import verify_password

    user = None
    email = form_data.username.lower().strip()

    # 1. Intentar Postgres
    try:
        row = await users_repo.find_by_email(email)
        if row and verify_password(form_data.password, row["password_hash"]):
            user = User(
                id=str(row["id"]),
                email=row["email"],
                role=row.get("role", "athlete"),
                coach_id=str(row["coach_id"]) if row.get("coach_id") else None,
                is_active=row.get("is_active", True),
            )
    except Exception:
        user = None

    # 2. Fallback a MOCK_USERS
    if user is None:
        user = authenticate_user(email, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={
            "sub": user.id,
            "email": user.email,
            "role": user.role
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }

@auth_router.post("/refresh")
async def refresh_token(current_user: User = Depends(verify_token)):
    """Endpoint para refrescar un token JWT."""
    new_token = create_access_token(
        data={
            "sub": current_user.id,
            "email": current_user.email,
            "role": current_user.role
        }
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }

@auth_router.get("/me")
async def get_me(current_user: User = Depends(verify_token)):
    """Endpoint para obtener información del usuario actual."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "coach_id": current_user.coach_id,
        "is_active": current_user.is_active
    }


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["athlete", "coach"] = "athlete"
    product: Literal["holy-oly", "volta"] = "holy-oly"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("La contraseña debe tener al menos 6 caracteres")
        return v


@auth_router.post("/register")
async def register(payload: RegisterPayload):
    """
    Crea una nueva cuenta. Persiste en Postgres si DATABASE_URL está configurado,
    falls back a MOCK_USERS in-memory en dev local.

    Devuelve token + user con la misma forma que /login.
    """
    from ...db import users_repo

    email = payload.email.lower().strip()

    # Conflict check (Postgres + mock cubiertos por find_by_email)
    existing = await users_repo.find_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email",
        )

    user = await users_repo.create_user(
        email=email,
        name=payload.name.strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role,
        product=payload.product,
    )

    user_id = str(user["id"])
    access_token = create_access_token(
        data={"sub": user_id, "email": email, "role": payload.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "name": user["name"],
            "role": payload.role,
            "product": payload.product,
            "tier": user.get("tier", "trial"),
            "trial_ends_at": str(user.get("trial_ends_at")) if user.get("trial_ends_at") else None,
        },
    }
