# HANDOFF · Holy Oly

> Documento único de traspaso. Leer entero antes de tocar nada.
> Última actualización: cierre sesión **2026-05-29** · branch `feat/api-first-refactor` (todo pusheado, working tree limpio salvo 2 dirs untracked de design-drops).

---

## 🎯 MISIÓN: COMPLETAR HOLY OLY

Que Holy Oly quede **100% operativo y demostrable**. Estado al cierre 2026-05-29:

1. Todas las pantallas en V2 → **HECHO**.
2. **Demo realista** sin depender del backend → **HECHO**.
3. **Loop de Coach HO** (spec) → **HECHO** (4 gráficos + insight + bandeja + revisión; lado-atleta fuera de alcance per spec §8).
4. **IMR real por ejercicio** (la quilla del spec) → **HECHO**.
5. **Fidelidad de macros** (curva IMR/mesos reales de RAW_SOURCES) → **HECHO**.
6. **Seed del backend** corregido a escuelas reales → **HECHO**.
7. **Planificación 2-3 días + transición de días** → **HECHO**.
8. **UX coach** (cartas lead-Readiness, stats explicables, gráficos lindos) → **HECHO**.
9. **Auditoría de navegación** (dead-ends, skill tree mal ubicado, error demo) → **HECHO**.

**HO está demostrable de punta a punta.** Lo que falta es secundario/Volta — ver §PENDIENTE.

---

## 📋 PROMPT DE ARRANQUE — copiar/pegar tal cual en la sesión nueva

```text
Misión: seguir completando Holy Oly (ya está demostrable; quedan pendientes secundarios + Volta).

Trabajás en el worktree C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8, branch feat/api-first-refactor. Verificá `git rev-parse --abbrev-ref HEAD` ANTES de tocar nada (puede que el harness te abra otro worktree → si no estás en compassionate-rhodes, operá ahí con rutas absolutas). Leé HANDOFF_HOLY_OLY_V2.md ENTERO.

Reglas duras:
- NO inventar macrociclos ni data. Fuente real: macrocycles/RAW_SOURCES/ → frontend/src/data/macrocycles.ts (canónico) + macroSources.ts (detalle). Si falta una fuente, pedila.
- Build SIEMPRE: `cd frontend && npm run build` (tsc -b, atrapa unused). Commitear por ola y pushear (Render auto-deploya peakqual-v2).
- Demo: https://peakqual-v2.onrender.com/?demo=1 (arranca fresco) → "Modo demo · QA" → cuadrante. Local: `cd frontend && npm run dev` → :5173.
- Verificá en preview lo que toques (no solo build).

Pendientes priorizados (ver §PENDIENTE del handoff):
1) Persistir la transición/asignación de macro en el demo (hoy TransitionSheet confirma sin mutar el roster → falta un setter en AthleteContext).
2) Revisión paso a paso de Coach HO con el Boss (qué hace/muestra cada botón/sección).
3) Calendario de competencias + picos (visión "administrador de macrociclos").
4) Volta (pantallas legacy).
Avance por ola, mostrá progreso, sin inventar data.
```

---

## ⚠️ DÓNDE TRABAJAR

- **Worktree:** `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8`
- **Branch:** `feat/api-first-refactor` (en `origin` · github.com/esstipi-debug/Holy-Oly). Verificá con `git rev-parse --abbrev-ref HEAD`.
- **Stack:** Frontend `frontend/` (React 19 + Vite + TS + framer-motion). Backend FastAPI (live en `holy-oly-3.onrender.com`).
- **Deploy:** push a `feat/api-first-refactor` → Render auto-deploya el static site **`peakqual-v2`** (`peakqual-v2.onrender.com`).

---

## ✅ ESTADO ACTUAL (hecho + commiteado + verificado en preview)

### Migración de pantallas HO a V2 — COMPLETA
Estilo V2 dark "Macrociclos". Cada pantalla scopeada bajo `.xxx-root`, hereda `tokens.css`, montada en PhoneLayout (sin chrome propio).
- **Auth:** LandingV3, LoginV3, RegisterV3, OnboardingV3.
- **Atleta:** AtletaHomeV2 + loop Warmup→ActiveSession→Summary→Victory + CheckinV2 + SkillTreeV2.
- **Stats atleta (6):** HoStats, OlyIndex, PerformanceDeepDive, SessionSchedule, PulseHub, KnowledgePills.
- **Social + perfil (8):** Leaderboard, SocialCard, SocialCardsGallery, Profile, PreMium, BeltCeremony, HormonalSetup, BaselineAssessment.
- **Coach:** CoachDashV2, CoachStatsHO, NewAthlete, CoachMacroView, AthleteDeepDive (+ AthleteTrainingView), CoachViralTools.
- **Macrociclos:** HolyOlyCatalogV2, HolyOlyDetailV2, HolyOlyMacrocycleV2, AssignMacrocycle.

### Demo (entrada operativa)
- **Cómo entrar:** `peakqual-v2.onrender.com/?demo=1` (fresco) → footer **"Modo demo · QA"** → cuadrante (Atleta HO / Coach HO / Volta atleta / Volta coach). Pills arriba (HO/VOL · ATL/COACH) roamean.
- **Corre OFFLINE:** el token `'demo'` no es JWT → `/v1/*` da 401. Ahora el 401 en demo se convierte en un mensaje benigno ("Sin datos en vivo · demo offline"), **no** el error crudo "Token inválido". Roster demo: `data/athletes.ts` (5 HO + 1 Volta).

### Demo realista (ola 1) — todo atado a roster/macro real, sin inventar
- **Coach Dash:** Week WODs ← plan semanal del macro dominante (`getWeekPlan`); Inventory ← ocupación del roster que entrena hoy.
- **AthleteDeepDive:** RM por lift 1:1 con `maxes` + cambios/fechas determinísticos (`derive.ts`); fix bug C&J.
- **PerformanceDeepDive:** PR history + lift bests reales por atleta.
- **PulseHub / SessionSchedule / KnowledgePills:** feed/semana/píldoras derivados del roster/macro real.
- **Roster realineado** a ids canónicos (ruso-5d, chino-5d, bulgaro-6d, usa-school…) — arregla id-mismatch que caía al fallback. Roster **scopeado por producto** (coach HO no ve atletas Volta).

### IMR real por ejercicio (ola 2 · la quilla)
- `data/sessionDetail.ts`: genera el desglose por lift (movimiento·sets·reps·%1RM·kg·tonelaje) desde el tipo de día del macro + los 1RM reales → IMR por ejercicio y por sesión (`IMR = peso medio / 1RM × 100`). Alimenta PerformanceDeepDive (chart "Intensidad Media Relativa" = IMR real) y el gráfico IMR-vs-banda.

### Loop de Coach HO (ola 3 · spec implementado)
- **Gráfico ① IMR vs banda de fase** (`components/coach/ImrBandChart.tsx`, SVG) + **motor de insight** (`data/insight.ts`) + banda esperada por fase (`data/imrBand.ts`).
- **Gráfico ③ ACWR** (`components/coach/AcwrGauge.tsx`) con insight; ② wellness (WeeklyAnalysisCharts) y ④ desvíos (DeviationsCard) ya existían → los 4 gráficos del spec están en el deep dive con lectura.
- **Bandeja 🔔** (`data/coachInbox.ts` + `components/coach/NotificationsSheet.tsx`): items derivados de señales reales (sesión no realizada con nota, lesión, 1RM >30 días) + revisión del coach (confirmar/revertir, persiste en sessionStorage). Cableada a la campana del CoachDash con badge.
- Insight de Readiness en el deep dive.

### Fidelidad de macros (ola 4)
- `data/macroSources.ts`: curva IMR real por semana + mesos (nombre+objetivo) + filosofía de cada macro, extraídos de `RAW_SOURCES`. `getMacroDetail()` los prefiere (override sobre el generador paramétrico), con fallback a paramétrico.

### Seed del backend corregido (ola 5)
- `macrocycle_engine.py` (enum School + PROGRAMS), `schema.sql` (seed), `017_macrocycle_templates.sql` (CHECK), `macro_suggester.py` → 24 macros canónicos, 10 escuelas REALES (Bulgarian/Korean/Chinese/Cuban/Polish/Russian/Ukrainian/Colombian/Hybrid/USA). Eliminadas las ficticias (Iraní/Turco/Japonés/Europeo). `py_compile` OK. (El backend re-seedea en su propio deploy; el demo no lo usa.)

### Planificación 2-3 días + transición (ola 6)
- Catálogo: **filtro por días/semana** (2-6d, ≤3d en verde) → surface las planillas 2-3d (cubano-novicio-2d/3d, ucraniano-3d, hibrido-3d).
- **Asistente de transición de días** (`data/macroTransition.ts` + `components/coach/TransitionSheet.tsx`, desde el deep dive → "Cambiar días"): nueva frecuencia → macro afín (misma escuela primero) → week picker (continuar en semana proporcional al progreso / reiniciar S1). **OJO: confirma pero NO persiste** (ver pendiente #1).

### UX coach (ola 7)
- Cartas del coach: lideran con **Readiness (estado HOY)**; OVR/tier identidad chica secundaria.
- **Stats en palabras completas** (Readiness/Sueño/SNC/Recuperación/Ánimo/Carga) + "?" → `MetricsInfoSheet` (qué es / fuente / cálculo de cada dato).
- **Gráfico IMR vs banda en SVG** (línea+área, banda sombreada, semana actual con glow); carga semanal en cyan (cohesiva).

### Navegación · auditoría + fixes (mapeada con 3 agentes)
- **Bug "no se puede salir del macro":** `HolyOlyMacrocycleV2` (HO_MACRO_ATHLETE) tenía `navigate` anulado + era PUBLIC_VIEW (sin nav/back) → atleta atrapado. **Fix: botón Volver** (back() · fallback HOME). Igual VoltaMacrocycleV2.
- **Skill tree mal ubicado:** SkillFocusAssign + SkillEvaluationPanel + CustomWodAssigner son CrossFit (Volta) → **gateados a `product==='volta'`** (fuera del deep dive de halterofilia).
- **"Token inválido o expirado":** neutralizado en `lib/api.ts` (demo 401 → mensaje benigno).
- **Secundarios:** DemoHub con "‹ Salir"; back del detalle de macro usa back() real (no saca al coach de contexto desde Asignar); botones Volta PLAN/VER WOD wireados.

---

## 🏋️ MACROCICLOS · LA FUENTE REAL (crítico — NO inventar)

- **Fuente canónica:** `macrocycles/RAW_SOURCES/` (1 .txt/.md por macro). `frontend/src/data/macrocycles.ts` (`MACROCYCLES`) = catálogo REAL extraído de ahí. `frontend/src/data/macroSources.ts` = detalle real (curva IMR/mesos/filosofía) extraído de las mismas fuentes esta sesión.
- **HO reales (24):** Búlgaro 6D · Coreano 5D/6D · Chino 5D · 5×Cubano · 4×Híbrido · Polaco 4D/5D · Ruso 5D · Ucraniano 3D/4D · Colombiano 5D · USA (escuela + 4 perfiles).
- **Colombia = solo 1** en la fuente. Más → conseguir fuente real (NO inventar).
- El backend YA NO tiene el seed ficticio (corregido en ola 5). Frontend y backend ahora comparten los ids canónicos.
- ⚠️ **Discrepancia conocida:** algunas duraciones de catálogo vs fuente difieren (ej. `cubano-novicio-2d`: catálogo 8 sem, fuente 16). `getMacroDetail` override de IMR donde hay overlap; reconciliar es pendiente #10.

---

## ▶️ PENDIENTE (prioridad sugerida)

1. **Persistir transición/asignación de macro en el demo.** Hoy `TransitionSheet` y `AssignMacrocycle` confirman sin mutar el roster estático (`data/athletes.ts`). Falta un setter en `AthleteContext` (ej. `updateMacro(athleteId, programId, week)`) + override en sessionStorage para que el cambio se vea reflejado en el atleta.
2. **Revisión paso a paso de Coach HO** con el Boss: recorrer cada botón/sección y confirmar qué hace/muestra (quedó a medias en sesiones previas).
3. **Visión "administrador de macrociclos"** (brief del Boss): lo más faltante es el **calendario de competencias + picos/objetivos** y el **tracking de peso corporal** (categoría de peso). El resto (periodización, riesgo de carga ACWR, IMR vs fase, plan-vs-real, wellness) ya existe.
4. **Volta** (pantallas legacy aún por migrar/pulir): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult. (Los macros Volta ya tienen back; PLAN/VER WOD wireados.)
5. Polish menor del loop: insight inline+drawer más profundo en wellness (②) y desvíos (④); atar más fuerte plan-vs-real a la bandeja.
6. Reconciliar duraciones catálogo↔RAW_SOURCES (ej. cubano-novicio 8 vs 16 sem).
7. ¿Más macros de Colombia / más planillas 2d? → conseguir fuente real primero.
8. Help/support bot (extender WISE): dejado anotado, no prioridad.

---

## ⚠️ GOTCHAS (no tropezar de nuevo)

1. **Build:** `cd frontend && npm run build` (tsc -b) atrapa unused (noUnusedLocals). Verificar SIEMPRE con build, no solo `tsc --noEmit`.
2. **Macros: NO inventar.** Fuente = `RAW_SOURCES` → `macrocycles.ts` + `macroSources.ts`.
3. **Navegación = stack propio** (`context/NavigationContext.tsx`, NO React Router): `navigate(v)` pushea, `back()` popea (no-op si stack=1). El botón back del layout solo aparece si `showBack && canGoBack` (`PhoneLayout.tsx`). **`PUBLIC_VIEWS` (App.tsx) NO reciben bottom-nav ni back de layout** → una pantalla pública sin botón propio = dead-end. Patrón de fix: botón propio `onBack = canGoBack ? back() : navigate('<home>')`.
4. **Demo token 401:** el token `'demo'` no es JWT → todo `/v1/*` da 401. `lib/api.ts` ya convierte ese 401 en mensaje benigno; los componentes que fetchean (DeviationsCard, WeeklyAnalysisCharts, etc.) muestran estado vacío, no error rojo.
5. **Paneles CrossFit/Volta en AthleteTrainingView** (SkillFocusAssign, SkillEvaluationPanel, CustomWodAssigner) están gateados a `product==='volta'`. No re-montarlos en HO.
6. **Discos:** usar `{ PlateBadge }` (`components/PlateBadge.tsx`). NO `<plate-3d>` crudo (rompe tsc -b). Excepción: CoachDashV2/HolyOlyMacrocycleV2 lo usan vía `@ts-nocheck`.
7. **App.tsx** es el punto de colisión del routing — serializar ediciones (un editor a la vez).
8. **BottomSheet** renderiza inline (no portal) → hereda el accent del root de página.
9. **Worktree:** instruir SIEMPRE `cd` al worktree correcto + `git rev-parse` + rutas absolutas. (El harness puede abrir la sesión en otro worktree — esta sesión arrancó en `dazzling-raman` y se trabajó en `compassionate-rhodes` con rutas absolutas.)
10. **Preview con espacios en la ruta:** "Holy Oly 001" tiene espacio → para apuntar el dev server al worktree desde otra sesión, usar la ruta corta 8.3 (ej. `HOLYOL~2/.../COMPAS~1/frontend`) en `.claude/launch.json`. La app escucha `popstate`, no `hashchange` → setear `location.hash` por eval NO navega; navegá por la UI.

---

## 🧭 ARCHIVOS CLAVE

- **Macros:** `macrocycles/RAW_SOURCES/` (fuente) · `data/macrocycles.ts` (canónico) · `data/macroSources.ts` (detalle real ← RAW_SOURCES) · `data/macroDetail.ts` (generador, `getMacroDetail` + `getWeekPlan`, prefiere macroSources) · `data/macroTransition.ts` (afines + week picker) · `data/sessionDetail.ts` (detalle por ejercicio + IMR) · `data/derive.ts` (PR history / RM determinísticos).
- **Coach HO loop:** `data/insight.ts` · `data/imrBand.ts` · `data/coachInbox.ts` · `components/coach/` (ImrBandChart, AcwrGauge, NotificationsSheet, MetricsInfoSheet, TransitionSheet) · plan en `docs/superpowers/plans/2026-05-29-coach-ho-loop.md` · spec en `docs/superpowers/specs/2026-05-28-coach-ho-design.md`.
- **Atletas/roster demo:** `data/athletes.ts`.
- **Routing:** `App.tsx` `renderView()` + `PUBLIC_VIEWS`/`HOME_VIEWS`/`NAV_MAP_*`/`ATHLETE_ONLY`/`COACH_ONLY` · `context/NavigationContext.tsx` (stack, navigate/back/canGoBack, union `View`, `VALID_VIEWS`) · `layouts/PhoneLayout.tsx` (bottom nav + back).
- **Contexts:** Auth (demoMode/user/token) · Product (`product:current`) · Role (`role:current`) · Athlete (roster + selectedAthlete). Orden: Auth > Athlete > Product > Role > Navigation.
- **Coach screens:** `pages/v2/CoachDashV2.tsx` · `pages/AthleteDeepDive.tsx` (+ `components/AthleteTrainingView.tsx`) · `pages/AssignMacrocycle.tsx` · `pages/v2/HolyOlyCatalogV2.tsx` / `HolyOlyDetailV2.tsx` / `HolyOlyMacrocycleV2.tsx`.
- **lib:** `lib/api.ts` (cliente + demo-401 benigno).

---

## 📌 DECISIONES DEL BOSS (vigentes)

- Estrategia: **migrar + borrar por pantalla**. Foco: **HO al 100% primero, Volta después**.
- **Discos** = lenguaje de carga + marca + logo.
- Demo: **realista para mostrar/vender** — enriquecer mocks, no depender del backend. **Macros fieles a RAW_SOURCES — NO inventar.**
- Loop coach: **ágil** (atleta auto-aplica, coach revisa post-hoc) · granularidad **flexible** · **4 gráficos** (IMR vs fase, wellness, ACWR, plan vs real).
- Card del coach: liderar con **Readiness (hoy)**, OVR/tier secundarios (al coach no se lo gamifica).
- Insight: **inline + drawer** (no popup modal). Stats con palabra completa + "?" que explica cómo se construye el dato.
- **Transición de días:** el coach decide + week picker (sugerir macro afín, elegir semana de arranque).
- **Skill tree:** es de CrossFit/Volta → no va en halterofilia (HO).
- **Mapa 30 días:** fill de intensidad por celda + zonas (OK confirmado).

---

## 📜 COMMITS DE REFERENCIA

**Sesión 2026-05-29 (`feat/api-first-refactor`, desde `09117d5`):**
`7ca493e` ola 1 demo realista · `23e1b2c` roster scope · `79db88c` ola 2 IMR por ejercicio · `a010bd7` ola 3a IMR vs banda+insight · `0fe3a08` ola 3b bandeja · `e1b7749` ola 3c readiness insight · `3860b70` ola 3d ACWR · `f8f7424` ola 5 seed backend · `1bc422b` ola 4 fidelidad macros · `dbd7434` ola 6 planificación 2-3d+transición · `926f0c7` ola 7 UX · `3b2d7c5` carga semanal cyan · `42ab33f` fix nav (macros sin salida + skill tree + token + mapa) · `34cc413` fix nav secundarios · `753cf05`+`5fe409e` docs(handoff).

**Sesión previa 2026-05-28/29:** `afc9cdb` Wave B coach · `7132ffd`+`b4d94a2` Stats atleta · `f8e3226`+`1776d1d`+`6664538` Social+perfil · `c979a8f` Demo HO entrada · `2157952` QA fixes coach · `4209178` spec Coach HO · `5d3e3ee` detalle macro · `67bf438` macros RAW_SOURCES · `d1c11e9` `?demo=1` fresco.
