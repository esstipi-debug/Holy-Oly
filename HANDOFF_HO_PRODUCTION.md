# HANDOFF · Holy Oly → PRODUCCIÓN

> Documento único para arrancar la **producción final de HO**: pasar el demo a app funcional (persistir todo en backend/DB) + corregir errores. Leer entero antes de tocar nada.
> Última actualización: **2026-05-29**. Branch `feat/api-first-refactor`. Volta ya está separado en su propio repo.

---

## 🎯 MISIÓN
HO en producción: **demo → app funcional real**. Auth real (email + Google), datos que persisten en Postgres (no sessionStorage/mocks), y cerrar los huecos de "demo offline". Corregir errores listados abajo.

---

## ⚠️ DÓNDE TRABAJAR
- **Worktree:** `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8` · **branch `feat/api-first-refactor`**. Verificá `git rev-parse --abbrev-ref HEAD` ANTES de tocar (el harness puede abrir otro worktree → operá en compassionate-rhodes con rutas absolutas).
- **Repo:** github.com/esstipi-debug/Holy-Oly.
- **Deploy frontend:** push a `feat/api-first-refactor` → Render auto-deploya el static site **`peakqual-v2`** (`peakqual-v2.onrender.com`).
- **Deploy backend:** servicio **`holy-oly-3`** (docker). ⚠️ **El `render.yaml` NO fija branch para holy-oly-3** → confirmá en el dashboard de Render qué branch deploya (probable `main`). Importa: el endpoint de Google está en `feat/api-first-refactor` → si holy-oly-3 deploya `main`, hay que mergear/cherry-pick.

## 🧱 STACK
- **Frontend:** `frontend/` · React 19 + Vite + TS + framer-motion. Build: `cd frontend && npm run build` (tsc -b + vite). Deploy peakqual-v2.
- **Backend:** `backend/` · FastAPI (docker) · `holy-oly-3.onrender.com`. Postgres **`holy-oly-postgres`** (Render, wired via `render.yaml` `fromDatabase`).
- **Auth:** JWT. `backend/src/api/auth/auth.py` (login/register/google/verify_token), `frontend/src/context/AuthContext.tsx` + `frontend/src/lib/api.ts`.

---

## ✅ ESTADO ACTUAL (verificado este ciclo)
| Pieza | Estado |
|---|---|
| **DB Postgres** | ✅ Conectada + persiste. Verificado: register → `POST /v1/baseline/results` → `GET` round-trip OK. |
| **Login + registro (email)** | ✅ Real. `POST /v1/auth/login` (form), `/register` (JSON). UUID real, persiste. |
| **Registro/login con Google** | 🟡 **Código hecho + deployado** (`70bb44a` back + `82a0ee7` front). El botón renderiza y llama a Google. **Bloqueado** por el allowlist de orígenes del OAuth client (ver Errores). |
| **Pantalla full-screen** | ✅ `PhoneLayout` siempre full-screen, adaptable (móvil full-bleed; desktop columna centrada maxWidth 540; sin mockup). |
| **PWA instalable** | ✅ manifest + íconos (192/512) + `sw.js` (network-first) + `InstallPrompt` (iOS/Android). Criterios verificados en vivo. |
| **Volta separado** | ✅ Repo propio `github.com/esstipi-debug/volta` (branch main). HO quedó Volta-free (`41ab490`). Preservado en branch `volta-legacy-snapshot` + dir `C:\Users\Gamer\Desktop\volta-app`. |

**Google OAuth:** Client ID público `576946246697-7c4u4g1uu802qh7pjm8iiij0srh82t6o.apps.googleusercontent.com` (hardcodeado en `GoogleSignInButton.tsx` + default en `auth.py`). El **secret NO se usa** (flujo GSI id_token). Override por env `GOOGLE_CLIENT_ID` (back) / `VITE_GOOGLE_CLIENT_ID` (front).

---

## 🔄 DEMO → APP FUNCIONAL (lo que falta convertir)
Hoy estas cosas son **mock / sessionStorage**; para producción deben persistir en backend/DB:

1. **Loop real de asignación de macro** (el corazón). Spec ya escrito: `docs/superpowers/specs/2026-05-29-real-macro-assign-loop-design.md`.
   - Backend YA existe: `POST /v1/macrocycles/assign` (body `{athlete_id, template_id (UUID), overrides}`), `GET /v1/macrocycles/me/active`.
   - Falta en el front: el call manda mal el payload (`program_id`/`start_week` sueltos) → cambiar a `template_id` (UUID, mapear desde `GET /v1/macrocycles/templates` por `program_id`) + `overrides:{start_week,start_date,reason}` (el week-picker). Wiring vía hook fino que ramifica demo-mock vs JWT-real.
   - Falta: seed de un coach↔atleta demo en DB + endpoint read-only "mis atletas" del coach.
2. **sessionStorage → backend** (faltan endpoints + wiring):
   - `ho:competitions` (CompetitionContext), `ho:weighins` (BodyweightContext), `ho:addedAthletes` + `ho:macroOverrides` (AthleteContext).
3. **Roster real del coach:** `GET` "mis atletas" (no existe) + crear/linkear atletas (coach-code en onboarding).
4. **Onboarding → backend:** `OnboardingV3` hoy guarda en localStorage `ob:payload`; no hay `/v1/users/onboarding`. Persistir el perfil.
5. **Modo demo offline (`token='demo'`):** mocks + sessionStorage, sin red. Decidir para prod: mantener (para vender) vs quitar.

---

## 🐞 ERRORES / PENDIENTES A CORREGIR
- **Google origin allowlist (Boss):** Google devuelve "The given origin is not allowed for the given client ID". Habilitar en el OAuth client `576946246697-…` los **Orígenes de JavaScript autorizados** (`https://peakqual-v2.onrender.com` + `http://localhost:5173`, sin `/`) y esperar propagación (5min–horas). Re-verificar en vivo después.
- **Branch de deploy de holy-oly-3:** el endpoint Google está en `feat/api-first-refactor`. Si holy-oly-3 deploya `main`, mergear/cherry-pick (`70bb44a`).
- **Usuarios demo mock:** `coach@example.com`/`user@example.com` son MOCK_USERS (ids `coach_uuid_123` etc., NO en DB). Para prod: seedear usuarios reales (`backend/scripts/seed_demo.py` existe pero hardcodea `product='volta'` → agregar HO) o quitar el fallback mock.
- **PUBLIC_VIEWS con rutas preview/WIP** (comentadas "revertir antes de prod" en `App.tsx`): `HO_MACRO_CATALOG/DETAIL/ATHLETE`, `CONTROL_DANIOS_V2`, `LOGIN_V3/REGISTER_V3/ONBOARDING_V3`, `DEMO_HUB`. Cerrar (requerir auth) para producción.
- **Huérfanos de Volta en HO:** quedaron data/css/componentes Volta sin usar (ej. `AthleteTrainingView` importa `SkillFocusAssign`/`SkillEvaluationPanel`/`CustomWodAssigner` gateados a volta; `styles/v2/volta-*.css`; `data/wods.ts`). Limpiar.
- **Bundle ~748KB** (warning de chunk >500KB): code-splitting / dynamic import para perf (opcional).
- **Onboarding mock** (ver arriba).

---

## 🗺️ ORDEN SUGERIDO (roadmap)
1. **Cerrar Google** (Boss habilita orígenes → re-verificar). Casi listo.
2. **Loop real de macro** (spec existe) — coach asigna → DB → atleta lo ve. Núcleo del demo→real.
3. **Roster real del coach** (list + crear/linkear).
4. **Onboarding → backend** (perfil persiste).
5. **Competencias + pesajes → backend.**
6. **Lockdown prod:** PUBLIC_VIEWS, usuarios mock, decisión de modo demo.
7. **Cleanup:** huérfanos Volta, code-splitting.

---

## ⚠️ GOTCHAS (no tropezar de nuevo)
1. **Build SIEMPRE** `cd frontend && npm run build` (tsc -b atrapa unused/noUnusedLocals). No alcanza `tsc --noEmit`.
2. **Worktree:** `cd` + `git rev-parse` + rutas absolutas (el harness puede abrir otro worktree; la shell resetea cwd entre comandos).
3. **Macros: NO inventar.** Fuente `macrocycles/RAW_SOURCES/` → `data/macrocycles.ts` + `data/macroSources.ts`.
4. **Navegación = stack propio** (`context/NavigationContext`, NO React Router). `PUBLIC_VIEWS` no reciben nav/back del layout → pantalla pública sin botón propio = dead-end.
5. **Demo 401 benigno:** `lib/api.ts` convierte 401 con `token==='demo'` en mensaje benigno.
6. **Commit por ola + push** (Render auto-deploya peakqual-v2). Backend (holy-oly-3) ojo con el branch.
7. **`google-auth`** ya está en `backend/requirements.txt`. `python -m py_compile` para chequear backend sin levantarlo.
8. **Client ID de Google es público** (va en el front). El **secret nunca** en el front (`VITE_*` se expone).
9. **Hipos transitorios del clasificador** ("temporarily unavailable" en Write/Edit/Bash) → reintentar; alternativa: escribir archivos por `Bash` heredoc.
10. **CRLF/LF warnings** al commitear en Windows: inofensivos.

---

## 🧭 ARCHIVOS CLAVE
- **Auth:** `backend/src/api/auth/auth.py` (login/register/**google**/verify_token) · `backend/src/db/users_repo.py` (find_by_email/create_user/baseline) · `backend/src/config.py` · `frontend/src/lib/api.ts` (loginRequest/registerRequest/**googleAuthRequest**) · `frontend/src/context/AuthContext.tsx` (login/register/**loginWithGoogle**) · `frontend/src/components/GoogleSignInButton.tsx` · `pages/v2/LoginV3.tsx` · `RegisterV3.tsx` · `OnboardingV3.tsx`.
- **Layout:** `frontend/src/layouts/PhoneLayout.tsx` (full-screen, maxWidth 540).
- **PWA:** `frontend/index.html` (registra SW) · `frontend/public/sw.js` (network-first + push) · `frontend/public/manifest.webmanifest` · `frontend/src/components/InstallPrompt.tsx`.
- **Routing:** `frontend/src/App.tsx` (HO-only · renderView · PUBLIC_VIEWS · NAV_MAP_HO · RoleSwitcher).
- **Macros:** `data/macrocycles.ts` · `data/macroSources.ts` · `data/macroDetail.ts` · `backend/src/api/macrocycles/macrocycles.py` + `services/macrocycle_db_service.py`.
- **Persistencia hoy en sessionStorage:** `context/CompetitionContext.tsx` (ho:competitions) · `context/BodyweightContext.tsx` (ho:weighins) · `context/AthleteContext` (ho:macroOverrides, ho:addedAthletes).
- **Infra:** `render.yaml` (blueprint: holy-oly-3 + peakqual-v2 + DB holy-oly-postgres) · `backend/render.yaml` · `OPS_RENDER.md`.

---

## 📜 COMMITS DE REFERENCIA (este ciclo · desde `cd39081`)
`887441a` spec loop macro real · `3e26134` full-screen v1 (480) · `8e73d40` full-screen robusto (pointer:coarse/≤820) · `08163e8` PWA instalable · `41ab490` sacar Volta de HO · `38cde3e` PhoneLayout siempre full-screen adaptable · `70bb44a` backend Google endpoint · `82a0ee7` botón Google front. (Volta → repo `esstipi-debug/volta` main; snapshot en branch `volta-legacy-snapshot`.)

---

## 📌 ACCIONES PENDIENTES DEL BOSS
- **Google:** habilitar JS origins en el OAuth client `576946246697-…` + esperar propagación → avisar para re-verificar en vivo.
- **Backend deploy branch:** confirmar qué branch deploya holy-oly-3 (para que el endpoint de Google quede live).
- **Volta:** deploy de su repo en Render cuando quiera (ya es deploy-ready: vite + `_redirects`).
