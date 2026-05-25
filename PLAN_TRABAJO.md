# Plan de Trabajo · De prototipo → app operativa

> Documento operativo. Cada task tiene id, dependencias, esfuerzo estimado, criterio de "done".

## Resumen visual del Gantt

```
Semana 1 [████████░░░░░░░░░░░░░░░░░░░░░░] Backend + DB + Auth real
Semana 2 [░░░░░░░░░░████████████░░░░░░░░] Persistencia core (sesiones, PRs, macros)
Semana 3 [░░░░░░░░░░░░░░░░░░░░░░████████] Flow coach↔atleta + achievements engine
Semana 4 [░░░░░░░░░░░░░░░░░░░░░░░░░░░░██] Stubs + polish + onboarding nuevo user
Semana 5+ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Integraciones (wearables, push, Stripe, video)
```

---

## Fase 0 · Prep (sincronía con vos · 2-4h)

| ID | Task | Esfuerzo | Bloqueado por |
|----|------|----------|---------------|
| 0.1 | Acceso al Render dashboard (vos me das credenciales o screenshots) | 0 (tuyo) | — |
| 0.2 | Definir si DB es Render Postgres o GCP AlloyDB (proyecto menciona GCP en config) | 0 (decisión) | — |
| 0.3 | Confirmar dominio prod (¿es `holy-oly.onrender.com` la URL final o vas a comprar dominio?) | 0 | — |
| 0.4 | Definir si Volta = producto separado con suscripción aparte, o feature de HO | 0 (ya decidido: separados) | — |

**Done cuando:** tenés acceso/decisiones tomadas, yo tengo logs del backend para diagnosticar.

---

## Fase 1 · Backend + DB + Auth real (1.5 días)

### Objetivo
Frontend dejará de caer a demo mode. Register/login crean usuario real en Postgres.

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 1.1 | Diagnosticar backend Render 404 (deploy log, env vars, build status) | 1h | 0.1 | Identificar causa del 404 |
| 1.2 | Re-deploy backend con fix del diagnóstico | 30min | 1.1 | `curl /health` devuelve 200 |
| 1.3 | Crear Postgres en Render dashboard (si no existe) o conectar AlloyDB existente | 30min | 0.2 | `DATABASE_URL` accesible desde backend |
| 1.4 | Aplicar migraciones 001-005 vía `execute_migration.py` | 30min | 1.2, 1.3 | Tablas users, athlete_sessions, daily_metrics, etc creadas |
| 1.5 | Test E2E: register desde frontend → user en Postgres | 1h | 1.4 | Veo el row en DB |
| 1.6 | Test E2E: login → token JWT válido → fetchMe devuelve user | 30min | 1.5 | Frontend muestra nombre real |
| 1.7 | Quitar `enterDemoMode` o esconderlo detrás de flag DEV | 15min | 1.6 | UI prod no muestra "Modo Demo" |
| 1.8 | Verificar CORS_ORIGINS incluye `holy-oly.onrender.com` | 15min | 1.2 | Sin errores CORS en console |

**Milestone:** Usuario puede registrarse y loguearse de verdad. Sus datos persisten entre sesiones.

---

## Fase 2 · Persistencia core (5-7 días)

### Objetivo
Las acciones del atleta (entrenar, log PR) y del coach (asignar macro, publicar WOD) persisten en DB.

### 2.A · Sesiones de entrenamiento

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 2.1 | Schema `training_sessions` + `session_sets` (peso, reps, RPE, status) | 2h | 1.4 | Tablas creadas en DB |
| 2.2 | `POST /v1/sessions` (start) + `POST /v1/sessions/:id/sets` | 3h | 2.1 | Curl → row creado |
| 2.3 | Frontend ActiveSession HO: persistir cada set + warmup en backend | 3h | 2.2 | Recargar pantalla mantiene sets |
| 2.4 | Frontend VoltaActiveWod: persistir score AMRAP/EMOM | 2h | 2.2 | Recargar mantiene rondas/reps |
| 2.5 | `GET /v1/sessions/:id/summary` para Victory + Summary screens | 2h | 2.2 | Datos reales en lugar de mock |
| 2.6 | `GET /v1/users/me/sessions?range=W` para PerformanceDeepDive | 2h | 2.2 | Chart bars con data real |

### 2.B · PRs (1RM tracking)

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 2.7 | Schema `prs` (user_id, lift, kg, date, session_id?) | 1h | 1.4 | Tabla creada |
| 2.8 | `POST /v1/prs` + `GET /v1/users/me/prs` | 2h | 2.7 | CRUD funciona |
| 2.9 | Detección automática de PR en log_set (si peso > current_max) | 2h | 2.8 | Set con PR → entry en prs table |
| 2.10 | Frontend PerformanceDeepDive: Snatch/C&J cards muestran histórico real | 1h | 2.8 | Lista de PRs persiste |

### 2.C · Macrociclo asignado

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 2.11 | Schema `athlete_macrocycles` (athlete_id, macro_id, started_at, current_week) | 1h | 1.4 | Tabla |
| 2.12 | `POST /v1/athletes/:id/macrocycle` (coach asigna) | 2h | 2.11 | Coach POST → DB |
| 2.13 | `GET /v1/users/me/macrocycle` (atleta lee su asignación) | 1h | 2.11 | Atleta ve su macro en Schedule |
| 2.14 | Frontend AssignMacrocycle: botón Confirmar persiste real | 1h | 2.12 | Asignación queda |
| 2.15 | Frontend Schedule/AtletaHome: leer macro de backend | 1h | 2.13 | Macro real visible |

### 2.D · WOD del box (Volta)

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 2.16 | Schema `box_wods` (box_id, date, type, movements[], scale) | 2h | 1.4 | Tabla |
| 2.17 | `POST /v1/box/wods` (coach publica) | 2h | 2.16 | Coach POST funciona |
| 2.18 | `GET /v1/box/wods/today` (atleta ve WOD) | 1h | 2.16 | Atleta lo recibe |
| 2.19 | Frontend VoltaCoachWod: "Publicar al box" persiste real | 1h | 2.17 | Click → POST |
| 2.20 | Frontend VoltaDashboard/VoltaPreWod: muestra WOD real del coach | 1h | 2.18 | Atleta ve lo que publicó coach |

### 2.E · Roster coach↔atletas

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 2.21 | Schema `coach_athletes` (coach_id, athlete_id, since_date, status) | 1h | 1.4 | Tabla |
| 2.22 | `POST /v1/coach/athletes` (assign athlete to coach) | 1h | 2.21 | |
| 2.23 | `GET /v1/coach/me/athletes` (roster) | 1h | 2.21 | CommandCenter muestra real |
| 2.24 | NewAthlete frontend: crear atleta + link al coach | 1h | 2.22 | NEW_ATHLETE flow real |
| 2.25 | Coach Stats HO: agregar tonelaje/PRs del roster real | 2h | 2.6, 2.8 | Stats reales |

**Milestone Fase 2:** Atleta entrena → datos persisten. Coach asigna macro/WOD → atleta lo ve. Roster real.

---

## Fase 3 · Engagement engine (3-5 días)

### Objetivo
Achievements desbloqueados por eventos reales. Quests trackean progreso real.

### 3.A · Achievements engine

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 3.1 | Schema `user_achievements` (user_id, achievement_id, unlocked_at) | 30min | 1.4 | Tabla |
| 3.2 | Service backend: `checkAchievements(userId, event)` evalúa triggers tras cada acción | 4h | 3.1, 2.x | Sesión completada → checkea achievements |
| 3.3 | `GET /v1/users/me/achievements` | 30min | 3.1 | API funciona |
| 3.4 | Frontend AchievementsGrid: leer de backend (no mock state) | 1h | 3.3 | Logros reales |
| 3.5 | Toast notification al desbloquear achievement | 1h | 3.2 | "🏆 Logro: Primer PR" |

### 3.B · Quests semanales

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 3.6 | Schema `weekly_quests_progress` (user_id, quest_id, week, value) | 30min | 1.4 | Tabla |
| 3.7 | Cron job semanal asigna quests a usuarios activos | 2h | 3.6 | Lunes a las 00:00 todos reciben quests |
| 3.8 | Service: actualiza progreso de quests tras cada acción | 2h | 3.6 | Set completado → +1 quest 3 sesiones |
| 3.9 | `GET /v1/users/me/quests/active` | 30min | 3.6 | API funciona |
| 3.10 | Frontend QuestsSection: leer de backend | 1h | 3.9 | Quests reales |
| 3.11 | XP redemption: quest completada → XP a user | 2h | 3.8 | XP real subiendo |

### 3.C · Niveles + cinturones

| ID | Task | Esfuerzo | Bloqueado por | Criterio done |
|----|------|----------|---------------|---------------|
| 3.12 | Schema: agregar `xp` y `level` a users | 30min | 1.4 | Columns |
| 3.13 | Service: cada XP gain → recalcular level + emitir event si subió | 1h | 3.12 | Tier change → toast |
| 3.14 | Frontend AtletaHome XP card: leer de backend | 1h | 3.12 | XP real, no "91.800" hardcoded |

**Milestone Fase 3:** Logros se desbloquean al hacer cosas. Quests rotan semanalmente. XP/cinturones suben de verdad.

---

## Fase 3.5 · 🚀 Pantallas virales (3-4 días) · NUEVA · ALTA PRIORIDAD

### Objetivo
Convertir la pantalla `SOCIAL` (Volta atleta Logros) en motor de crecimiento orgánico. Los atletas toman screenshot y lo comparten en redes → adquisición sin costo de marketing.

### Razonamiento del usuario
> "El objetivo de esta pantalla es para que los atletas celebren y compartan sus logros y progresos. La idea central es que los atletas tomen screenshot. Es crucial medir si esto pasa, para registrar qué funciona mejor. Esta lógica alimenta una forma de autopromoción, para evitar pagar por marketing — la viralidad de las pantallas."

### 3.5.A · Catálogo de logros celebrables

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.1 | Definir 10-15 tipos de logro celebrable (PR, milestone, racha, tier-up, benchmark WOD, leaderboard, aniversario, etc) | 2h | Lista en `data/celebrations.ts` con copy + iconografía |
| 3.5.2 | Cada celebration tiene: type, title, value, context (athlete, club, fecha), color theme | 1h | Type definitions |
| 3.5.3 | Hook `useLatestCelebration(userId)` que devuelve la más reciente | 2h | API ready |

### 3.5.B · Múltiples estilos visuales (3-5 variantes)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.4 | **Style 1 · Minimalist** — tipografía gigante, número hero, branding chico (ya implementado en PR #13) | ✅ | Existe |
| 3.5.5 | **Style 2 · Stadium** — gradient deportivo, glow, medalla 3D | 4h | Componente `<StadiumCard>` |
| 3.5.6 | **Style 3 · Stat Sheet** — ficha técnica de boxeo con maxes + categoría | 4h | Componente `<StatSheetCard>` |
| 3.5.7 | **Style 4 · Trophy** — trophy 3D animado, podium con confetti SVG | 4h | Componente `<TrophyCard>` |
| 3.5.8 | **Style 5 · Progress** — before/after de Snatch (6 meses atrás vs hoy) | 4h | Componente `<ProgressCard>` |
| 3.5.9 | Selector horizontal "◀ Stadium ▶" en SOCIAL | 2h | Swipe entre estilos |
| 3.5.10 | Persistir estilo preferido por usuario en localStorage `social:preferred_variant` | 30min | Carga el estilo del usuario |

### 3.5.C · Tracking de screenshots (métrica crítica)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.11 | Detectar `document.visibilitychange` cuando user sale de la pantalla con dwell time >5s en SOCIAL → trigger "probable screenshot" | 3h | Console log + state |
| 3.5.12 | Backend: schema `social_screenshots` (user_id, variant, achievement_type, dwell_ms, timestamp) | 1h | Tabla |
| 3.5.13 | Endpoint `POST /v1/social/screenshot` | 1h | API |
| 3.5.14 | Frontend: enviar event al hacer probable-screenshot | 1h | Event registrado |
| 3.5.15 | iOS native bridge para `UIScreenCapturedDidChangeNotification` (más preciso) | 1 día | Solo iOS, opcional |
| 3.5.16 | Web: explorar Screen Capture API events (limitado por browsers) | 2h | Investigación |

### 3.5.D · A/B testing entre estilos

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.17 | Asignar variante por user_id deterministicamente (hash mod 5) | 1h | Usuarios distribuidos |
| 3.5.18 | Backend service: `getScreenshotsByVariant()` agregado por achievement_type | 2h | Stats por variant |
| 3.5.19 | Dashboard admin (interno): conversion rate por variant | 4h | Vemos qué funciona |
| 3.5.20 | Auto-promotion: cada 4 semanas, retirar la variante peor y reemplazar | 2h | Evolución natural |

### 3.5.E · Auto-trigger de SOCIAL

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.21 | Toast post-WOD si hubo PR: "🎉 Nuevo PR · ¿Compartilo?" | 2h | Toast aparece |
| 3.5.22 | Tap → navigate SOCIAL con celebration pre-configurada | 1h | Llega armada |
| 3.5.23 | En `VICTORY` agregar CTA "Crear postal para redes" | 1h | Botón visible |
| 3.5.24 | Triggers: PR, primer muscle-up/HSPU, racha 7/30/100 días, tier-up, benchmark WOD | 3h | Eventos disparan auto-trigger |

### 3.5.F · UI extras para virality

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 3.5.25 | Hashtags dinámicos por tipo de logro (#PR135kg #MurphSub40) | 1h | Footer card |
| 3.5.26 | QR code con link a `holyoly.app/u/<username>` (perfil público) | 3h | QR + perfil página |
| 3.5.27 | Perfil público read-only: maxes, achievements, racha, club | 4h | URL pública shareable |
| 3.5.28 | Tooltip "Tomá screenshot y compartilo 📸" (sutil, después del hero) | 1h | Mensaje educativo |

**Milestone Fase 3.5:** Pantalla SOCIAL es motor de crecimiento orgánico. Métrica clara de cuántos screenshots por usuario por mes. Variantes mejoran iterativamente.

**Valor de negocio esperado:**
- Reducción de CAC (Customer Acquisition Cost) a casi $0 por canal orgánico
- Loop: atleta hace PR → app celebra → screenshot → IG/Stories → amigo ve → install
- Métrica norte: **% de usuarios activos que generan ≥1 screenshot/mes**

---

## Fase 4 · Cerrar stubs frontend (2 días)

### Objetivo
Eliminar todos los botones "TODO" mencionados en SPEC_FUNCIONAL.md sección 9.

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 4.1 | Social Card: Web Share API + canvas-to-image download | 4h | "Compartir Instagram" comparte de verdad |
| 4.2 | Pulse Hub "Unirse al Pulse" → modal de reto colectivo | 3h | Modal real con countdown + leaderboard |
| 4.3 | Schedule "Solicitar reprogramación" → modal mensaje a coach | 2h | Mensaje persiste, coach lo recibe |
| 4.4 | Volta Coach Tools "Marcar deload" + "Exportar review" | 3h | Endpoint persiste + PDF download |
| 4.5 | Profile coach HO setting "Inventario" → decidir: borrar o crear pantalla | 1h o 4h | UX clara |
| 4.6 | Cafeína "+ Agregar" en PreWod → modal log intake con persistencia | 2h | Cafeína nueva queda |

### Onboarding nuevo usuario

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 4.7 | Onboarding 3 pasos persiste datos en backend | 2h | Recargar mantiene progreso |
| 4.8 | Setup inicial: elegir producto (HO/Volta), rol (atleta/coach), club/box | 3h | Nuevo user llega a su home correcto |
| 4.9 | Flow "soy coach con código de invitación" para que atletas se asignen | 4h | Coach genera código → atleta lo usa |

**Milestone Fase 4:** Ningún botón sin función. Onboarding completo end-to-end.

---

## Fase 5 · Integraciones externas (1-2 semanas)

### Objetivo
Datos reales del cuerpo (wearables), notificaciones, payments, video.

### 5.A · Wearables (HRV)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 5.1 | Investigación: Apple HealthKit API vs Whoop API vs Garmin Connect | 1 día | Decisión + auth flow |
| 5.2 | Backend: endpoint `POST /v1/wellness/hrv` + storage time-series | 4h | Datos llegan + se guardan |
| 5.3 | Native bridge (iOS) o React Native plugin para HealthKit | 2-3 días | App lee HRV del device |
| 5.4 | PreWOD usa HRV real (no mock 52) | 2h | Value real visible |

### 5.B · Push notifications

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 5.5 | Setup Firebase Cloud Messaging + APNs cert | 4h | Token registrado |
| 5.6 | Backend: `POST /v1/notifications/register` + service para enviar | 4h | Notif test llega |
| 5.7 | Triggers: WOD publicado, logro desbloqueado, racha en riesgo | 4h | Notifs útiles |

### 5.C · Premium (Stripe)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 5.8 | Stripe account + products (PRO mensual, ELITE mensual) | 2h | Productos creados |
| 5.9 | Backend: `/v1/billing/checkout` + webhook handlers | 1 día | Test mode funciona |
| 5.10 | Frontend Premium: "Elegir Elite" → checkout real | 4h | Compra termina con subscription en user |
| 5.11 | Gate de features por tier (Injury Shield solo ELITE, etc) | 4h | Free user no ve features Pro |

### 5.D · Video upload (review técnica)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 5.12 | S3 bucket + signed URLs | 4h | Upload directo desde browser |
| 5.13 | Backend: metadata de videos por session | 2h | Tabla videos |
| 5.14 | Frontend: botón "Grabar video" en ActiveSession (atleta) | 4h | Video sube |
| 5.15 | Frontend coach: ver videos del atleta + comentar | 6h | Coach reviewa |

### 5.E · WiseAssistant con LLM

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 5.16 | Backend proxy `/v1/wise/chat` que llama Claude/GPT con contexto del usuario | 4h | Respuestas con datos reales |
| 5.17 | RAG: indexar manuales de macrociclos + biblioteca de movimientos | 1 día | Wise cita fuentes |
| 5.18 | Frontend: panel chat conectado a streaming | 2h | Mensajes en vivo |

**Milestone Fase 5:** App con todas las features prometidas funcionando.

---

## Fase 6 · Polish operativo (1 semana)

| ID | Task | Esfuerzo | Criterio done |
|----|------|----------|---------------|
| 6.1 | Analytics: PostHog/Mixpanel events clave (signup, session_completed, pr_logged) | 4h | Dashboard con funnel |
| 6.2 | Error tracking: Sentry frontend + backend | 2h | Errores en console del producto |
| 6.3 | Rate limiting endpoints sensibles (login, register, write APIs) | 3h | 429 si abusa |
| 6.4 | Backups Postgres automáticos | 2h | Daily backup en Render |
| 6.5 | Logging estructurado (request id, user id en cada log) | 3h | Logs trackeables |
| 6.6 | Health check más rico (`/health` reporta DB ok, cache ok) | 1h | Render monitorea bien |
| 6.7 | CI: tests backend mínimos + lint frontend | 4h | GitHub Actions pasa |
| 6.8 | Privacy policy + Terms (legal) | 0 (tuyo + abogado) | Links en Profile |

---

## Resumen de tiempos

| Fase | Duración estimada | Resultado |
|------|-------------------|-----------|
| 0 · Prep | 2-4h (tu lado) | Decisiones + access |
| 1 · Backend up | 1.5 días | Auth real funciona |
| 2 · Persistencia core | 5-7 días | App útil, datos persisten |
| 3 · Engagement engine | 3-5 días | Gamification real |
| **3.5 · Pantallas virales** 🚀 | **3-4 días** | **Motor de crecimiento orgánico** |
| 4 · Cerrar stubs | 2 días | Ningún botón muerto |
| 5 · Integraciones | 8-12 días | Wearables + push + Stripe + video + AI |
| 6 · Polish operativo | 5 días | Producción seria |
| **Total para "operativa + viral"** | **~4 semanas (fases 1-4 + 3.5)** | App usable + autopromoción |
| **Total para "lista para escalar"** | **~7 semanas (todas)** | Producto completo |

---

## Bloqueantes principales (riesgo)

1. **🔴 Acceso al Render dashboard** — sin esto no puedo diagnosticar nada del backend
2. **🔴 Decisión DB** — Render Postgres vs GCP AlloyDB. Cambia config y costos
3. **🟡 Apple Developer account** — para HealthKit + APNs (~$99/año)
4. **🟡 Stripe account** — verification process puede tardar días
5. **🟡 Dominio propio** — `*.onrender.com` no genera confianza para pagos

---

## ¿Qué hago YO (Claude) y qué hacés VOS?

| Yo | Vos |
|----|-----|
| Código backend + frontend | Acceso a dashboards (Render, GCP, Stripe) |
| Schema migrations | Decisiones de modelo de negocio |
| Tests + CI | Compra de dominio + cuentas externas |
| Documentación | Validación funcional con usuarios reales |
| Implementar integraciones | App Store / Play Store accounts |

---

## Recomendación

**Empezá por Fase 0 + Fase 1 sí o sí.** Sin backend real, las siguientes fases son aire.

Cuando tengas los accesos/decisiones de Fase 0, decime y arrancamos Fase 1. Mientras tanto, podemos:
- Cerrar stubs de Fase 4 (Compartir, Pulse, etc) que NO necesitan backend
- Refinar SPEC_FUNCIONAL.md si encontrás más gaps
- Diseñar UI para features futuras (premium gate, video review)
