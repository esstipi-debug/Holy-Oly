# Spec · Slice 1 — Loop real de asignación de macro (demo→real)

> Track A (evolución demo→producto real). Branch `feat/api-first-refactor`.
> Fecha: 2026-05-29. Estado: **aprobado por el Boss · listo para plan**.
> Decidido con el Boss: él prende el Postgres en Render; yo construyo el loop real + seed y lo verifico contra una DB local; al prender la suya, el demo live queda real.

---

## 1. Contexto / realidad verificada

Hallazgos al inicio de la sesión (corrigen el HANDOFF):

- **Auth ya está en código.** `login`/`register` están cableados front→back (`AuthContext` + `lib/api.ts`); el backend live (`holy-oly-3.onrender.com`) autentica. Token en `localStorage` (`'token'`), `Authorization: Bearer` en cada request.
- **El backend live corre en MOCK_USERS, sin Postgres.** Los ids vuelven `coach_uuid_123` / `authenticated_user_uuid` y `GET /v1/macrocycles/me/active` da `{assigned:false}`. `users_repo` loguea "DATABASE_URL not configured — using MOCK_USERS". **Nada persiste.** `render.yaml` ya está listo para inyectar `DATABASE_URL` desde una DB administrada `holy-oly-postgres`, pero no está activa.
- **Contrato `/assign` desalineado.** El front manda `{athlete_id, program_id, start_week, start_date, reason}` (AssignMacrocycle.tsx:384–391); el backend espera `{athlete_id, template_id, overrides?}` (macrocycles.py:70–73). Con un JWT real, el call actual da **422**.
- **`template_id` es un UUID real**, no `system-<program_id>`. `svc.assign_template` hace `UUID(template_id)` y busca `macrocycle_templates WHERE id = $1` (macrocycle_db_service.py:217–218). Los ids `system-…` que devolvió el probe eran el **fallback** (sin DB). El front debe mapear `program_id → id (UUID)` desde la respuesta de `GET /templates`.
- **`overrides` (JSONB) round-trips.** `assign_template` persiste `overrides` (`:241`) y lo devuelve (`:256`); `get_active_assignment` lo devuelve parseado (`:182`). → el week-picker se persiste dentro de `overrides` **sin migración**.
- **`/generate` NO existe** (el HANDOFF decía que sí). El plan semanal se deriva client-side (`getWeekPlan`) — fuera de alcance.
- **No hay endpoint para listar el roster de un coach** (crear/linkear atletas tampoco). El loop real necesita al menos un **listado read-only** para que el coach elija a quién asignar.

## 2. Objetivo del slice (loop demostrable)

Un coach real y un atleta real, contra una DB real, cierran este loop:

1. Coach hace login (cuenta sembrada en DB) → ve su roster real.
2. Coach asigna un macrociclo a un atleta, eligiendo **semana de arranque** (week-picker) → **persiste** en `athlete_macro_assignments` (incluido `start_week`/`reason` en `overrides`).
3. El atleta hace login → ve su macro activo vía `GET /me/active`, renderizado en la semana correcta.

**Criterio de aceptación:** verificable end-to-end contra Postgres local (sección 7) y `npm run build` verde. El demo offline (`token='demo'`) sigue funcionando sin red, sin cambios de comportamiento.

## 3. No-objetivos (slices futuros, cada uno su spec)

- Roster CRUD completo (crear/editar/linkear atletas; onboarding→DB). Slice 1 solo agrega **listado read-only**.
- Persistir competencias / pesajes (faltan tablas+endpoints).
- `POST /v1/macrocycles/generate` (no existe).
- Migrar `OnboardingV3` de mock a DB.
- Refactor a patrón repositorio/adapter (se evalúa cuando se acumulen dominios en slices 2-3).

## 4. Arquitectura — capa de datos en el front (hooks finos)

Módulo nuevo `frontend/src/data/macroService.ts`. Ramifica por modo en **un solo lugar** (lee `demoMode`/`token` del `AuthContext`). La UI no se entera del modo.

- `assignMacro({ athleteId, programId, startWeek, reason }): Promise<AssignResult>`
  - **demo** (`token==='demo'`): comportamiento actual — `updateMacro(athleteId, buildMacroAssignment(...))` (optimista) + `sessionStorage` (`ho:macroOverrides`). Sin red.
  - **real** (JWT): `api.post('/v1/macrocycles/assign', { athlete_id: athleteId, template_id, overrides: { start_week: startWeek, start_date: <hoy ISO>, reason } })`
    con `template_id` = UUID resuelto vía `templateIdFor(programId)` (mapa construido del `GET /templates`). Al éxito, invalida/actualiza el cache de `useActiveMacro`/`useCoachRoster`. Optimismo opcional sobre ese cache (NO sobre el contexto mock, que es del path demo).
- `useActiveMacro(athleteId?): { macro, loading, source }`
  - **demo**: lee de `AthleteContext`/mock (como hoy).
  - **real**: atleta propio → `GET /v1/macrocycles/me/active`; coach mirando a un atleta → `GET /v1/macrocycles/athlete/{id}/active`. Mapea `AssignmentResponse` → shape del front: `program_id` + `overrides.start_week` alimentan `getMacroDetail`/`getWeekPlan` client-side (igual que hoy).
- `useCoachRoster(): { athletes, loading, source }`
  - **demo**: roster mock scopeado por producto (como hoy).
  - **real**: `GET` del nuevo endpoint de roster del coach (sección 5). Devuelve atletas con sus UUIDs reales (los que usa `assignMacro`).
- `templatesIndex()`: cachea `GET /templates` y expone `templateIdFor(programId)` y `programIdFor(templateUuid)`. Único punto que conoce el mapeo UUID↔program_id.

**Call-sites a corregir** (hoy mandan el payload roto):
- `pages/AssignMacrocycle.tsx` `handleAssign` (:369–404) → usar `assignMacro`.
- `pages/v2/HolyOlyDetailV2.tsx` `onWeekPickerConfirm` (mismo patrón, athlete = user logueado) → usar `assignMacro`.
- Picker de atleta del coach (AssignMacrocycle / CoachDash) → consumir `useCoachRoster` (real cuando hay JWT, mock en demo).

## 5. Backend (mínimo · sin migración)

- **Sin migración nueva / sin cambios de schema.** `overrides` ya persiste y vuelve (confirmado). (El setup local de la §7 corre las migraciones EXISTENTES, no agrega ninguna.)
- **Endpoint read-only de roster del coach.** Verificar primero si ya existe alguno equivalente (grep `coach`/`athletes`); si no:
  - `GET /v1/macrocycles/coach/athletes` (o ubicación equivalente), `Depends(verify_token)`, rol coach/admin.
  - Query: `SELECT id, name, email, product FROM users WHERE coach_id = $1 AND is_active = TRUE`.
  - Defensivo: si no hay pool, `[]` (no 500), coherente con los endpoints hermanos.
- **Validación de datos:** confirmar que todas las filas de `macrocycle_templates` (migración 017) tengan un `program_id` que matchee los ids asignables de `frontend/src/data/macrocycles.ts` (para que `templateIdFor` resuelva y `assign_template` encuentre el template). Documentar cualquier program_id sin template (no inventar; reportar).

## 6. Seed (`backend/scripts/seed_demo.py`)

Hoy crea 1 coach + 6 atletas pero `upsert_user` hardcodea `product='volta'` (:177); el roster del front está scopeado por producto (gotcha #5 del handoff) → un coach HO no vería atletas Volta.

- **Agregar usuarios HO** (`product='holy-oly'`): 1 coach HO + 2 atletas HO con baselines (snatch/clean/back_squat/front_squat/deadlift — la estructura ya existe) y `coach_id` ligado al coach HO. Parametrizar `product` en `upsert_user`/`seed_one_athlete` (no romper los Volta existentes).
- **Pre-sembrar 1 asignación HO:** el coach HO asigna un macro real (p.ej. `bulgaro-6d`, semana 1) a un atleta HO, insertando en `athlete_macro_assignments` con `overrides={start_week:1, ...}`. Así `/me/active` del atleta devuelve algo real apenas loguea (no depende de asignar en vivo).
- **Idempotente** (patrón actual: `ON CONFLICT`/check-existencia). `DEMO_SEED_RESET=1` resetea.
- **Credenciales** (documentar para el Boss): coach HO `coach.ho.demo@holyoly.app / DemoCoach2026!`; atletas HO `<nombre>.ho.demo@holyoly.app / DemoAth2026!`.

## 7. Verificación (yo, antes del flip del Boss)

1. Confirmar Postgres local disponible (Docker preferido). Si no hay, avisar al Boss y acordar alternativa (no asumir).
2. `DATABASE_URL` local → `python backend/src/execute_migration.py` (corre las migraciones EXISTENTES, incluidas 017/018; el slice no agrega ninguna).
3. `python -m backend.scripts.seed_demo` → coach+atletas HO + asignación pre-sembrada.
4. `uvicorn src.main:app --port 8765` (backend local) + `npm run dev` con `VITE_API_URL=http://localhost:8765`.
5. **Loop manual:** login coach HO → ver roster real → asignar macro a atleta HO con week-picker (semana ≠ 1) → confirmar fila en `athlete_macro_assignments` con `overrides.start_week` correcto → login atleta HO → `/me/active` real + UI en la semana asignada.
6. **Demo offline:** entrar `?demo=1`, sin red, confirmar que el quadrant + asignación mock siguen andando (sin regresión).
7. `cd frontend && npm run build` verde (tsc -b atrapa unused).

## 8. Runbook del Boss (post-código · hace el demo live real)

1. Render → crear DB administrada `holy-oly-postgres` (puede requerir plan Starter $7/mes por memoria del build).
2. Confirmar `DATABASE_URL` inyectada en el servicio `holy-oly-3` (vía `render.yaml` `fromDatabase`).
3. Deploy → las migraciones corren solas (`preDeployCommand`).
4. Sembrar: `POST /v1/admin/seed-demo` con header `X-Admin-Token`.
5. Verificar: `GET /health` ok + login con `coach.ho.demo@holyoly.app` devuelve un id UUID real (no `coach_uuid_123`).

## 9. Demo offline + manejo de errores

- `token==='demo'` → siempre rama mock/sessionStorage. Cero llamadas que rompan offline.
- JWT real 401/expirado → re-login (AuthContext ya limpia en 401; el atajo benigno de `api.ts` es solo para `token==='demo'`).
- Backend caído para user real → los hooks caen a estado vacío/last-known (sin pantalla roja) y `assignMacro` mantiene el update optimista para no bloquear al coach.

## 10. Riesgos / a confirmar en implementación

- Disponibilidad de Postgres local (Docker) para verificar end-to-end. **Bloqueante de la verificación** — resolver al arrancar.
- ¿Existe ya un endpoint de roster del coach? (grep antes de agregar uno nuevo).
- ¿Todos los `program_id` asignables tienen fila en `macrocycle_templates`? Si falta alguno, reportar (no inventar template).
- Enum `users.product`: confirmar que `'holy-oly'` valida en el schema (migración 000).
- `coach_owns_athlete`: depende de `athlete.coach_id = coach.id` (el seed ya liga `coach_id`).

## 11. Archivos clave

- Front: `frontend/src/data/macroService.ts` (nuevo) · `lib/api.ts` · `context/AuthContext.tsx` · `context/AthleteContext` (`updateMacro` + `ho:macroOverrides`) · `pages/AssignMacrocycle.tsx` (:369–404) · `pages/v2/HolyOlyDetailV2.tsx` (`onWeekPickerConfirm`) · `data/macrocycles.ts` (program_ids) · `data/macroDetail.ts` (`getMacroDetail`/`getWeekPlan`).
- Back: `backend/src/api/macrocycles/macrocycles.py` (`AssignPayload` :70, `/assign` :137, `/me/active` :188, `/athlete/{id}/active` :215) · `backend/src/services/macrocycle_db_service.py` (`assign_template` :186, `get_active_assignment` :148) · `backend/src/api/auth/auth.py` (`verify_token`, `coach_owns_athlete`) · `backend/scripts/seed_demo.py` · `backend/migrations/017_*`, `018_*` · `render.yaml`.
