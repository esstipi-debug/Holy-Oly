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
    """Verifica el token JWT y retorna el usuario autenticado."""
    token = credentials.credentials
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
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario desactivado"
        )
    
    # Establecemos el ID del usuario en el contexto para RLS
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
    """Endpoint para obtener token JWT."""
    user = authenticate_user(form_data.username, form_data.password)
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


# ============================================================
# GitHub OAuth
# ============================================================

import secrets
import httpx

# State temporal en memoria (en prod: usar Redis)
_oauth_states: dict[str, float] = {}

def _cleanup_states():
    """Limpia states expirados (>10 min)."""
    import time
    now = time.time()
    expired = [s for s, t in _oauth_states.items() if now - t > 600]
    for s in expired:
        _oauth_states.pop(s, None)


class GithubCallbackPayload(BaseModel):
    code: str
    state: Optional[str] = None


@auth_router.get("/github/authorize")
async def github_authorize():
    """Devuelve URL de autorización GitHub para redirigir al usuario."""
    client_id = os.getenv("GITHUB_OAUTH_CLIENT_ID")
    callback_url = os.getenv("GITHUB_OAUTH_CALLBACK_URL", "http://localhost:5173/#/github_callback")

    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth no configurado (falta GITHUB_OAUTH_CLIENT_ID)",
        )

    _cleanup_states()
    import time
    state = secrets.token_urlsafe(32)
    _oauth_states[state] = time.time()

    authorize_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={client_id}"
        f"&redirect_uri={callback_url}"
        f"&scope=user:email"
        f"&state={state}"
    )

    return {"authorize_url": authorize_url, "state": state}


@auth_router.post("/github/callback")
async def github_callback(payload: GithubCallbackPayload):
    """Intercambia código de GitHub por JWT token."""
    client_id = os.getenv("GITHUB_OAUTH_CLIENT_ID")
    client_secret = os.getenv("GITHUB_OAUTH_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth no configurado",
        )

    # Validar state (CSRF) si vino
    if payload.state:
        _cleanup_states()
        if payload.state not in _oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="State inválido o expirado",
            )
        _oauth_states.pop(payload.state, None)

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Exchange code → token
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": client_id,
                "client_secret": client_secret,
                "code": payload.code,
            },
            headers={"Accept": "application/json"},
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Error al obtener token de GitHub")

        gh_data = token_res.json()
        gh_token = gh_data.get("access_token")
        if not gh_token:
            raise HTTPException(status_code=400, detail=gh_data.get("error_description", "Token no recibido"))

        # 2. Fetch user info
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Error al obtener perfil de GitHub")
        gh_user = user_res.json()

        # 3. Fetch email (puede ser privado)
        email = gh_user.get("email")
        if not email:
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {gh_token}", "Accept": "application/json"},
            )
            if email_res.status_code == 200:
                emails = email_res.json()
                primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
                if primary:
                    email = primary["email"]

        if not email:
            raise HTTPException(status_code=400, detail="No se pudo obtener email de GitHub")

    # 4. Find or create user (DB-backed con fallback a MOCK_USERS)
    from ...db import users_repo
    email_key = email.lower().strip()
    user_data = await users_repo.find_by_github_id(gh_user["id"]) or await users_repo.find_by_email(email_key)
    if not user_data:
        user_data = await users_repo.create_github_user(
            email=email_key,
            name=gh_user.get("name") or gh_user.get("login") or email_key.split("@")[0],
            github_id=gh_user["id"],
            github_login=gh_user.get("login", ""),
            avatar_url=gh_user.get("avatar_url"),
            role="athlete",
            product="volta",
        )

    # 5. Generate JWT
    access_token = create_access_token(
        data={
            "sub": user_data["id"],
            "email": user_data["email"],
            "role": user_data["role"],
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "role": user_data["role"],
            "product": user_data.get("product", "volta"),
        },
    }


@auth_router.post("/register")
async def register(payload: RegisterPayload):
    """Crea una nueva cuenta de atleta o coach. Devuelve token + user igual que /login."""
    email = payload.email.lower().strip()
    if email in MOCK_USERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email",
        )

    user_id = f"{payload.role}_{uuid.uuid4().hex[:12]}"
    MOCK_USERS[email] = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "hashed_password": get_password_hash(payload.password),
        "role": payload.role,
        "product": payload.product,
        "coach_id": None,
        "is_active": True,
    }

    access_token = create_access_token(
        data={"sub": user_id, "email": email, "role": payload.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "name": payload.name.strip(),
            "role": payload.role,
            "product": payload.product,
        },
    }
