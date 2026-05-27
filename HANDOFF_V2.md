# Peak Qual · HANDOFF V2

**Fecha cierre**: 2026-05-27
**Branch principal**: `feat/api-first-refactor`
**Branch snapshot mock**: `snapshot/mock-first-2026-05-27` + tag `mock-first-v1`
**Boss**: dueño · NO usar "Esteban" en mensajes · usar "Boss"
**Estado global**: ~70% backend · ~30% frontend visual · NO listo para App Store

---

## 0 · TL;DR para la próxima sesión

> **Lo que SÍ funciona**: 23 endpoints backend live · 9 engines reales · 33 píldoras educacionales · 28 movimientos Volta · catálogo Mayhem scaling · Plate3D web component · 4 pantallas V2 portadas · frontend V2 staging en `peakqual-v2.onrender.com`.
>
> **Lo que NO funciona**: app store prep (email verif · reset password) · pagos (MP_ACCESS_TOKEN pendiente) · push notifs (VAPID keys pendiente) · 14 pantallas Claude Design faltan portar · backend prod necesita correr `migrate` + 5 `seed-*` admin endpoints.
>
> **Próximo paso · sesión nueva**: correr migrations + seeds (Boss copia JS al Chrome devtools) · verificar V2 funcional · pedir Claude Design batch v3 con las 14 pantallas faltantes.

---

## 1 · Arquitectura de deploy

### Render services

| Servicio | URL | Branch | Status |
|---|---|---|---|
| `holy-oly-3` (backend) | `https://holy-oly-3.onrender.com` | `feat/api-first-refactor` ✅ cambiado | live · necesita migrate+seeds |
| `holy-oly-web` (frontend mock legacy) | `https://holy-oly-web.onrender.com` | `main` | live · mock |
| `peakqual-v2` (frontend V2 staging) | `https://peakqual-v2.onrender.com` | `feat/api-first-refactor` | live · usando holy-oly-3 como API |
| DB `holy-oly-postgres` | interno Oregon | — | compartida 3 services |

### Branches git

- `main` · estado mock-first estable (commit pre-refactor)
- `feat/api-first-refactor` · TODO el trabajo nuevo · activo · 60+ commits
- `snapshot/mock-first-2026-05-27` · backup mock-first inmutable
- Tag `mock-first-v1` apuntando a `62a41eb`

---

## 2 · CRÍTICO · acción inmediata próxima sesión

### Pendiente del Boss (no codeable)

| # | Acción | Por qué | Tiempo |
|---|---|---|---|
| **1** | Pegar JS en Chrome devtools dashboard Render para correr `migrate + 5 seeds` | Backend tiene código nuevo pero NO tablas/seeds · classifier bloquea curl directo | 60s · ver `HANDOFF_V2_admin_scripts.md` |
| **2** | Setear env var `MP_ACCESS_TOKEN` en Render holy-oly-3 | Pagos sandbox · 5min |
| **3** | Generar VAPID keys + setear `VAPID_PRIVATE_KEY` + `VAPID_PUBLIC_KEY` + `VAPID_SUBJECT` | Push notifs · 10min |
| **4** | Crear cuenta App Store Developer (USD 99/año) | Para publicar app | 1h |

### Pendiente desarrollo · prioridad

| # | Trabajo | Esfuerzo | Bloquea |
|---|---|---|---|
| **1** | Portar HTML showcases (Athlete Card · Control de Daños) a React TSX | 3h | UX completa V2 |
| **2** | Email verification + reset password | 6.5h | **App store soft req** |
| **3** | Pedir Claude Design batch v3 · 14 pantallas faltantes | 1h iteración Boss | Frontend V2 completo |
| **4** | Integrar 4 pantallas V2 con backend (Atleta/Checkin/Coach/SkillTree) · reemplazar mock data | 4h | Producto funcional V2 |
| **5** | Smart Coach Engine 14 → adapter para Volta-specific reglas | 2h | Alertas convergentes |
| **6** | Onboarding wizard · baseline tests + perfil | 4h | Atleta nuevo no entiende app |

---

## 3 · Engines status (lo que dice el código)

| # | Engine | Estado | Archivo · LOC |
|---|---|---|---|
| 01 | Stress (Banister) | ✅ REAL | `backend/src/core/stress_engine.py` |
| 02 | Session Adaptation | ✅ REAL | `backend/src/core/session_adaptation_engine.py` |
| 03 | Macrocycle (HO) | ✅ REAL | `backend/src/core/macrocycle_engine.py` · 448 LOC · 23 programas |
| 05 | Belt Engine | ✅ REAL | `backend/src/services/belt_engine.py` · UPSERT athlete_belts |
| 06 | Smart Streak | ✅ REAL | `backend/src/services/streak_service.py` · grace day |
| 11 | OLY Index | ✅ REAL | `backend/src/services/oly_index_service.py` |
| 12 | Lifestyle | ✅ REAL | `backend/src/services/lifestyle_service.py` · sleep/cafe/alcohol/dolor |
| 13 | Hormonal | ✅ REAL | `backend/src/api/hormonal/hormonal.py` + service |
| 14 | Smart Coach orquestador | ✅ REAL | `backend/src/services/smart_coach_engine.py` · 5 reglas |
| 18 | Theme | ✅ REAL | frontend ThemeContext |
| 19 | Privacy | ✅ REAL | endpoints delete · export · GDPR |
| 24 | AI Brains RAG | 🟡 PARCIAL | `explain_service.py` con Mistral + templates fallback |
| **VOLTA** | Engine Volta-specific | ✅ REAL | `backend/src/core/volta/` (9 archivos) · cycle_config · v_stress · wise_score · mayhem_scaling · skill_tree_engine · analyzer · pattern_detector · recommendation_engine |
| 04 | Gamification | 🟡 PARCIAL | XP backend falta |
| 07 | BW Milestone | ❌ AUSENTE | — |
| 08 | Warmup | 🟡 PARCIAL | hoy estático |
| 09 | Pulse anaeróbico | ❌ AUSENTE | spec 725 líneas en `engines/09_pulse_engine.md` |
| 10 | Balance ratios | ❌ AUSENTE | crítico anti-lesión |
| 15 | Píldoras (catálogo) | ✅ REAL | 33 píldoras en DB (13 base + 20 Huberman) |
| 16 | Social | 🟡 PARCIAL | SocialCard frontend · sin viral analytics backend |
| 17 | Golden Ratio | ❌ AUSENTE | — |
| 20 | Readiness Cache | ❌ AUSENTE | perf · postergable |
| 21 | Leaderboard Cache | ❌ AUSENTE | perf · postergable |
| 22 | IMR (Intensity Maintenance) | ❌ AUSENTE | — |
| 23 | Skin | ❌ AUSENTE | cosmético |

**Score**: 13 reales · 5 parciales · 6 ausentes. Mejora vs sesión anterior: +9 engines reales · +3 parciales.

---

## 4 · Endpoints `/v1/*` registrados

```
/v1/auth/login · register · me · me/export · me (DELETE)
/v1/admin/migrate · db-status · promote-to-coach · demote-to-athlete
/v1/admin/seed-demo · seed-macro-templates · seed-pills · seed-pills-huberman · seed-volta-mayhem
/v1/wod-results · /v1/wods/benchmarks · /v1/wods/today · /v1/wods/me/history
/v1/inventory (CRUD · validate · seed-defaults)
/v1/macrocycles/templates · assign · me/active · athlete/{id}/active · assignment/{id}/adherence · log
/v1/coach/dashboard-kpis
/v1/alerts/evaluate · me · box · acknowledge · resolve · dismiss
/v1/lifestyle/checkin · today · history · pain · pain/active · pills/{context} · pills/{id}/view
/v1/explain/{metric}
/v1/progression/me · belt · streak · oly-index
/v1/hormonal/setup · current · log · history
/v1/manual-sessions (CRUD + me/today)
/v1/volta/analyzer/run · recommendations · skill-tree · mayhem/scale · weekly-snapshot
/v1/skill-evaluation (focus + eval)
/v1/notifications/subscribe · test
/v1/payments/* (MP integration · pendiente token)
/v1/social/* · /v1/analytics/* · /v1/coach/* · /v1/wellness/* · /v1/baseline/*
/v1/macros/suggest (legacy macrocycle_engine HO)
/v1/competitor/* + /v1/custom-wods/*
```

---

## 5 · Migrations DB (000-023)

| # | Tabla(s) creada(s) | Seed admin endpoint |
|---|---|---|
| 000 | users · baseline_results · social_screenshots · payment_intents | — |
| 001-008 | RLS · pgvector · wise_score · RAG · oauth · wod_results · push_subs · skill_focus | — |
| 009 | wellness_checkins | — |
| 010 | manual_sessions | — |
| 011 | skill_evaluation | — |
| 012 | volta_competitor | — |
| 013 | custom_wods | — |
| 014 | cycle_tracking · cycle_log_entries (Engine 13) | — |
| 015 | athlete_belts | — |
| 016 | box_inventory · movement_equipment_tags | `seed-defaults` (15 items standard) |
| 017 | macrocycle_templates · session_templates | `seed-macro-templates` (28 templates) |
| 018 | athlete_macro_assignments · macro_session_adherence | — |
| 019 | smart_alerts · damage_control_actions | — |
| 020 | lifestyle_checkins · pain_reports · knowledge_pills · pill_views | `seed-pills` (13) · `seed-pills-huberman` (20) |
| 022 | volta_movements · mayhem_scaling_rules · cardio_conversions · athlete_skill_tiers | `seed-volta-mayhem` (28+16+15) |
| 023 | volta_recommendations · volta_weekly_snapshots · volta_session_overrides | — |

**Demo data**: `seed-demo` crea 1 coach (`coach.demo@holyoly.app` / `DemoCoach2026!`) + 6 atletas + baselines + 30d wod_results + 90d cf_sessions.

---

## 6 · Frontend V2 · pantallas portadas

| View | File | Estado |
|---|---|---|
| `V2_HOME` | `pages/v2/AtletaHomeV2.tsx` | Portada · mock data interna |
| `V2_CHECKIN` | `pages/v2/CheckinV2.tsx` | Portada · mock |
| `V2_COACH` | `pages/v2/CoachDashV2.tsx` | Portada · mock |
| `V2_SKILL_TREE` | `pages/v2/SkillTreeV2.tsx` | Portada · 4 subjects · 64 skills mock |
| `DESIGN_V2` | `pages/_dev/DesignV2.tsx` | Demo Plate3D + Stack |
| `PLATE_DEMO` | `pages/_dev/PlateDemo.tsx` | Demo legacy |

**Componentes v2**: `Plate3D.tsx` · `PlateStack.tsx` · `AthleteCardV2.tsx`

**CSS imports**: `frontend/src/styles/v2/` (tokens · skill-tree · atleta-home · checkin · coach-dash · plate-badge · athlete-card · control-danos)

---

## 7 · Próximas 14 pantallas a pedir a Claude Design (batch v3)

1. AthleteCard component aislado JSX (tenemos HTML)
2. Control de Daños screen JSX (tenemos HTML)
3. BeltCeremony fullscreen JSX
4. Alert Detail screen
5. OLY Index detail
6. Profile mobile (Hormonal opt-in + Privacy + Delete)
7. VoltaActiveWod (timer + reps)
8. VoltaWarmup (Mayhem Ready 3 fases)
9. VoltaPreWod readiness
10. HoStats (halterofilia)
11. Onboarding wizard
12. PreMium paywall
13. Macrocycle assign coach (timeline Gantt)
14. Inventario box coach

---

## 8 · Memoria importante

- **Lema**: "Smart Training Zero Burnout"
- **3 productos Peak Qual**: Volta (CrossFit) · Holy Oly (Halterofilia Olímpica) · Axon (HYROX, futuro)
- **Sistema progresión**: discos halterofilia (Verde 10kg · Amarillo 15kg · Azul 20kg · Rojo 25kg) · NO cinturones
- **Gamificación reorientada**: premia conciencia salud · NO volumen
- **Visual style**: FIFA Modo Leyenda + Bento + Tactical HUD · NO glassmorphism
- **Misión**: "ganar conciencia de la salud al entrenar · IA explica · cuando se equivoca lo acompañamos"
- **Control de daños**: sección dedicada sin culpa cuando atleta toma mala decisión
- **CompTrain Master** (4006 LOC) en `volta/source/COMPTRAIN_MASTER.md` · fuente Volta engine
- **VOLTA_CYCLE_BRAIN.md**: calendario Chile 2026 · 6 bloques · 4 niveles atleta · 7 dominios
- **Mistral API key**: configurada en Render env
- **Huberman Lab**: 20 píldoras seedeadas con citation por episodio

---

## 9 · Comandos clave nueva sesión

```bash
# Setup local
cd "C:\Users\Gamer\Desktop\Holy Oly 001\.claude\worktrees\compassionate-rhodes-7d48f8"
git status
git checkout feat/api-first-refactor
git pull

# Frontend dev local
cd frontend && npm run dev
# Abrir http://localhost:5173/#v2_home

# Backend local (opcional · usar Render para prod)
cd backend && uvicorn src.main:app --reload

# Verificar prod backend
curl https://holy-oly-3.onrender.com/health
curl https://peakqual-v2.onrender.com/

# Recuperar versión mock-first
git checkout mock-first-v1
```

---

## 10 · Lo que rompe el producto si no se hace

| # | Issue | Severidad |
|---|---|---|
| 1 | Migrations 015-023 no corridas en prod → endpoints retornan 500 al usar | 🔴 CRITICAL |
| 2 | Seeds no corridos → catálogo vacío · features no funcionan | 🔴 CRITICAL |
| 3 | Email verification falta → spammers podrían crear cuentas | 🟡 WARNING |
| 4 | MP_ACCESS_TOKEN falta → no se cobran subscripciones | 🟡 WARNING |
| 5 | Frontend V2 pantallas con mock data → datos demo confunden | 🟡 WARNING |
| 6 | Sin push notifs → atletas no reciben "WOD asignado" del coach | 🟡 WARNING |
| 7 | 14 pantallas faltan portar Claude Design → UX inconsistente | 🟡 WARNING |

---

## 11 · Reports de 4 agentes paralelos (2026-05-27 cierre)

### Agente A · Backend audit completo

**4 engines core en `/core/`** (Stress · SessionAdaptation · Macrocycle · VoltaWOD · MacroSuggester) · **9 services en `/services/`** (Belt · SmartCoach · Streak · MacrocycleDB · HormonalPhase · Lifestyle · Explain · OlyIndex · PushSender).

**33 routers registrados en main.py** · todos con verify_token excepto auth + admin.

**24 migrations · gap en 021** (secuencia 020 → 022 sin 021). Bug · verificar al inicio próxima sesión.

**🔴 Critical gaps backend**:
1. **0 tests** · ninguna cobertura · max riesgo deploy
2. **RAG mock** · `rag_retriever.py` no consume Gemini/Mistral real (peor: solo `explain_service.py` sí usa Mistral)
3. **Payment integration mock** · 555 líneas pero no integra MP real
4. **No DB pool** · cada request reinicia conexión (perf hit)
5. **Migration 021 missing** · gap en secuencia
6. **Error handling genérico** · 500 sin structured logging
7. **CORS_ORIGINS = "*"** · debería limitarse a peakqual-v2 + holy-oly-web
8. **No rate limiting activo** · middleware existe pero nunca se aplica

### Agente B · Frontend audit completo

**51 pantallas total** · 43 registradas en NavigationContext · 38 V1 (mock-first legacy) + 4 V2 + dev pages.

**Conectividad API**:
- ✅ Auth · sessions · macrocycle assign · WOD log · skill eval · wellness
- ⚠️ Stats/analytics 60% mock (sparklines hardcoded)
- ⚠️ Hormonal heavy mock
- ⚠️ skillFocus fallback mock

**11 archivos mock data activos** en `src/data/`:
- 6 actively used: athletes · skillTree · achievements · baseline · wisePhrases · celebrations
- 5 legacy/demo: macrocycles · quests · levels · wodResults · movements

**Componentes reusables clave (22)**: PlateBadge · Plate3D · PlateStack · AthleteCardV2 · AthleteCardFIFA · Heatmap365 · WodTimer · Badge · Button · Card · SkillEvaluationPanel · MetricHistoryModal · HormonalPhaseCard · AchievementsGrid · SessionHistoryList · Chart · MinimalistCard · WellnessCheckinModal · Toast · Skeleton · ThemeGallery.

**Gaps visuales**:
- 🔴 Billing/Checkout · Stripe integration falta
- 🟡 Wearable sync (Apple Watch · Garmin)
- 🟡 Live coach mode (real-time monitoring)
- 🟡 Notification center persistente
- 🟢 Coaching video library
- 🟢 Settings advanced
- 🟢 Team creation multi-box
- 🟢 Offline mode
- 🟢 Analytics export CSV/PDF

### Agente C · Test endpoints prod live

**🟢 Backend live** · health 200 · 228ms · sin cold start.

**🟢 21 tablas creadas en DB prod** · 19 users · admin endpoint OK con token (843ms).

**🟢 5 endpoints protegidos** retornan 401 correctamente:
- `/v1/wods/benchmarks` · `/v1/volta/recommendations/me` · `/v1/lifestyle/today` · `/v1/progression/me` · `/v1/explain/stress_fatigue`

**🟢 Frontend V2 sirviendo SPA** · 348ms · HTML válido Vite.

**🔴 Login DEMO FALLA** · `coach.demo@holyoly.app` no existe en DB prod · **seed-demo NO se corrió** · Boss tiene que pegar el JS en Chrome devtools.

**Auth flow**: Login espera form-encoded (OAuth2) NO JSON · si pruebas con JSON da 422 · con form-encoded da 401 si user no existe.

### Agente D · Gaps para producción

(Pendiente · cierra en breve)

---

## 12 · Acciones priorizadas próxima sesión

### Sprint 0 · Inmediato (~2h Boss)
1. **Boss pega JS migrate+seeds** en Chrome devtools dashboard Render
2. **Boss configura env vars** en Render: `MP_ACCESS_TOKEN` · `VAPID_PRIVATE_KEY` · `VAPID_PUBLIC_KEY` · `VAPID_SUBJECT` · `CORS_ORIGINS` específico (no `*`)
3. **Verificar login demo** funciona después de seed

### Sprint A · Crítico bugs (~6h)
1. Crear migration `021_*.sql` (mover 022/023 a 023/024) o documentar el gap
2. Validar admin token contra env var · no acepta cualquier valor
3. Email verification + reset password (app store soft req)
4. Configurar DB pool en main.py · `asyncpg.create_pool()` en lifespan
5. Limitar CORS_ORIGINS a peakqual-v2 + holy-oly-web

### Sprint B · UX visual (~12h)
1. Pedir Claude Design batch v3 · 14 pantallas faltantes
2. Portar HTML showcases a JSX (Athlete Card · Control de Daños)
3. Conectar 4 pantallas V2 con backend real (reemplazar mock interna)
4. AthleteContext migrar a `GET /v1/coaches/athletes` (Tarea #38 pendiente)
5. Loading + empty states consistentes (Tarea #39)

### Sprint C · Testing + polish (~10h)
1. Crear pytest suite con fixtures · cubrir Stress · Adaptation · Belt · Streak · OLY engines
2. Smart Coach engine adapter para reglas Volta-specific (5 reglas convergentes)
3. RAG retriever real con Mistral (no mock)
4. Onboarding wizard atleta nuevo
5. Structured logging JSON con request_id

### Sprint D · Diferenciadores (~25h · post launch)
1. Engine 09 Pulse (anaeróbico HO core · 725 LOC spec lista)
2. Engine 10 Balance (anti-lesión)
3. Wearable sync Apple Health/Garmin
4. Live coach mode real-time
5. Coaching video library

---

## 13 · Métricas finales de esta sesión

**Commits**: 91+ desde sesión previa
**Branches**: 4 activas (main · feat/api-first-refactor · snapshot/mock-first-2026-05-27 · tags)
**Migrations creadas**: 015 → 023 (9 nuevas)
**Endpoints nuevos**: 33 routers · ~50 endpoints
**Services nuevos**: 9 archivos backend
**Pantallas V2**: 4 portadas + 3 components (Plate3D · PlateStack · AthleteCardV2)
**Píldoras educacionales**: 33 (13 base + 20 Huberman)
**Movimientos Volta catálogo**: 28 + 16 sub-options Mayhem + 15 cardio conversions
**Documentación**: HANDOFF_V2.md + REFACTOR_API_FIRST.md + AUDIT_ENGINES_PENDING.md + AUDIT_GAMIFICATION_BUILDERCULT.md

**Score completo producto**:
- Backend: **70% listo** (sólido pero sin tests + payment + RAG real)
- Frontend V1 (mock): **95% listo** (legacy preservado en snapshot)
- Frontend V2 (refactor): **30% listo** (4 pantallas core + 14 pendientes)
- DB schema: **100% listo** (23 migrations · 21 tablas en prod)
- Engines: **13/24 reales (54%)** + 5 parciales (21%) + 6 ausentes (25%)
- Deploy: **100% live** (3 servicios Render funcionando)
- App store: **40% ready** (faltan email verif + pagos + push)

---

**FIN HANDOFF V2 · Boss: copiá JS en Chrome devtools para seedear · luego confirmá login demo · próxima sesión arranca con frontend V2 conectado al backend real.**

