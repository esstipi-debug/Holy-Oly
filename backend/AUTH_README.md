# Sistema de Autenticación y Seguridad - Holy Oly API

## 🔐 Autenticación JWT

El sistema utiliza JSON Web Tokens (JWT) para autenticación stateless.

### Endpoints de Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/v1/auth/login` | Obtener token JWT | Público |
| POST | `/v1/auth/refresh` | Refrescar token | Bearer |
| GET | `/v1/auth/me` | Info del usuario actual | Bearer |

### Login

```bash
curl -X POST "http://localhost:8000/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password123"
```

**Respuesta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "authenticated_user_uuid",
    "email": "user@example.com",
    "role": "athlete"
  }
}
```

### Uso del Token

```bash
curl "http://localhost:8000/v1/stress/calculate" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## 👥 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador del sistema | Acceso total |
| `coach` | Entrenador | Ver/modificar datos de sus atletas |
| `athlete` | Atleta | Ver/modificar solo sus propios datos |

### Protección por Roles

```python
from api.auth import authorize_role

# Solo admins
@router.delete("/users/{user_id}", dependencies=[Depends(authorize_role(["admin"]))])

# Coaches y admins
@router.post("/programs", dependencies=[Depends(authorize_role(["coach", "admin"]))])

# Todos los roles autenticados
@router.get("/profile", dependencies=[Depends(authorize_role(["athlete", "coach", "admin"]))])
```

## 🛡️ Row-Level Security (RLS)

PostgreSQL RLS está habilitado en las siguientes tablas:
- `athlete_sessions`
- `daily_metrics`
- `sleep_logs`

### Cómo funciona

1. El middleware de auth establece `current_user_id` en el contexto
2. SQLAlchemy ejecuta `SET LOCAL app.current_user_id = 'uuid'` al obtener conexión
3. Las políticas RLS filtran automáticamente los datos según el usuario

### Ejecutar migración RLS

```bash
cd backend
python src/execute_migration.py
```

## 🔒 Seguridad

### Headers de Seguridad

Todos los responses incluyen:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

### Rate Limiting

- 100 requests por minuto por IP
- Aplica a todos los endpoints excepto `/health`

### Logging de Seguridad

Se loggean automáticamente:
- Todos los requests (IP, método, path, user-agent)
- Requests sospechosos (intentos de acceso a paths sensibles)
- Rate limits excedidos
- Errores del servidor

## 🧪 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| user@example.com | password123 | athlete |
| coach@example.com | coach123 | coach |
| admin@example.com | admin123 | admin |

## ⚙️ Configuración

Variables de entorno:

```env
# JWT
JWT_SECRET_KEY=your-secret-key-min-32-characters
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
DATABASE_URL=postgresql://user:pass@localhost/holyoly

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60
```

## 📝 TODO

- [ ] Implementar refresh tokens con rotación
- [ ] Agregar OAuth2 (Google, Apple)
- [ ] Implementar 2FA
- [ ] Agregar blacklist de tokens revocados
- [ ] Implementar audit logging en base de datos
