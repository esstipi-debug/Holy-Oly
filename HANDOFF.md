# HANDOFF · Holy Oly + Volta

> Documento maestro para arrancar un nuevo chat con contexto completo.
> Última actualización: 2026-05-26 · sesión cerrada en commit `fb6863a`.

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
| ActiveSession bug 4×4 → no permite más sets del prescripto | ✅ |
| VictoryScreen informativa (sin botones, todo data) | ✅ |
| Radar charts (HO 4 ejes · VOL 5 dim) | ✅ |
| WOD result log + auto-PR detect benchmark | ✅ |
| Skill tree 95 movimientos + categorías wrap | ✅ |

### ⏸ Pendiente (orden de impacto)

| # | Item | Tiempo | Por qué |
|---|---|---|---|
| 1 | **Leaderboard atleta** (Top 10 box · OLY/CF Index) | 3h | Audit dijo "Top X% aislado, sin comparación social" |
| 2 | **1RM auto-PR durante ActiveSession** | 1.5h | Al loggear set que supera maxes → trigger SocialCard auto (B.6 roadmap) |
| 3 | **Belt ceremony fullscreen** con partículas | 2h | Subida de cinturón hoy silenciosa, spec viral lo pide |
| 4 | **PreWOD share 9:16** | 1.5h | Spec viral lo llama "joya de la corona" (C.10) |
| 5 | **Coach viral content tools** (Atleta del mes, etc) | 2h | Spec viral: coach genera contenido para propagar |
| 6 | Wise Score visible destacado en home | 30min | Existe en backend, no se ve |
| 7 | ATL · función real ("último cuadrante usado") | 15min | Audit #2 |
| 8 | Push notifications | 4h | C.13 roadmap |
| 9 | Heatmap 365 anual | 3h | E roadmap |
| 10 | Baseline localStorage ↔ backend sync | 2h | Hoy localStorage solo |
| 11 | WOD results backend endpoint | 2h | Hoy localStorage solo |
| 12 | Setear env vars MP en Render (para activar pagos reales) | 5min · tarea del usuario | MP_ACCESS_TOKEN está pero no MP_PLAN_ID_* |
| 13 | Setear MISTRAL_API_KEY o GOOGLE_API_KEY en Render | 1min · tarea del usuario | Para activar WISE LLM real (vs Lite actual) |

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
7cb9aff feat(ho): HoStats screen (volumen + intensidad + 1RM + mesociclo)
fadcfc7 feat(admin): /v1/admin/migrate endpoint
ae9834d feat(payments): MercadoPago Checkout Pro · Chile · CLP
0b1284b feat(payments): MP Subscriptions API · precios USD-anchored
2631bed fix(payments): MP body constraints + coach annual price cap
7c71079 feat(premium): pantalla Plan PRO real con MP Subscriptions + fix CORS
d5d7a54 feat(charts): radar chart kind + integración en HoStats/VoltaStats
cd97597 ux(social): quitar botón 'GENERAR PNG'
9084c53 fix(payments): pivot a Checkout Pro como default
871892b fix(auth): verify_token busca primero en Postgres antes de MOCK
fcd256d feat(wod): WodTimer (no usado, queda en repo)
3a797dc fix(ux): quitar timer del PreWod + skill tree categorías wrap
23c1f1f feat(victory): rediseño completo · informativa · sin botones
146e03e ux(volta): WodSummary rico en data + WellnessRow legible
a209710 feat: 3 agentes en paralelo + login fix · 5 mejoras del audit
7c11888 feat: macrociclos engine real (23 programas) + CoachMacroView amigable
f93e50c ux(coach): fix audit · confirm en deletes + input duración affordance
a6ca975 ux(ho): IMR visible en AtletaHome + card tappable → HoStats
90619e3 feat(wise): LLM real con fallback Lite · system prompt viral + banco frases
fb6863a fix(session): bloquear sets más allá de la prescripción (4×4 ≠ 8 sets)
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
Leé HANDOFF.md primero. Estamos en commit fb6863a de
github.com/esstipi-debug/Holy-Oly. La app live es 
https://holy-oly.onrender.com (frontend) y 
https://holy-oly-3.onrender.com (backend).

Lo más reciente que se hizo:
- 3 agentes en paralelo cerraron 5 debilidades del audit (engines wiring,
  login UI real, coach HO nav, athlete tap, cards gallery)
- Macrociclos engine real (23 programas) + CoachMacroView amigable
- WISE LLM con fallback Lite + frases virales del banco
- Audit fixes (confirm deletes, IMR visible, ActiveSession bug 4×4)

Próximas tareas pendientes (orden de impacto):
  1. Leaderboard atleta (Top 10 box · OLY/CF Index) · 3h
  2. 1RM auto-PR durante ActiveSession · 1.5h
  3. Belt ceremony fullscreen · 2h
  4. PreWOD share 9:16 · 1.5h
  5. Coach viral content tools · 2h
  6. Wise Score visible en home · 30min
  7. ATL función real · 15min

Bloqueantes que necesitan acción de Esteban (usuario):
  - Setear MP_PLAN_ID_* en Render (códigos disponibles en MP dashboard)
  - Opcional: MISTRAL_API_KEY o GOOGLE_API_KEY para activar WISE LLM real

Workflow recomendado: paralelizar con agentes para tareas independientes
(probado funciona con 3 agentes en paralelo).

Empezá con la #1 (leaderboard atleta) o decime cuál priorizar.
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
