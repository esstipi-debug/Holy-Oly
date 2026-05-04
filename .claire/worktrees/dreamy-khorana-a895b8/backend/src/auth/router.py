from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from .models import get_session
from .service import authenticate_user, create_access_token, create_user, decode_token

router = APIRouter(prefix="/v1/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "athlete"


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_session),
):
    user = authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        name=user.name,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: Session = Depends(get_session),
):
    token_data = create_access_token.__module__  # just import guard
    try:
        user = create_user(db, email=body.email, password=body.password, name=body.name, role=body.role)
    except Exception:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        name=user.name,
    )


@router.get("/me")
async def me(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_session),
):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    return {"user_id": payload["sub"], "role": payload["role"], "email": payload["email"]}
