"""
Módulo de autenticación y autorización para Holy Oly API.

Exports:
    - verify_token: Dependencia para validar JWT en endpoints protegidos
    - authorize_role: Factory para autorización por roles
    - authorize_coach_or_admin: Dependencia para endpoints de coach/admin
    - authorize_athlete_or_coach: Dependencia para endpoints de atletas/coaches
    - auth_router: Router con endpoints de login/refresh/me
    - User: Modelo de usuario
    - TokenData: Modelo de datos del token
    - jwt_utils: Utilidades JWT (create_access_token, decode_token, etc.)
"""

from .auth import (
    verify_token,
    authorize_role,
    authorize_coach_or_admin,
    authorize_athlete_or_coach,
    can_access_athlete_data,
    auth_router,
    get_current_user,
)
from .jwt_utils import (
    User,
    TokenData,
    create_access_token,
    decode_token,
    authenticate_user,
    get_user,
    verify_password,
    get_password_hash,
)

__all__ = [
    "verify_token",
    "authorize_role",
    "authorize_coach_or_admin",
    "authorize_athlete_or_coach",
    "can_access_athlete_data",
    "auth_router",
    "get_current_user",
    "User",
    "TokenData",
    "create_access_token",
    "decode_token",
    "authenticate_user",
    "get_user",
    "verify_password",
    "get_password_hash",
]
