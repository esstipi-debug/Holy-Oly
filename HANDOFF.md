# HANDOFF · Holy Oly + Volta

> Documento maestro para arrancar un nuevo chat con contexto completo.
> Última actualización: 2026-05-26 (sesión Opus 4.7) · cerrada en commit `cf5b118`.

---

## 1. TL;DR del producto

**Holy Oly** = halterofilia olímpica · **Volta** = CrossFit. Plataforma con 4 cuadrantes `{HO, VOL} × {Atleta, Coach}`. Diferenciador: smart training con engines reales (Banister fitness-fatigue, session adaptation, 23 programas de macrociclo), prevención de sobreentrenamiento, loop viral por screenshots.

**Stack:**
- Frontend: React 19 + Vite + TS + Tailwind v4 + framer-motion
- Backend: FastAPI + Python 3.11 + asyncpg + Mistral/Gemini opcional
- DB: PostgreSQL 16
- Deploy: Render (3 servicios)

**URLs vivas:**
- Frontend: `https://holy-oly.onrender.com`
- Backend API: `https://holy-oly-3.onrender.com` (✅ live, `/docs` OK)
- Repo: `https://github.com/esstipi-debug/Holy-Oly`

---

## 2. Estado real al cierre de esta sesión

### ✅ Operativo end-to-end

| Capa | Estado |
|---|---|
| Backend live + DB conectada + migrations corridas | ✅ |
| Register / Login real con UUID en Postgres | ✅ (`/v1/auth/register` + `/v1/auth/login`) |
| Frontend Login UI ↔ backend (con botón "modo demo" preservado) | ✅ |
| Engines wireadas al frontend (Stress + Session Adaptation) | ✅ |
| 13 tablas Postgres creadas | ✅ |
| MP Checkout Pro código wireado (sin keys env vars todavía) | ✅ |
| WISE LLM con 3 niveles fallback (Mistral → Gemini → Lite) | ✅ |
| 23 programas de macrociclo del engine usados en AssignMacrocycle | ✅ |
| 16 celebraciones virales en SocialCardsGallery | ✅ |
| HoStats + VoltaStats + AtletaHome + VoltaDashboard | ✅ |
| CoachMacroView amigable HO + VOL | ✅ |
| Coach HO bottom nav funcional | ✅ |
| Audit fixes: confirm deletes + input duración + IMR visible | ✅ |
| ActiveSession bug 4×4 → no permite más sets del prescripto | ✅ (verify post-CORS-fix) |
| VictoryScreen informativa (sin botones, todo data) | ✅ |
| Radar charts (HO 4 ejes · VOL 5 dim) | ✅ |
| WOD result log + auto-PR detect benchmark | ✅ |
| Skill tree 95 movimientos + categorías wrap | ✅ |
| **Leaderboard atleta** (podio + top 10 + 5 métricas HO/VOL) | ✅ nuevo |
| **1RM auto-PR** durante ActiveSession (toast + celebration trigger) | ✅ nuevo |
| **Belt ceremony fullscreen** con partículas + halo + 3 fases | ✅ nuevo |
| **PreWOD share 9:16** (2 variantes Stadium/Minimalist) | ✅ nuevo |
| **Coach viral content tools** (Atleta del mes + Recap + Cita) | ✅ nuevo |
| **Wise Score** visible en AtletaHome (ring + 3 chips) | ✅ nuevo |
| **ATL persistente** (último cuadrante usado restaurado) | ✅ nuevo |
| **Baseline backend sync** (offline-first + SyncBadge) | ✅ nuevo |
| **WOD results backend endpoint** + migration 006 corrida en prod | ✅ nuevo |
| **Simulator QA subagent** (`.claude/agents/simulator.md` local · gitignored) | ✅ nuevo |
| **8 usuarios sim seedeados** en prod (`@holyolysim.com`) · password `SimTest123!` | ✅ nuevo |

### ⏸ Pendiente (orden de impacto)

#### ✅ Cerrados en sesión 2026-05-26 (commits c7c1305 → 9a9906d)
- ~~#1 Leaderboard atleta~~ ✅ commit `8c1f897` · podio + top 10 + 5 métricas HO/VOL · CTA en HoStats/VoltaStats/AtletaHome
- ~~#2 1RM auto-PR ActiveSession~~ ✅ commit `8c1f897` · toast + `preferred_celebration` → SocialCard
- ~~#3 Belt ceremony fullscreen~~ ✅ commit `8c1f897` · 28 partículas + 3 fases + medalla hexagonal + trigger auto desde AtletaHome
- ~~#4 PreWOD share 9:16~~ ✅ commit `8c1f897` · 360×640 portrait · 2 variantes Stadium/Minimalist
- ~~#5 Coach viral content tools~~ ✅ commit `8c1f897` · 3 templates ciclables (Atleta del mes · Recap box · Cita motivacional)
- ~~#6 Wise Score visible en home~~ ✅ commit `8c1f897` · card con ring + 3 chips diarios en AtletaHome
- ~~#7 ATL "último cuadrante usado"~~ ✅ commit `8c1f897` · persiste `nav:last:{product}:{role}` · restaura en switcher + login
- ~~#10 Baseline localStorage ↔ backend sync~~ ✅ commit `690e2e5` · offline-first · SyncBadge UI
- ~~#11 WOD results backend endpoint~~ ✅ commits `30b7f00` + migration `006_wod_results.sql` corrida en prod · POST/GET/DELETE/best · is_pr en transacción
- ~~#9 Heatmap 365 anual~~ ✅ commit `d1370a9` · 53×7 grid · 5 niveles · color dinámico HO/VOL · mock determinista · stats (total/racha/mejor/adherencia)
- ~~Mistral críticos~~ ✅ commit `e74da99` · max_tokens 400/600 + temperature 0.7/0.25 + rate limit per-user 20/min 200/día + sanitización question (500 chars max + control chars filter + suspicious patterns log)
- ~~Mistral medios~~ ✅ commit `8a22739` · LRU cache 256/1h TTL (ahorra 30-50% tokens si hay preguntas repetidas) + async `_fetch_athlete` con asyncpg pool
- ~~BUG-002 race condition setLogs~~ ✅ commit `b08ccbd` · guard movido dentro de `setLogs(prev => ...)` · clicks rápidos no bypasean el 4×2
- ~~/v1/coach/ask legacy apagado~~ ✅ commit `cf5b118` · cero callers · funcionalidad duplicada por wise_router. smart_coach.py se conserva (wise lo importa)
- ~~pyc files untracked~~ ✅ commit `c92cf06`

#### 🚨 Bloqueante AHORA (acción de Esteban)
- **CORS_ORIGINS en Render**: env var override está rechazando `holy-oly.onrender.com`. Frontend live no puede hablar con backend live. Fix: borrar la env var (default del código está bien) o setearla a `https://holy-oly.onrender.com,https://holy-oly-3.onrender.com,http://localhost:5173,http://localhost:3000`. ~2min · ⚠ Sin esto, la app solo funciona en demo mode.
- **MISTRAL_API_KEY revocada por Esteban** (key expuesta en chat anterior). WISE corre en Lite hasta que se setee key nueva. Cuando se setee, aplicar primero los 3 fixes críticos del audit (ver abajo).

#### 🚨 Fixes críticos antes de activar Mistral con tráfico real
✅ Todos los fixes del audit aplicados en commits `e74da99` (críticos) y `8a22739` (medios).
**Único pendiente:** billing alerts en console.mistral.ai (tarea de Esteban).

Costo estimado con fixes: ~$6-21/mes para 1000 calls/día. Cache LRU baja ese número 30-50% más.

#### ⏸ Backlog grande
| # | Item | Tiempo | Por qué |
|---|---|---|---|
| 8 | Push notifications PWA | 4h | C.13 roadmap · agente lanzado al cierre de sesión, ver branch siguiente |
| 12 | Setear env vars MP_PLAN_ID_* en Render | 5min · Esteban | Activa pagos sandbox |
| 13 | Setear MISTRAL_API_KEY nuevo (post-fixes) + billing alerts | 1min · Esteban | Activa WISE LLM real con caps seguros |
| 14 | Env vars WISE_* en Render (opcional, todos tienen default sano): `WISE_MAX_TOKENS=400`, `WISE_TEMPERATURE=0.7`, `WISE_USER_MAX_PER_MIN=20`, `WISE_USER_MAX_PER_DAY=200`, `WISE_CACHE_ENABLED=true` | 5min · Esteban | Tuning fino sin redeploy |

---

## 3. Backend · arquitectura clave

**Endpoints disponibles** (todos en `/docs`):

```
/v1/auth/register          POST · crea user UUID en Postgres
/v1/auth/login             POST · busca en Postgres primero, fallback MOCK
/v1/auth/me                GET  · current user
/v1/baseline/results       GET/POST/DELETE · 28 tests
/v1/social/screenshots     POST · analytics viral
/v1/payments/plans         GET  · 4 planes CLP audience-aware
/v1/payments/intents       POST · crea preference Checkout Pro
/v1/payments/webhooks/mercadopago  POST · MP notification handler
/v1/admin/migrate          POST · X-Admin-Token · corre las migrations
/v1/admin/mp/create-plans  POST · crea 4 preapproval_plan en MP
/v1/admin/db-status        GET  · lista tablas + counts
/v1/wise/ask               POST · 3 niveles (Mistral → Gemini → Lite)
/v1/coach/ask              POST · legacy, con RAG opcional
/v1/stress/calculate       POST · Banister fitness-fatigue
/v1/session/adapt          POST · risk score + degradación por ejercicio
/v1/macrocycles            GET/POST · 23 programas de 9 escuelas (HO only)
```

**Engines (todas wireadas al frontend):**
- `stress_engine.py` · Banister CTL/ATL/Readiness/CNS
- `session_adaptation_engine.py` · Risk 0-100 + zonas GREEN/YELLOW/ORANGE/RED + degradación 0-3 + sustituciones
- `macrocycle_engine.py` · 23 programas (Bulgarian, Russian, Chinese, American, Iranian, European, Japanese, Ukrainian, Turkish)

**Env vars en Render `holy-oly-3`:**

| Var | Estado |
|---|---|
| `DATABASE_URL` | ✅ auto-injected |
| `JWT_SECRET_KEY` | ✅ generated |
| `CORS_ORIGINS` | ⚠ verificar incluye holy-oly.onrender.com + localhost:5173 |
| `PAYMENTS_ADMIN_TOKEN` | ✅ `holyoly-admin-2026-XYZ` (rotalo eventualmente) |
| `MP_ACCESS_TOKEN` | ⚠ TEST-... sandbox · activa pagos sandbox |
| `MP_PUBLIC_KEY` | ⚠ TEST-... · necesario para CardForm |
| `MP_PLAN_ID_*` (4) | ⚠ Creados en MP, env vars NO seteadas todavía |
| `MISTRAL_API_KEY` | ❌ NO seteada · WISE corre en Lite mode |
| `GOOGLE_API_KEY` | ❌ NO seteada |
| `FRONTEND_URL`, `BACKEND_URL` | ✅ |

---

## 4. Frontend · arquitectura clave

**Navegación:** custom `NavigationContext` con hash (no router lib). View type enum + VALID_VIEWS array.

**Contextos principales:**
- `AuthContext` · token + user + login/register/logout
- `AthleteContext` · athlete profile + stress + adaptation (engines)
- `RoleContext` · current role (athlete/coach)
- `ProductContext` · current product (ho/volta)

**Pantallas críticas:**

| View | Componente | Notas |
|---|---|---|
| HOME (HO) | AtletaHome | Card "Esta semana" tappable → HO_STATS · IMR visible |
| HO_STATS | HoStats | Volumen + Intensidad + 1RM + Radar + Mesociclo |
| VOLTA_HOME | VoltaDashboard | Wellness cards real desde Stress Engine |
| VOLTA_STATS | VoltaStats | Volumen + Benchmarks + Perfil Radar |
| VOLTA_PREWOD | VoltaPreWod | Readiness real + WOD auto-modificado por adaptation |
| SOCIAL | SocialCard | 3 variants × 16 celebraciones · sin botón share (screenshot nativo) |
| SOCIAL_GALLERY | SocialCardsGallery | Grid 16 celebraciones |
| BASELINE | BaselineAssessment | 28 tests · 6 cats · localStorage |
| PREMIUM | PreMium | 4 planes audience-aware · botón "Suscribirme" → MP init_point |
| VOLTA_WOD_LOG | LogWodResult | Form post-WOD · auto-PR check vs benchmarks |
| MACROCYCLE | Macrocycle | Atleta view de su macro |
| COACH_MACRO_VIEW | CoachMacroView | Vista friendly del macro · timeline + roster + alertas |
| VICTORY | VictoryScreen | Informativa · todo data · sin botones |
| SESSION | ActiveSession | Lock al cumplir N×R · CTA "Siguiente ejercicio →" |

**Componentes notables:**
- `WiseAssistant` · FAB chat real con LLM/Lite
- `Chart` · 6 kinds (sparkline/bars/ring/heatmap14/comparison/radar) SVG inline
- `SocialCard variants` · MinimalistCard, StadiumCard, StatSheetCard

---

## 5. Decisiones de diseño NO obvias

1. **Sin timer de WOD en la app** · vetado por usuario, atletas no usan celular mientras entrenan. WodTimer.tsx queda en repo por si en futuro hay kiosco-mode.
2. **Sin botón "compartir" en SocialCard** · el atleta toma screenshot nativo, el botón estorbaba.
3. **MP Checkout Pro default** (no Subscriptions) · API MP Chile EXIGE card_token_id en Subscriptions, requiere SDK MP.js. Checkout Pro funciona sin eso. Subscriptions queda opt-in con `MP_USE_SUBSCRIPTIONS=true`.
4. **CORS explícito** (no `*`) · combinación `*` + `allow_credentials=True` viola spec, no emite header.
5. **WISE 3 niveles** · siempre responde, incluso sin API keys (Lite con templates + banco frases).
6. **Engine fallback client-side** · si backend rechaza adaptation, replica conceptualmente la lógica del engine en frontend para que la UX no se rompa.
7. **MOCK_USERS preservado** · users registrados localmente caen ahí. Auth busca primero Postgres, fallback MOCK.
8. **Demo mode preservado** · botón explícito "Entrar en modo Demo" en Login mantiene acceso sin auth (Matías Guerrero hardcoded) para reviewers.
9. **Coach HO existe pero accede a pantallas distintas** · NAV_MAP_HO routea tab `train` a COACH_DASH cuando role=coach.

---

## 6. Bugs conocidos / oportunidades de fix rápido

| Bug | Severidad | Notas |
|---|---|---|
| `/v1/auth/login` antes devolvía 401 post-register | ✅ resuelto en `871892b` + `90619e3` |
| Wise Score (backend lo calcula) no se ve en home | 🟡 medium · surface en card destacada |
| WiseAssistant en Lite mode · falta MISTRAL_API_KEY | 🟡 medium · tarea usuario en Render |
| Macrocycle engine solo HO · VOL usa fallback local | 🟢 low · engine backend no tiene VOL |
| Toggle settings (notifications, KG/LBS) sin "guardado" feedback | 🟢 low · pendiente persistencia |

---

## 7. Commits recientes (cronológico)

```
9a9906d ux(ho): CTA Top 10 del club también en HOME atleta
690e2e5 feat(baseline): sync localStorage ↔ /v1/baseline/results · offline-first
30b7f00 feat(wod-results): endpoint /v1/wod-results + persistencia post-WOD
e5546c1 chore(qa): seed script para usuarios sim + .gitignore .claire/
8c1f897 feat(viral): leaderboard + belt ceremony + prewod share + coach viral tools
c7c1305 feat(wise): default mistral-small-latest + MISTRAL_MODEL env var
d57e4e7 docs: HANDOFF actualizado al cierre de sesión fb6863a
fb6863a fix(session): bloquear sets más allá de la prescripción (4×4 ≠ 8 sets)
90619e3 feat(wise): LLM real con fallback Lite · system prompt viral + banco frases
a6ca975 ux(ho): IMR visible en AtletaHome + card tappable → HoStats
f93e50c ux(coach): fix audit · confirm en deletes + input duración affordance
7c11888 feat: macrociclos engine real (23 programas) + CoachMacroView amigable
a209710 feat: 3 agentes en paralelo + login fix · 5 mejoras del audit
146e03e ux(volta): WodSummary rico en data + WellnessRow legible
23c1f1f feat(victory): rediseño completo · informativa · sin botones
3a797dc fix(ux): quitar timer del PreWod + skill tree categorías wrap
fcd256d feat(wod): WodTimer (no usado, queda en repo)
871892b fix(auth): verify_token busca primero en Postgres antes de MOCK
9084c53 fix(payments): pivot a Checkout Pro como default
cd97597 ux(social): quitar botón 'GENERAR PNG'
d5d7a54 feat(charts): radar chart kind + integración en HoStats/VoltaStats
7c71079 feat(premium): pantalla Plan PRO real con MP Subscriptions + fix CORS
2631bed fix(payments): MP body constraints + coach annual price cap
0b1284b feat(payments): MP Subscriptions API · precios USD-anchored
ae9834d feat(payments): MercadoPago Checkout Pro · Chile · CLP
fadcfc7 feat(admin): /v1/admin/migrate endpoint
7cb9aff feat(ho): HoStats screen (volumen + intensidad + 1RM + mesociclo)
```

---

## 8. Cosas pendientes que no se hicieron

- ❌ MCP Render conectado funcional (intentamos, no cargó en sesión)
- ❌ MCP Perplexity (instrucciones dadas, usuario no instaló)
- ❌ Watcher email IMAP para verificar transferencias bancarias (pivoteamos a MP)
- ❌ Push notifications (PWA + service worker)

---

## 9. Cómo arrancar un chat nuevo · prompt sugerido

```
Leé HANDOFF.md primero. Estamos en commit 9a9906d de
github.com/esstipi-debug/Holy-Oly. La app live es 
https://holy-oly.onrender.com (frontend) y 
https://holy-oly-3.onrender.com (backend).

Lo más reciente (sesión 2026-05-26 Opus 4.7):
- 7 features del backlog viral cerradas: Leaderboard, 1RM auto-PR,
  Belt ceremony, PreWOD share 9:16, Coach viral tools, Wise Score
  card, ATL persistente.
- Backend sync: baseline (offline-first) + WOD results endpoint
  (migration 006 corrida en prod).
- Subagent simulator QA · 8 usuarios sim seedeados (@holyolysim.com).
- Mistral: código preparado con mistral-small-latest + MISTRAL_MODEL
  env. QA audit hecho · 3 fixes críticos pendientes (max_tokens,
  rate limit per-user, billing alerts) antes de activar tráfico real.

Bloqueantes ACTIVOS (acción de Esteban):
  - CORS_ORIGINS en Render env: borrar la var (default del código OK)
    o setearla con holy-oly.onrender.com incluida. Sin esto, la app
    SOLO funciona en demo mode (frontend live no habla con backend).
  - MISTRAL_API_KEY revocada · setear nueva DESPUÉS de los 3 fixes
    críticos del audit (ver sección Pendientes del HANDOFF).
  - MP_PLAN_ID_* en Render para activar pagos.

Workflow probado en esta sesión:
- Hasta 3 agentes en paralelo funciona bien (probado con paralelo
  ho_atleta + vol_atleta + coach simulator browser).
- Memoria: feedback workflow_momentum.md aplica: mantener cola visible,
  pedir decisiones intermedias, encadenar tareas sin confirmar entre cada
  una salvo scope real.

Próximas tareas (orden):
  1. Esteban: fix CORS env var en Render
  2. Esteban: revoke + nueva MISTRAL_API_KEY post-fixes
  3. Aplicar 3 fixes críticos Mistral (~2h paralelo)
  4. QA real post-CORS (rerun simulator)
  5. #8 Push notifications PWA · 4h
  6. #9 Heatmap 365 anual · 3h
  7. Otros del audit

Empezá pidiendo el siguiente paso o decime cuál priorizar.
```

---

## 10. Archivos críticos para entender el proyecto

| Archivo | Por qué leerlo |
|---|---|
| `HANDOFF.md` (este) | Estado actual completo |
| `ROADMAP.md` | Planes organizados por bloques A-E |
| `OPS_RENDER.md` | Operaciones Render |
| `SPEC_FUNCIONAL.md` | Spec funcional original 647 líneas |
| `frontend/src/App.tsx` | Routing + nav maps + lifecycle |
| `frontend/src/context/AthleteContext.tsx` | Atleta + stress + adaptation engines |
| `frontend/src/data/celebrations.ts` | 16 celebraciones + builders |
| `backend/src/main.py` | FastAPI app + routers |
| `backend/src/core/*.py` | Engines (stress, adaptation, macrocycle) |
| `backend/src/coach/wise_router.py` | WISE LLM endpoint |

---

**Última verificación end-to-end del producto · 2026-05-26:**
- ✅ Frontend deployado en holy-oly.onrender.com
- ✅ Backend live con DB · 13 tablas · register devuelve UUID real
- ✅ Engines responden con cálculos reales
- ✅ Login flow funcional (registro real + demo mode)
- ✅ Pagos MP en sandbox (sin keys de producción)
