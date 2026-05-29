# HANDOFF · Holy Oly

> Documento único de traspaso. Leer entero antes de tocar nada.
> Última actualización: **2026-05-29 (sesión 2 · continuación)** · branch `feat/api-first-refactor` (todo pusheado). Pendientes #1/#2/#3 del traspaso anterior **CERRADOS** + recomendador de macros + skin mujer. Queda Volta + polish.

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

### Sesión 2 (2026-05-29 · continuación)
10. **Persistir transición/asignación de macro** (`AthleteContext.updateMacro` + override sessionStorage) → **HECHO**.
11. **Admin de macrociclos**: calendario de competencias + planificador de picos (Approach C: la comp ancla el pico, el week-picker sugiere semana) + tracking de peso corporal/categoría con "hacer el peso" → **HECHO**.
12. **Walkthrough Coach HO** + 3 fixes: CoachMacroView pasa a roster REAL (era mock) y sin botones stub · NewAthlete persiste · ⚙️ ajustes cableado → **HECHO**.
13. **Recomendador de macrociclos client-side** (scoring nivel + debilidades, llena el panel WISE en demo) + atleta **Freddy Perdomo** (1RM reales) → **HECHO**.
14. **Skin mujer** (paleta coral+violeta, auto por género del atleta, discos intactos, coach+atleta) → **HECHO**.

**HO está demostrable de punta a punta y los pendientes #1/#2/#3 del traspaso anterior están CERRADOS.** Lo que falta es secundario + Volta — ver §PENDIENTE.

---

## 📋 PROMPT DE ARRANQUE — copiar/pegar tal cual en la sesión nueva

```text
Misión: Holy Oly (halterofilia) está COMPLETO como demo y demostrable punta a punta. NO faltan pantallas. Decidir CON EL BOSS el próximo track (A evolución demo→real / B Volta / C polish) antes de construir.

Trabajás en el worktree C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8, branch feat/api-first-refactor. Verificá `git rev-parse --abbrev-ref HEAD` ANTES de tocar nada (el harness puede abrirte otro worktree → si no estás en compassionate-rhodes, operá ahí con rutas absolutas). Leé HANDOFF_HOLY_OLY_V2.md ENTERO.

Reglas duras:
- NO inventar macrociclos ni data. Fuente real: macrocycles/RAW_SOURCES/ → frontend/src/data/macrocycles.ts (canónico) + macroSources.ts (detalle). Si falta una fuente, pedila.
- Build SIEMPRE: `cd frontend && npm run build` (tsc -b atrapa unused). Commit por ola y push (Render auto-deploya peakqual-v2).
- Demo corre OFFLINE: token 'demo' → /v1/* da 401 → usa mocks (data/athletes.ts) y escribe en sessionStorage (ho:macroOverrides, ho:competitions, ho:weighins, ho:addedAthletes). NO hay DB.
- Verificá en preview lo que toques (no solo build). Demo: https://peakqual-v2.onrender.com/?demo=1 → footer "Modo demo · QA" → cuadrante. Local: `cd frontend && npm run dev` → :5173 (gotcha #10 si el dev server arranca en otro worktree: ruta corta 8.3).

Estado: pendientes #1/#2/#3 del traspaso anterior CERRADOS + recomendador de macros client-side (atleta Freddy Perdomo) + skin mujer (coral/violeta, auto por género del atleta, discos intactos) + fix UX asignar (WISE abre el week-picker directo).

Próximos tracks (preguntá al Boss cuál; ver §PENDIENTE):
A) EVOLUCIÓN demo→producto real (lo que el Boss venía preguntando): auth real (JWT contra el backend holy-oly-3.onrender.com) + persistir los writes contra backend/DB en vez de sessionStorage + roster por cuenta. Primer eslabón sugerido: login real + cablear la asignación de macro a la DB (POST /v1/macrocycles/assign + /v1/macrocycles/generate YA EXISTEN; con JWT persisten). Competencias/pesajes/macro-override hoy son sessionStorage → faltan endpoints en el backend.
B) VOLTA (otro producto · CrossFit, legacy): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult.
C) Polish HO menor: insight inline+drawer en wellness (②)/desvíos (④); reconciliar duraciones catálogo↔RAW_SOURCES (cubano-novicio 8 vs 16 sem).
Avance por ola, mostrá progreso, sin inventar data. Usá brainstorming antes de cada feature nueva.
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

> **#1 (persistir macro), #2 (walkthrough Coach HO + fixes) y #3 (admin de macrociclos: calendario + picos + peso) — CERRADOS en sesión 2.** Quedan:

1. **Volta** (pantallas legacy aún por migrar/pulir): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult. (Macros Volta ya con back; PLAN/VER WOD wireados.) **Es lo único grande que falta para "todo el producto"; HO ya está completo.**
2. Polish menor del loop: insight inline+drawer más profundo en wellness (②) y desvíos (④); atar más fuerte plan-vs-real a la bandeja.
3. Reconciliar duraciones catálogo↔RAW_SOURCES (ej. cubano-novicio 8 vs 16 sem).
4. ¿Más macros de Colombia / más planillas 2d? → conseguir fuente real primero.
5. Help/support bot (extender WISE): dejado anotado, no prioridad.
6. **Menores nuevos (sesión 2):** la skin mujer del lado **rol-atleta** sólo se ve con persona mujer (en demo la persona es Matías/M → demostrable coach-side abriendo a **Luciana** o **Daniela**). Freddy Perdomo sin peso/edad/front-squat (categoría '—'). Nivel del recomendador = heurístico por total absoluto (refinable con bodyweight/Sinclair). El suggester real del backend (`/v1/macros/suggest`) sigue siendo la fuente con JWT; el client-side es el fallback de demo.

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
- **Admin macrociclos + recomendador + skin (sesión 2):** `data/competitions.ts` + `context/CompetitionContext.tsx` (calendario · `planToward`/`alignment`) · `data/bodyweight.ts` + `context/BodyweightContext.tsx` (peso · `makeWeight`) · `data/macroRecommender.ts` (scoring client-side, llena WISE como fallback) · `components/coach/` (CompetitionsCard, AddCompetitionSheet, BodyweightCard, AddWeighInSheet) · skin mujer = `[data-skin="women"]` en `styles/v2/tokens.css` + `AppInner` (App.tsx) setea el attr por género del atleta en foco · walkthrough en `docs/superpowers/COACH_HO_WALKTHROUGH.md` · specs/plans `docs/superpowers/{specs,plans}/2026-05-29-*` (competition-peak-planner · bodyweight-tracking · macro-recommender · women-skin).
- **Atletas/roster demo:** `data/athletes.ts`.
- **Routing:** `App.tsx` `renderView()` + `PUBLIC_VIEWS`/`HOME_VIEWS`/`NAV_MAP_*`/`ATHLETE_ONLY`/`COACH_ONLY` · `context/NavigationContext.tsx` (stack, navigate/back/canGoBack, union `View`, `VALID_VIEWS`) · `layouts/PhoneLayout.tsx` (bottom nav + back).
- **Contexts:** Auth (demoMode/user/token) · Athlete (roster + selectedAthlete + `updateMacro` + addAthlete persistente) · Competition (`ho:competitions`) · Bodyweight (`ho:weighins`) · Product (`product:current`) · Role (`role:current`). Orden: Auth > Athlete > Competition > Bodyweight > Product > Role > Navigation.
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

**Sesión 2 · 2026-05-29 (continuación, desde `3e4a498`):** `df282be` persistir macro · `e7e95a9`+`2bc334c` spec/plan competencias · `c37a331`+`d6b8822` calendario+picos+home atleta · `68ed1a7`+`4833028`+`861e4dd` peso corporal (spec/plan/coach/home) · `db273f7` walkthrough Coach HO · `cbd3363` fixes (CoachMacroView real + NewAthlete persist + ajustes) · `47ee063`+`66d2ae0`+`c779150` recomendador + Freddy · `91abaf9` skin mujer · `b6ff82b` handoff sesión 2 · `8becbad` fix UX asignar (WISE → week-picker directo).

**Sesión 2026-05-29 (`feat/api-first-refactor`, desde `09117d5`):**
`7ca493e` ola 1 demo realista · `23e1b2c` roster scope · `79db88c` ola 2 IMR por ejercicio · `a010bd7` ola 3a IMR vs banda+insight · `0fe3a08` ola 3b bandeja · `e1b7749` ola 3c readiness insight · `3860b70` ola 3d ACWR · `f8f7424` ola 5 seed backend · `1bc422b` ola 4 fidelidad macros · `dbd7434` ola 6 planificación 2-3d+transición · `926f0c7` ola 7 UX · `3b2d7c5` carga semanal cyan · `42ab33f` fix nav (macros sin salida + skill tree + token + mapa) · `34cc413` fix nav secundarios · `753cf05`+`5fe409e` docs(handoff).

**Sesión previa 2026-05-28/29:** `afc9cdb` Wave B coach · `7132ffd`+`b4d94a2` Stats atleta · `f8e3226`+`1776d1d`+`6664538` Social+perfil · `c979a8f` Demo HO entrada · `2157952` QA fixes coach · `4209178` spec Coach HO · `5d3e3ee` detalle macro · `67bf438` macros RAW_SOURCES · `d1c11e9` `?demo=1` fresco.
