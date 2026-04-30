import sys
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from config import settings

# Configuración desde settings
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    role: str  # 'coach', 'athlete', 'admin'
    coach_id: Optional[str] = None
    is_active: bool = True

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash usando bcrypt."""
    pwd_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Genera el hash de una contraseña usando bcrypt."""
    pwd_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT de acceso."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenData]:
    """Decodifica y valida un token JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
            
        return TokenData(user_id=user_id, role=role, email=email)
    except JWTError:
        return None

# Mock de usuarios (reemplazar con consulta a BD en producción)
MOCK_USERS = {
    "user@example.com": {
        "id": "authenticated_user_uuid",
        "email": "user@example.com",
        "hashed_password": get_password_hash("password123"),
        "role": "athlete",
        "coach_id": "coach_uuid_123",
        "is_active": True
    },
    "coach@example.com": {
        "id": "coach_uuid_123",
        "email": "coach@example.com",
        "hashed_password": get_password_hash("coach123"),
        "role": "coach",
        "coach_id": None,
        "is_active": True
    },
    "admin@example.com": {
        "id": "admin_uuid_456",
        "email": "admin@example.com",
        "hashed_password": get_password_hash("admin123"),
        "role": "admin",
        "coach_id": None,
        "is_active": True
    }
}

def authenticate_user(email: str, password: str) -> Optional[User]:
    """Autentica un usuario por email y contraseña."""
    user_dict = MOCK_USERS.get(email)
    if not user_dict:
        return None
    if not verify_password(password, user_dict["hashed_password"]):
        return None
    
    return User(
        id=user_dict["id"],
        email=user_dict["email"],
        role=user_dict["role"],
        coach_id=user_dict.get("coach_id"),
        is_active=user_dict["is_active"]
    )

def get_user(user_id: str) -> Optional[User]:
    """Obtiene un usuario por su ID."""
    for user_dict in MOCK_USERS.values():
        if user_dict["id"] == user_id:
            return User(
                id=user_dict["id"],
                email=user_dict["email"],
                role=user_dict["role"],
                coach_id=user_dict.get("coach_id"),
                is_active=user_dict["is_active"]
            )
    return None
