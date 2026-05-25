# Estado Operativo · Qué falta para que la app esté en producción

## TL;DR

**Frontend:** ✅ live en `https://holy-oly.onrender.com` con todas las features visuales
**Backend:** ❌ caído en `https://holy-oly-api.onrender.com` (404 en /health y /v1/auth/login)
**Base de datos:** ❌ no conectada · todo es state local + mock data
**Modo actual:** **DEMO MODE 100%** — la app funciona pero nada persiste fuera del navegador

---

## 1. Base de datos: NO conectada

### Lo que hay configurado
- `render.yaml` declara servicio Postgres `holy-oly-postgres`
- `DATABASE_URL` se inyecta automáticamente al backend
- `backend/src/db/users_repo.py` tiene async pool con asyncpg
- Migraciones SQL (001-005) en `backend/migrations/`

### Lo que falta
- Backend no responde (404 en todos los endpoints)
- Migraciones nunca se aplicaron a la DB real
- `users_repo.py` solo se usa en `find_by_email/id`, pero esos endpoints no se llaman porque backend está down
- Frontend en `lib/api.ts` apunta a `https://holy-oly-api.onrender.com` que devuelve 404

### Lo que ve el usuario
- Login → "Servidor no disponible · entrá en modo Demo"
- Demo mode usa `MOCK_USERS` hardcoded en el backend → pero como backend no responde, **directamente bypassa** y mete user demo en localStorage
- Todo lo que el usuario hace (sesiones, achievements, quests, skill tree progress) → solo en `localStorage` del browser

---

## 2. Backend: qué pasa

### Síntomas
```bash
curl https://holy-oly-api.onrender.com/health  # → 404
curl https://holy-oly-api.onrender.com/         # → 404
```

### Causa probable
- Render dashboard probablemente tiene el servicio backend deshabilitado, o el último deploy falló silenciosamente
- O el service nunca se creó (solo el frontend `holy-oly-web` está activo)

### Para arreglar
1. Ir a https://dashboard.render.com
2. Buscar el servicio `holy-oly-api`
3. Si no existe → crearlo desde el `render.yaml` (Blueprint deploy)
4. Si existe → ver "Events"/"Logs" para diagnosticar último deploy
5. Verificar que `DATABASE_URL` esté seteada
6. Aplicar migraciones manualmente vía Render Shell o `backend/src/execute_migration.py`

---

## 3. Persistencia de datos: 100% local

| Dato | Dónde vive hoy | Riesgo |
|------|---------------|--------|
| User session | `localStorage.token` | Se pierde al limpiar browser |
| Achievements desbloqueados | Calculados client-side desde mock state | Reset al recargar |
| Quests progress | Mock state hardcoded | Nunca avanza |
| Skill tree progress | `localStorage.skillTree:progress` | Solo en ese device/browser |
| Inventario Volta Coach | React state in-memory | Se pierde al cambiar pantalla |
| WOD coach builder | React state | No persiste, no llega al atleta |
| Macrociclo asignado | Mock en `AthleteContext` | Reset al recargar |
| Sesiones logged (ramp-up + sets) | React state local | Nada se guarda |

---

## 4. Lo que FALTA para ser operativa

### Crítico (sin esto la app es solo prototipo)

| # | Feature | Esfuerzo |
|---|---------|----------|
| 1 | Backend Render operativo + health check OK | 30min-1h (depende de qué pasó) |
| 2 | DB Postgres connectada y migraciones aplicadas | 1h |
| 3 | Auth real (register + login persistente) | ya implementado, solo falta backend up |
| 4 | Sesiones del atleta persistidas (cada set, ramp-up, RPE) | 4-6h backend |
| 5 | PRs/maxes persistidos por atleta | 2h |
| 6 | WOD planificado por coach → recibido por atleta del box | 4h backend + frontend |
| 7 | Macrociclo asignado persiste + se ve en Schedule del atleta | 3h |
| 8 | Achievements unlock real (event-driven) | 4-6h con engine |
| 9 | Quests semanales con tracking real | 3h |
| 10 | Roster del coach (athletes table + coach_athletes link) | 2h schema + endpoints |

### Importante (UX completa pero no bloqueante)

| # | Feature | Esfuerzo |
|---|---------|----------|
| 11 | Integración wearable (Apple Health / Whoop / Garmin) para HRV | 1-2 días por wearable |
| 12 | Inventario Volta Coach persistido | 2h |
| 13 | Skill tree progress sync con backend (no solo localStorage) | 2h |
| 14 | Notificaciones push (FCM/APNs) | 1 día |
| 15 | Premium real (Stripe checkout + webhooks) | 1-2 días |
| 16 | Video upload review técnica (Premium) | 1 día con S3 |
| 17 | Chat coach ↔ atleta real | 2-3 días |
| 18 | WiseAssistant conectado a backend (no pattern matching local) | 1 día con LLM API |

### Nice to have (polish operativo)

- Onboarding completo guardado + setup inicial (3h)
- Profile editable con avatar upload (4h)
- Theme persistence en backend (no solo local) (1h)
- Logout que invalida server-side el token (1h)
- Rate limiting + error handling robusto (2h)
- Analytics (Mixpanel/PostHog) (4h)
- Monitoring (Sentry) (2h)

---

## 5. Stubs marcados en SPEC_FUNCIONAL.md sección 9

Pantallas con botones que hoy no hacen nada:

- `PULSE` → "UNIRSE AL PULSE" (no abre modal de reto)
- `SCHEDULE` → "SOLICITAR REPROGRAMACIÓN" (no abre chat)
- `SOCIAL` → "COMPARTIR INSTAGRAM" + "GUARDAR EN GALERÍA" (no exportan card)
- `VoltaCoachWod` → "Borrador" + "Publicar al box" (no persisten)
- `VoltaCoachTools` → "Marcar deload" + "Exportar review"
- `MovementProgression` → ya implementado modal detalle ✓
- `Profile coach HO` → "Inventario" no tiene destino (HO no tiene inventario)
- `PREMIUM` → "Elegir Elite" no inicia checkout
- `+ Agregar` (cafeína pre-WOD) → no abre log de intake

---

## 6. Plan recomendado para llegar a operativa

### Fase 1: Backend up + DB (1-2 días)
1. Diagnosticar Render dashboard del backend
2. Aplicar migraciones 001-005 a la DB
3. Probar /health + /v1/auth/login con curl
4. Verificar register + login real desde la app

### Fase 2: Persistir lo crítico (3-5 días)
5. Sesiones (POST /v1/sessions con sets/ramp-up)
6. PRs (POST /v1/prs)
7. Macrociclo asignado por coach (POST /v1/athletes/:id/macrocycle)
8. WOD del box (POST /v1/box/wod → atletas lo ven)
9. Achievements + Quests (event store)

### Fase 3: UX completa (2-3 días)
10. Stubs cerrados (Compartir, Publicar al box, Premium checkout)
11. Skill tree sync server
12. Inventario persiste

### Fase 4: Integraciones (1-2 semanas)
13. Wearable HRV (start con Apple Health)
14. Push notifications
15. WiseAssistant con LLM real
16. Video upload Premium

---

## 7. ¿Cómo empezar mañana?

**Lo que más impacto da con menos esfuerzo:**

1. ☎️ Levantar el backend en Render (verificar dashboard + redeploy)
2. 🗄️ Aplicar migraciones manualmente
3. ✅ Probar /v1/auth/register con un user real → si funciona, el flow auth está vivo
4. 📊 Verificar que login real (no demo mode) llene la app con datos
5. Después de eso: persistir sesiones es la siguiente prioridad lógica

Sin backend up, todo lo demás es trabajo perdido.

---

## Acción inmediata

¿Querés que ahora:
- **A)** Diagnostique por qué el backend está 404 y proponga fix (necesito acceso al Render dashboard o tus logs)?
- **B)** Implemente endpoints faltantes para que cuando levantes el backend ya esté listo?
- **C)** Foque en cerrar los stubs visibles del frontend mientras backend está down?
