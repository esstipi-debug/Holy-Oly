# OPS · Resucitar Render Backend

Backend `holy-oly-3.onrender.com` devuelve 404. El código está sano (testeado local
con todos los endpoints nuevos). Sigue estos pasos en orden — debería tomar 15-20 min.

---

## Pre-check (1 min)

```bash
# Local — ya verificado que arranca limpio:
cd backend
pip install -r requirements.txt   # primera vez
uvicorn src.main:app --port 8765
# → GET /health debe responder {"status":"ok",...}
```

Si esto funciona local pero Render no, la causa es uno de los 4 problemas de abajo.

---

## Diagnóstico en Render Dashboard

### 1. Abrí el servicio `holy-oly-3`

**URL:** https://dashboard.render.com/web/srv-XXXXXXXXXX/logs

Mirá la columna izquierda. Casos:

| Síntoma | Causa probable | Fix |
|---|---|---|
| Status "Suspended" | Free tier auto-sleep tras 90 días inactividad | Click **"Resume"** |
| Status "Failed" + último deploy rojo | Build o startup error | Ver logs del deploy fallido |
| Status "Live" pero 404 | El servicio se sirve en otro dominio | Confirmá la URL en "Settings" |
| Status "Deploying" hace horas | Build hang | Click **"Cancel"** + Manual Deploy |

### 2. Si el último deploy está rojo

Click en **"Events"** → último evento `Deploy failed` → **"View Logs"**.

Buscá una de estas líneas (en orden de probabilidad):

```
# A) Migración rota
psycopg2.errors.DuplicateObject: type "user_role" already exists
→ FIX: ya está cubierto por el nuevo 000_init.sql (usa IF NOT EXISTS + DO $$)

# B) Database no conectada
asyncpg.exceptions.InvalidCatalogNameError
→ FIX: verificá en "Environment" que DATABASE_URL esté presente

# C) Out of memory durante build
Killed (exit code 137)
→ FIX: upgradeá a "Starter" plan ($7/mes) o quitá dependencias pesadas
       (google-cloud-aiplatform pesa 200MB+)

# D) Health check timeout
Health check failed: GET /health
→ FIX: subí timeout en Settings → Health Check Path → "Wait Time" a 60s
```

### 3. Apretá "Manual Deploy" → "Clear build cache & deploy"

Ese rebuild es el que ejecutará la nueva migración `000_init.sql` que crea
las tablas users / baseline_results / social_screenshots / payment_intents.

---

## Variables de entorno requeridas

Si alguna falta, agregala en **Settings → Environment**:

| Variable | Valor | Auto? |
|---|---|---|
| `DATABASE_URL` | `fromDatabase: holy-oly-postgres` | ✅ auto si render.yaml está actualizado |
| `JWT_SECRET_KEY` | `generateValue: true` | ✅ auto |
| `CORS_ORIGINS` | `https://holy-oly.onrender.com,http://localhost:5173` | ⚠ poner explícito ahora (no `*`) |
| `ENVIRONMENT` | `production` | ✅ auto |
| `LOG_LEVEL` | `INFO` | ✅ auto |
| `RESEND_API_KEY` | (opcional, para emails) | ❌ vacío por ahora |
| `GITHUB_TOKEN` | (opcional, para Motor25 agents) | ❌ vacío por ahora |

> **Nota:** RESEND_API_KEY y GITHUB_TOKEN son opcionales — el código tolera que estén vacíos
> porque los agentes Motor25 no son críticos para auth + baseline + social.

---

## Verificación post-deploy

Cuando esté `Live`, corré desde tu máquina:

```bash
# 1. Health
curl https://holy-oly-3.onrender.com/health
# Esperado: {"status":"ok","message":"Holy Oly engines + Motor 25 agents running"}

# 2. Register real
curl -X POST https://holy-oly-3.onrender.com/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"vos@gmail.com","password":"holdy123","name":"Esteban","role":"athlete","product":"volta"}'
# Esperado: {"access_token":"eyJ...","user":{"id":"<uuid>","tier":"trial","trial_ends_at":"..."}}

# 3. Save baseline (con token del paso 2)
TOKEN="eyJ..."
curl -X POST https://holy-oly-3.onrender.com/v1/baseline/results \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"test_id":"snatch_1rm","value":80,"unit":"kg"}'

# 4. Get baseline
curl https://holy-oly-3.onrender.com/v1/baseline/results \
  -H "Authorization: Bearer $TOKEN"
# Esperado: {"snatch_1rm":{"value":80,"unit":"kg","date":"2026-..."}}
```

Si los 4 pasos pasan, el backend está OPERATIVO.

---

## Próximo paso (post-Render-up)

1. Cablear frontend al backend real:
   - `frontend/src/lib/api.ts` → cambiar baseURL a `https://holy-oly-3.onrender.com`
   - `Login.tsx` + `Register.tsx` → POST al backend (ya existen los endpoints)
   - `BaselineAssessment.tsx` → reemplazar `localStorage` por `useBaseline()` hook
     que sincronice con `/v1/baseline/results`
2. Pasar a Frente B: pantalla `Plan PRO` con generación de código + instrucciones de transferencia.

---

## Cambios incluidos en este PR

- `backend/migrations/000_init.sql` — bootstrap idempotente (users, baseline_results, social_screenshots, payment_intents)
- `backend/src/db/users_repo.py` — agregado `create_user`, `save_baseline_result`, `get_baseline_results`, `delete_baseline_result`, `log_screenshot`
- `backend/src/api/auth/auth.py` — `/register` ahora persiste vía `users_repo` (Postgres + fallback mock)
- `backend/src/api/baseline.py` — nuevo router `/v1/baseline/results` (GET/POST/DELETE)
- `backend/src/api/social.py` — nuevo router `/v1/social/screenshots` (POST con auth opcional)
- `backend/src/main.py` — registra los 2 nuevos routers
- `render.yaml` — `preDeployCommand` ahora corre `000_init.sql` + `005_github_oauth.sql` con manejo de error por-migración
