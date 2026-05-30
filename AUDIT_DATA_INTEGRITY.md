# AUDIT · Integridad de datos · Holy Oly

> Mapa verificado contra el código (no de memoria) de dónde vive cada dato,
> qué persiste, qué es mock/generado/viejo, y dónde se pierde data.
> Fecha: **2026-05-30** · branch `claude/musing-cannon-ba8d69` (HEAD `c0d998b`).
> Motivo: el proyecto arrastra "se pierde data / se usa data antigua". Acá está el porqué.

---

## 0. TL;DR

El producto tiene **4 capas de datos que no se hablan**. Las features se construyen sobre la capa más fácil del momento → aparece data fake, vieja o que se pierde al recargar.

| Capa | Qué guarda | Problema |
|---|---|---|
| **Backend (Postgres)** | auth, baseline, wod-results, wellness, hormonal, skill focus/eval, manual-sessions, deviations, analytics, competitor, payments | la fuente de verdad real, pero **subutilizada** |
| **Mock (`data/*.ts`)** | perfil del atleta, roster del coach, maxes, sessions_last_7 | usuario real = stub en ceros; roster fake |
| **localStorage** | sesiones terminadas, plan asignado, belt, drafts | **se pierde al limpiar browser · por-device · no sincroniza** |
| **Generado en cliente** | plan del macrociclo (MacrocycleExplorer) | data fabricada en vez del engine real (24 programas) |

**La regla rota:** no hay una sola fuente de verdad. El atleta (perfil, maxes, macro, sesiones) vive en mock+localStorage+generado, mientras el backend real con 24 programas y endpoints está al lado, sin conectar.

---

## 1. Dónde se PIERDE data (localStorage-only · real, no UI-pref)

Verificado por `grep localStorage`. Estos datos son **reales de entrenamiento** y mueren al limpiar el browser / cambiar de device / no existen en otro lado:

| Dato | Key localStorage | Escribe | Lee | Backend? |
|---|---|---|---|---|
| **Resumen de sesión terminada** | `last_session:summary` | ActiveSession | VictoryScreen | ❌ no |
| **Sesiones archivadas** | `active_session:{ts}` | ActiveSession | — (nadie las relee) | ❌ no |
| **Plan asignado por coach** | `planned:{athleteId}` | plannedSessions | AtletaHome/Volta | 🟡 solo "hoy" vía manual-sessions |
| **Estado de sesión (hecha/pend)** | `planned_status:{id}:{date}:{slot}` | plannedSessions | idem | ❌ no |
| **Progresión de cinturón** | `belt:last_celebrated_idx` | AtletaHome | AtletaHome | ❌ no (existe `/progression/belt`, no wireado) |
| **Draft de score WOD** | `volta_wod:score_draft` | VoltaActiveWod | idem | ❌ no |

> **Onboarding no guarda NADA** (inputs sin state) → la bio que el atleta carga se pierde al instante. Verificado en `Onboarding.tsx`.

UI-prefs en localStorage (aceptable, no es "pérdida"): `holyoly-theme`, `units:current`, `notifications:enabled`, `nav:*`, `product:current`, `app:demo_mode`, `token`/`user`, `skillTree:view`.

Las keys `social:*` (preferred_celebration, lb_*, wod_*, pr_*) se usan como **canal de props entre pantallas** para la SocialCard → transient, pero es un smell (no es persistencia real).

---

## 2. Dónde se usa data MOCK / GENERADA (existiendo la real)

| Pantalla / módulo | Fuente actual | Debería ser | Verificado |
|---|---|---|---|
| **AthleteContext** (perfil, maxes, roster, sessions_last_7) | `data/athletes` (MOCK) | backend (auth/me + athlete_profiles + baseline) | import directo de `athletes`/`athleteByEmail` |
| **CommandCenter / CoachStatsHO** (roster) | `data/athletes` (MOCK) | `users WHERE coach_id` (backend) | useAthlete.allAthletes = mock |
| **MacrocycleExplorer** (plan del día + curva) | `lib/macroPlan` (GENERADO) | engine `/macrocycles/{id}/weeks/{n}` (24 programas reales) | generado client-side |
| **HoStats / VoltaStats** (volumen, radar, 1RM) | useAthlete (MOCK) | engine + sesiones reales | mock |
| **Leaderboard** (podio, top 10) | MOCK inline | `/progression` + cache (ausente) | sin API import |
| **CoachViralTools** | `data/athletes` (MOCK) | roster real | `mockAthletes` |
| **Macro asignado del atleta** | `athlete.macrocycle` (MOCK) | `/macrocycles/me/active` (existe, anda) | readback no wireado |

Engines que SÍ leen real (no tocar): baseline, wod-results, hormonal, wellness, skill focus/eval, manual-sessions, deviations, analytics, competitor, payments, stress/adapt.

---

## 3. Desconexiones de ID (por qué fallan las llamadas reales)

- **Macro:** mock usa `program_id: 'russian_classic'` (snake_case inglés). El engine usa kebab-case (`bulgaro-6d`, `coreano-5d`, …). `russian_classic` **no existe** en el engine → fetch del programa asignado falla / cae a fallback.
- **Atleta:** mock usa `id: 'ath_001'`. El backend espera **UUID**. Por eso DeviationsCard mostraba *"athlete_id debe ser un UUID válido"* y otras cards filtran error en demo.
- **Demo:** sin token válido → toda llamada autenticada (`api.get`) tira 401 *"Token inválido o expirado"*. Por eso en demo el engine no responde y el explorador usa generado.

---

## 4. Backend roto (endpoints que existen pero fallan)

| Endpoint | Estado | Efecto |
|---|---|---|
| `/v1/alerts/me` | 🔴 500 | Smart Coach alertas del atleta |
| `/v1/coach/dashboard-kpis` | 🔴 500 | KPIs del dashboard del coach |

---

## 5. Mapa por pantalla (fuente → ¿persiste? → riesgo)

| Pantalla | Fuente primaria | Persiste | Riesgo |
|---|---|---|---|
| Login/Register | backend auth | ✅ Postgres | — |
| AtletaHome | mock + localStorage + skillFocus(real) | 🟡 parcial | perfil mock · belt local |
| ActiveSession | mock plan → **localStorage** | 🔴 local | **sesión se pierde** |
| VictoryScreen | `last_session:summary` (local) | 🔴 local | se pierde al limpiar |
| MacrocycleExplorer | **generado** + maxes mock | 🔴 efímero | data fabricada |
| CommandCenter (coach) | roster **mock** | 🔴 mock | roster fake |
| CoachStatsHO | mock + deviations/analytics(real, falla demo) | 🟡 | mock + 500 |
| VoltaDashboard | mock + voltaWod/wellness/competitor(real) | 🟡 | mixto |
| HoStats/VoltaStats | mock | 🔴 mock | stats falsas |
| Leaderboard | mock | 🔴 mock | ranking falso |
| Onboarding | **nada** | 🔴 | **bio se pierde** |
| BaselineAssessment | baselineApi(real) + localStorage cache | ✅ | offline-first ok |
| LogWodResult | wodResults(real) | ✅ Postgres | — |
| HormonalSetup | hormonalApi(real) | ✅ | — |
| PreMium | payments(real) | ✅ | — |
| AssignMacrocycle | engine(real list/generate) | 🟡 | asignación no se relee |
| Profile | mock + localStorage + push/export(real) | 🟡 | mixto |

---

## 6. Arreglos priorizados (orden de impacto en pérdida de data)

### P0 · El usuario pierde input real
1. **Onboarding guarda bio → backend** (`athlete_profiles` + `PUT /v1/athletes/me`). Hoy se pierde.
2. **ActiveSession persiste la sesión → backend** (`/v1/sessions` o `/macrocycles/assignment/{id}/log`). Hoy localStorage-only.
3. **Perfil + maxes del atleta → backend real** (no mock). Destraba stats/engines para usuarios reales.

### P1 · Data fake/vieja donde existe la real
4. **MacrocycleExplorer → engine real** (`/macrocycles/{id}/weeks`) + **mapear ID** mock→engine. Quitar el generado.
5. **Roster del coach → query backend** (`users WHERE coach_id`). Quitar `data/athletes`.
6. **Macro asignado → readback** (`/macrocycles/me/active`, ya anda). El atleta ve su macro real.

### P2 · Robustez
7. Fix `/v1/alerts/me` y `/v1/coach/dashboard-kpis` (500).
8. Stats/Leaderboard → data real.
9. Belt + planned sessions + WOD draft → backend.

### Raíz común
Todo lo anterior colapsa en **una sola fuente de verdad = backend**, consumida por un `AthleteContext` que lee API en vez de mock. Es el *spine* (Slice 1: perfil/roster/maxes · Slice 2: sesiones). Mientras eso no exista, cada feature nueva re-introduce el desorden.

---

## 7. Regla para no repetir el desorden

> **Ninguna pantalla nueva lee de `data/*` (mock) ni genera data client-side para datos del atleta.** Si el backend no tiene el endpoint, se crea el endpoint — no se mockea. Demo se resuelve con un usuario demo real seedeado (token válido), no con mock paralelo.

---

**Verificado · 2026-05-30:** localStorage map (`grep`), imports mock/real por pantalla (`grep from data/|lib/`), engine 24 programas vivos (curl), endpoints 500 (curl), Onboarding sin persistencia (read), IDs mock vs engine (curl + data/athletes).
