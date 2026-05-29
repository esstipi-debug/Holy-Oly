# HANDOFF · Holy Oly

> Documento único de traspaso. Leer entero antes de tocar nada.
> Última actualización: cierre sesión 2026-05-28/29 · branch `feat/api-first-refactor` (todo pusheado).

---

## 🎯 MISIÓN: COMPLETAR HOLY OLY

Que Holy Oly quede **100% operativo y demostrable**:
1. Todas las pantallas en V2 → **HECHO**.
2. **Demo realista** sin depender del backend → **HECHO** (sesión 2026-05-29: 8 pantallas atadas a roster/macro real).
3. **Loop de Coach HO** (spec) → **HECHO** (IMR vs banda + insight + bandeja 🔔 + revisión del coach + ACWR; lado-atleta fuera de alcance per spec §8).

Extra hecho 2026-05-29: detalle de sesión POR EJERCICIO + IMR real (quilla) · fidelidad de macros (curva IMR/mesos reales de RAW_SOURCES) · seed del backend corregido a escuelas reales.

**Falta:** Volta (pantallas legacy) · polish menor (insight más profundo en wellness/desvíos · reconciliar duraciones catálogo↔RAW_SOURCES, ej. cubano-novicio 8 vs 16 sem).

---

## 📋 PROMPT DE ARRANQUE — copiar/pegar tal cual en la sesión nueva

```text
Misión: COMPLETAR HOLY OLY (que quede 100% operativo y demostrable).

Trabajás en el worktree C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8, branch feat/api-first-refactor. Verificá `git rev-parse --abbrev-ref HEAD` ANTES de tocar nada. Leé HANDOFF_HOLY_OLY_V2.md ENTERO.

Estado: las pantallas HO ya están migradas a V2. Foco ahora: el "demo realista" y después implementar el loop de Coach HO (spec en docs/superpowers/specs/2026-05-28-coach-ho-design.md).

Reglas duras:
- NO inventar macrociclos. La fuente real es macrocycles/RAW_SOURCES/ y frontend/src/data/macrocycles.ts se extrae de ahí. El seed del backend (backend/migrations/017_macrocycle_templates.sql) está MAL (escuelas Iraní/Turco/Japonés/Europeo que NO son originales) → ignorar/corregir, no usar.
- Build SIEMPRE con `cd frontend && npm run build` (tsc -b, atrapa unused). Commitear por ola y pushear (Render auto-deploya peakqual-v2).
- Demo para verificar: https://peakqual-v2.onrender.com/?demo=1 (arranca fresco) → "Modo demo · QA" → elegí cuadrante. Local: `cd frontend && npm run dev` → :5173.
- NO inventar data en general: si falta una fuente, pedila.

Empezá por (orden sugerido):
1) Demo realista: secciones placeholder del Coach Dash (Week WODs + Inventory atados al roster/macro) y Athlete Deep Dive (cambios de RM coherentes); luego Pulse feed, Knowledge Pills, Session Schedule, PR history.
2) Detalle de sesión POR EJERCICIO (tonelaje/reps por lift) → para IMR real.
3) Implementar el loop de Coach HO del spec (estados de sesión, opciones del atleta, aprobar/notificar).
Mostrá avance por ola.
```

---

## ⚠️ DÓNDE TRABAJAR

- **Worktree:** `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8`
- **Branch:** `feat/api-first-refactor` (en `origin` · github.com/esstipi-debug/Holy-Oly). Verificá con `git rev-parse --abbrev-ref HEAD`.
- **Stack:** Frontend `frontend/` (React 19 + Vite + TS + framer-motion). Backend FastAPI (live en `holy-oly-3.onrender.com`).
- **Deploy:** push a `feat/api-first-refactor` → Render auto-deploya el static site **`peakqual-v2`** (`peakqual-v2.onrender.com`).

---

## ✅ ESTADO ACTUAL (hecho + commiteado)

### Migración de pantallas HO a V2 — COMPLETA
Estilo V2 dark "Macrociclos" (FIFA/Strava). Cada pantalla scopeada bajo `.xxx-root`, hereda `tokens.css`, montada en PhoneLayout (sin chrome propio), colores dinámicos via `--c` inline.
- **Auth:** LandingV3, LoginV3, RegisterV3, OnboardingV3.
- **Atleta:** AtletaHomeV2 + loop Warmup→ActiveSession→Summary→Victory + CheckinV2 + SkillTreeV2.
- **Stats atleta (6):** HoStats, OlyIndex, PerformanceDeepDive, SessionSchedule, PulseHub, KnowledgePills.
- **Social + perfil (8):** Leaderboard, SocialCard (solo chrome — las cards virales `components/social/*Card` NO se tocaron), SocialCardsGallery, Profile, PreMium, BeltCeremony, HormonalSetup, BaselineAssessment.
- **Coach:** CoachDashV2, CoachStatsHO, NewAthlete, CoachMacroView, AthleteDeepDive (+ cluster AthleteTrainingView: CustomWodAssigner, ManualSessionAssigner, SessionHistoryList, SkillEvaluationPanel, SkillFocusAssign), CoachViralTools.
- **Macrociclos:** HolyOlyCatalogV2, HolyOlyDetailV2, HolyOlyMacrocycleV2, AssignMacrocycle (con Week Picker).

### Demo (entrada operativa)
- **Cómo entrar:** `peakqual-v2.onrender.com/?demo=1` (arranca fresco, limpia sesión vieja) → footer **"Modo demo · QA"** → cuadrante (Atleta HO / Coach HO / Volta atleta / Volta coach). Pills arriba (HO/VOL · ATL/COACH) roamean entre cuadrantes. (Si no se ve la entrada y NO usaste `?demo=1`: probable sesión vieja → usá `?demo=1` o incógnito.)
- **Corre OFFLINE:** el token `'demo'` no es JWT → todo `/v1/*` da **401 → fallback a mock**. Por diseño.
- El backend está VIVO pero solo tiene auth + engine + 23 macros con **seed equivocado**; **NO** tiene roster de coach ni detalle rico → toda la vista coach es **mock de frontend**. Dato demo: Matías + roster en `data/athletes.ts`.

### Demo realista — olas hechas
- **Detalle de macro POR MACRO** (`data/macroDetail.ts`): `getMacroDetail(id)` genera curva IMR / 4 mesos / semana-tipo + filosofía por escuela desde los params del macro. (Antes `HolyOlyDetailV2` mostraba SIEMPRE Ruso Clásico hardcodeado.)
- **Catálogo unificado** a `data/macrocycles.ts` → catálogo ↔ detalle ↔ asignar usan los MISMOS ids. Arregla "varios macros llevan a Búlgaro 6D" (era id-mismatch → fallback al primer macro).

### QA fixes coach
- Alerta **RESOLVER → ATHLETE_DETAIL** (ventana de entrenamiento del atleta, no asignar-macro).
- Roster cards con **métricas de engine/HOY** (RDY·SUE·CNS·REC·MOT·CRG) en vez de ratings FIFA estáticos.
- AssignMacrocycle: link **"Ver detalle"** por card.

### Spec de Coach HO (diseñado, NO implementado)
`docs/superpowers/specs/2026-05-28-coach-ho-design.md`. El **motor del loop** (macrociclo = PLANTILLA; atleta auto-aplica completar/modificar/fallar/cancelar; coach revisa post-hoc: confirmar/revertir/re-modificar; IMR; notificaciones) + los **4 gráficos del coach** (IMR vs banda de fase · wellness · ACWR · plan vs real). **Falta implementarlo.**

---

## 🏋️ MACROCICLOS · LA FUENTE REAL (crítico — NO inventar)

- **Fuente canónica:** `macrocycles/RAW_SOURCES/` (1 .txt por macro). `frontend/src/data/macrocycles.ts` (`MACROCYCLES`) se extrae de ahí = el catálogo REAL.
- **HO reales (24):** Búlgaro 6D · Colombiano 5D · Coreano 5D/6D · Chino 5D · **5×Cubano** · 4×Híbrido · Polaco 4D/5D · Ruso 5D · Ucraniano 3D/4D · **USA (escuela + 4 perfiles: Principiante/Intermedio/Avanzado/Master 40+)** de `RAW_SOURCES/USA/USA_SCHOOL_COMPLETE.md`.
- Catalyst / Cal Strength / Mash / Juggernaut son las **fuentes** que alimentan la escuela USA, **NO** macros del catálogo.
- **Colombia = solo 1** en la fuente. Para más → conseguir la fuente real (NO inventar).
- ⚠️ **El backend tiene un SEED EQUIVOCADO** (`backend/migrations/017_macrocycle_templates.sql`): escuelas **Iraní/Turco/Japonés/Europeo** que NO son las originales. El frontend lo **IGNORA** (el catálogo filtra ids que no están en la fuente canónica). **TODO: corregir el seed del backend a RAW_SOURCES.**

---

## ▶️ PRÓXIMOS PASOS

**HECHO (sesión 2026-05-29 · commits `7ca493e`→`1bc422b`):**
1. ✅ Demo realista — Week WODs + Inventory + RM + Pulse + Pills + Schedule + PR history atados a roster/macro real.
2. ✅ Detalle de sesión POR EJERCICIO + IMR real (`data/sessionDetail.ts`).
3. ✅ Fidelidad del detalle de macro (`data/macroSources.ts` ← RAW_SOURCES: curva IMR + mesos reales).
4. ✅ Loop de Coach HO (IMR vs banda + insight + bandeja 🔔 + revisión confirmar/revertir + ACWR).
5. ✅ Seed del backend corregido (escuelas reales, 24 macros canónicos).

**PENDIENTE:**
6. **Revisión paso a paso de Coach HO** con el Boss (qué hace/muestra cada botón/sección).
7. Polish menor del loop: insight inline+drawer más profundo en wellness (②) y desvíos (④); atar más fuerte plan-vs-real a la bandeja.
8. Reconciliar duraciones catálogo↔RAW_SOURCES (ej. cubano-novicio: catálogo 8 sem vs fuente 16).
9. ¿Más macros de Colombia? → conseguir fuente real primero.
10. **Volta** (recién al cerrar HO): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult (aún legacy).

---

## ⚠️ GOTCHAS (no tropezar de nuevo)

1. **Build:** `cd frontend && npm run build` (tsc -b) es más estricto que `tsc --noEmit` (atrapa unused con noUnusedLocals). Verificar SIEMPRE con `npm run build`.
2. **Macros: NO inventar.** Fuente = `RAW_SOURCES`. El seed del backend está mal (ver arriba).
3. **Discos:** usar el componente React `{ PlateBadge }` (`src/components/PlateBadge.tsx`, tier white|green|yellow|blue|red, size number). NO usar `<plate-3d>` crudo (rompe `tsc -b`). Excepción: CoachDashV2 lo usa vía `@ts-nocheck` — se podría unificar después.
4. **Demo:** `?demo=1` arranca fresco (limpia user/token viejos). La entrada vive en el Landing (footer "Modo demo") + LoginV3 (cuadrantes, gate `app:demo_mode`). Si hay sesión vieja → `isAuthenticated=true` → Landing salteado.
5. **PhoneLayout** provee el chrome (status bar + bottom nav). Las pantallas NO dibujan chrome propio; scopean su CSS bajo `.xxx-root` sin resets globales (`body`/`html`/`*`).
6. **App.tsx** es el punto de colisión del routing — serializar ediciones (un editor a la vez).
7. **BottomSheet** es `position:fixed` pero **renderiza inline** (no portal) → su contenido hereda el accent del root de página.
8. **Worktree:** instruir SIEMPRE `cd` al worktree + `git rev-parse` + rutas absolutas (un agente editó `hungry-tesla` por error).

---

## 🧭 ARCHIVOS CLAVE

- **Macros:** `macrocycles/RAW_SOURCES/` (fuente) · `frontend/src/data/macrocycles.ts` (canónico) · `frontend/src/data/macroSources.ts` (detalle REAL: curva IMR/mesos/filosofía ← RAW_SOURCES) · `frontend/src/data/macroDetail.ts` (generador, prefiere macroSources) · `frontend/src/data/sessionDetail.ts` (detalle por ejercicio + IMR) · `frontend/src/data/derive.ts` (PR history / RM determinísticos).
- **Coach HO loop:** `frontend/src/data/insight.ts` (motor de lectura) · `frontend/src/data/imrBand.ts` (banda por fase) · `frontend/src/data/coachInbox.ts` (bandeja) · `frontend/src/components/coach/` (ImrBandChart, AcwrGauge, NotificationsSheet) · plan en `docs/superpowers/plans/2026-05-29-coach-ho-loop.md`.
- **Atletas/roster demo:** `frontend/src/data/athletes.ts`.
- **Routing:** `frontend/src/App.tsx` `renderView()` (PUBLIC → `if product==='volta' {switch} else {switch HO}`) · `src/context/NavigationContext.tsx` (union `View`, `VALID_VIEWS`). Listas: `PUBLIC_VIEWS`, `NAV_MAP_HO/VOLTA`, `ATHLETE_ONLY`/`COACH_ONLY`.
- **Contexts:** Auth (demoMode/user/token) · Product (`product:current`) · Role (`role:current`) · Athlete (roster + selectedAthlete). Orden: Auth > Athlete > Product > Role > Navigation.
- **Demo entry:** `frontend/src/main.tsx` (bootstrap `?demo=1`/`?p=`/`?auto=1`) · `LandingV3.tsx` (footer "Modo demo") · `LoginV3.tsx` (cuadrantes).
- **Coach:** `CoachDashV2.tsx` · `AthleteDeepDive.tsx` (+ `AthleteTrainingView.tsx`) · `AssignMacrocycle.tsx` · `HolyOlyCatalogV2.tsx` / `HolyOlyDetailV2.tsx`.
- **Spec Coach HO:** `docs/superpowers/specs/2026-05-28-coach-ho-design.md`.

---

## 📌 DECISIONES DEL BOSS (vigentes)

- Estrategia: **migrar + borrar por pantalla** (no partir de cero).
- Foco: **Holy Oly al 100% primero**, Volta después.
- **Discos** = lenguaje de carga + marca halterofilia (también el **logo**).
- Demo: **realista para mostrar/vender** — enriquecer mocks, no depender del backend.
- **Macros fieles a `RAW_SOURCES` — NO inventar.**
- Loop coach: **ágil** (atleta auto-aplica, coach revisa post-hoc) · granularidad **flexible** (dato por ejercicio, vistas sesión/ejercicio) · **4 gráficos** (IMR vs fase, wellness, ACWR, plan vs real).
- Card del coach: liderar con **Readiness (hoy)**, OVR/tier secundarios (al coach no se lo gamifica).
- Insight sobre gráficos/números: **inline + drawer** (no popup modal).
- Notificaciones cerrables con X + swipe (hecho). Atleta con skip en el calentamiento (hecho).
- Help/support bot (extender WISE): **dejarlo anotado**, no prioridad.

---

## 📜 COMMITS DE REFERENCIA (sesión 2026-05-28/29, `feat/api-first-refactor`)

`afc9cdb` Wave B coach · `7132ffd`+`b4d94a2` Stats atleta (6) · `f8e3226`+`1776d1d`+`6664538` Social+perfil (8) · `c979a8f` Demo HO entrada · `2157952` QA fixes coach · `4209178` spec Coach HO · `5d3e3ee` detalle de macro por macro · `67bf438` macros fieles a RAW_SOURCES + fix Búlgaro 6D · `d1c11e9` `?demo=1` fresco + handoff con prompt.
