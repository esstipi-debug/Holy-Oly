# HANDOFF · Migración Holy Oly → V2 (estilo "Macrociclos")

> Para iniciar una sesión nueva y continuar. Leer esto primero.
> Generado al cierre de la sesión anterior.

---

# 🟢 SESIÓN 2026-05-28/29 · Demo + Coach HO spec + macros (LEER PRIMERO)

> Continuación. La migración V2 de pantallas (abajo) ya está completa. Esto es lo nuevo.
> Todo en `feat/api-first-refactor`, pusheado. Demo local: `cd frontend && npm run dev` → :5173.

## Entrada demo (operativa · commit `c979a8f`)
- `peakqual-v2.onrender.com` → footer **"Modo demo · QA"** → cuadrante (Atleta HO / Coach HO / Volta). Pills arriba (HO/VOL·ATL/COACH) roamean. Atajo: `?demo=1&p=ho`.
- **Demo corre OFFLINE**: el token `'demo'` no es JWT → todo `/v1/*` da **401 → fallback a mock**. Por diseño. (El backend `holy-oly-3.onrender.com` está VIVO pero solo tiene auth + 23 macros con seed equivocado + engine; NO tiene roster de coach ni detalle rico → la vista coach es mock de frontend.)

## Spec de Coach HO (diseño aprobado · NO implementado)
- `docs/superpowers/specs/2026-05-28-coach-ho-design.md` (commit `4209178`).
- El **motor del loop** (macrociclo = PLANTILLA; atleta auto-aplica completar/modificar/fallar/cancelar; coach revisa post-hoc: confirmar/revertir/re-modificar; IMR; notificaciones) + los **4 gráficos del coach** (IMR vs banda de fase · wellness · ACWR · plan vs real). Falta IMPLEMENTAR.

## 🏋️ Macrociclos · LA FUENTE REAL (crítico — no inventar)
- **Fuente canónica: `macrocycles/RAW_SOURCES/`** (1 .txt por macro). `frontend/src/data/macrocycles.ts` (`MACROCYCLES`) se extrae de ahí = el catálogo REAL.
- HO reales: Búlgaro 6D · Colombiano 5D · Coreano 5D/6D · Chino 5D · **5×Cubano** · 4×Híbrido · Polaco 4D/5D · Ruso 5D · Ucraniano 3D/4D · **USA (escuela + 4 perfiles)**. Total 24.
- **USA = 1 escuela con 4 perfiles** (Principiante·Intermedio·Avanzado·Master 40+), de `RAW_SOURCES/USA/USA_SCHOOL_COMPLETE.md` (agregados `67bf438`). Catalyst/Cal Strength/Mash son las *fuentes* que la alimentan, NO macros del catálogo.
- **Colombia = solo 1** en la fuente. Para más → conseguir la fuente real (no inventar).
- ⚠️ **El backend tiene un SEED EQUIVOCADO** (`backend/migrations/017_macrocycle_templates.sql`): escuelas **Iraní/Turco/Japonés/Europeo** que NO son las originales. El frontend lo IGNORA (el catálogo filtra ids que no están en la fuente). **TODO: corregir el seed del backend a RAW_SOURCES.**

## Demo realista (B) · hecho esta sesión
- **Detalle de macro POR MACRO** (`data/macroDetail.ts` · commit `5d3e3ee`): genera curva IMR / 4 mesos / semana-tipo + filosofía por escuela desde los params del macro. Antes mostraba SIEMPRE Ruso Clásico hardcodeado.
- **Catálogo unificado** a `MACROCYCLES` → catálogo ↔ detalle ↔ asignar usan los MISMOS ids.
- Fix **"varios macros llevan a Búlgaro 6D"** (`67bf438`).

## QA fixes coach (commit `2157952`)
- Alerta **RESOLVER → ATHLETE_DETAIL** (ventana de entrenamiento, no asignar-macro).
- Roster cards con **métricas de engine/hoy** (RDY·SUE·CNS·REC·MOT·CRG) en vez de ratings FIFA.
- AssignMacrocycle: **"Ver detalle"** por card.

## ⏳ ABIERTO / próximos pasos
1. **Demo realista (B) · seguir las olas:** secciones placeholder restantes → Coach Dash (Week WODs + Inventory atados al roster/macro) · Deep Dive (cambios de RM coherentes) · Pulse feed · Knowledge Pills · Session Schedule · PR history. Y el **detalle de sesión POR EJERCICIO** (tonelaje/reps por lift) para IMR real.
2. **Fidelidad del detalle de macro:** hoy filosofía/mesos son parametrizados por escuela; se pueden **parsear los .txt de `RAW_SOURCES`** para el contenido exacto por macro.
3. **Corregir el seed de macros del backend** (`017_macrocycle_templates.sql` → RAW_SOURCES). Hoy Iraní/Turco/etc. están mal.
4. **Implementar el loop de Coach HO** (spec arriba): modelo sesión/estados, opciones del atleta, aprobar/notificar.
5. **Revisión paso a paso de Coach HO** con el Boss — quedó a medias (qué hace/muestra cada botón/sección).
6. ¿Más macros de Colombia? → conseguir la fuente real primero.

## 📌 Decisiones del Boss (esta sesión)
- Demo: **B (realista para mostrar)** — enriquecer mocks, no depender del backend.
- Loop coach: **ágil** (atleta auto-aplica, coach revisa post-hoc) · granularidad **flexible** (dato por ejercicio, vistas sesión/ejercicio) · los **4 gráficos**.
- Carta: **disco olímpico = logo/tier**; nombre del sistema parqueado; en la card del coach liderar Readiness, no OVR.
- Macros: **fieles a RAW_SOURCES, NO inventar.**
- Help/support bot: dejarlo anotado (no prioridad).

---

## ⚠️ DÓNDE TRABAJAR (crítico)
- **Worktree:** `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8`
- **Branch:** `feat/api-first-refactor` (pusheado a `origin` · github.com/esstipi-debug/Holy-Oly)
- **Verificar SIEMPRE al arrancar:** `git rev-parse --abbrev-ref HEAD` → debe decir `feat/api-first-refactor`. Si dice otra cosa, estás en el worktree equivocado (varios agentes editaron `hungry-tesla` por error).
- Frontend en `frontend/`. Stack: React 19 + Vite + TS + framer-motion. Backend FastAPI (live en Render, branch aparte).

## 🎯 OBJETIVO
UNA sola identidad visual: el estilo **V2 dark "Macrociclos"** (FIFA/Strava, acento HO rojo/amber, Volta cyan). Por pantalla: restyle preservando lógica → borrar la legacy gemela cuando aplica. Foco actual del Boss: **Holy Oly operativo al 100%**.

## ✅ YA EN V2 (commiteado + pusheado)
- **Auth:** LandingV3, LoginV3, RegisterV3, OnboardingV3 (con auth REAL vía AuthContext, demo-mode preservado). Wireadas al flujo real; legacy borradas.
- **Atleta:** AtletaHomeV2 (HOME, datos reales + discos), loop de entreno **WarmupGenerator → ActiveSession → SessionSummaryPreview → VictoryScreen** (con discos PlateBadge en cargas; Warmup tiene 2 botones de skip visibles).
- **Coach:** CoachDashV2 (COACH_DASH), CoachStatsHO, NewAthlete, CoachMacroView, AthleteDeepDive, CoachViralTools.
- **Macrociclos:** HolyOlyCatalogV2, HolyOlyDetailV2, HolyOlyMacrocycleV2, **AssignMacrocycle** (V2 + **Week Picker** → POST /v1/macrocycles/assign con start_week).
- **Cluster AthleteTrainingView ola A:** AthleteTrainingView (hub), CustomWodAssigner, ManualSessionAssigner.
- **Toasts:** botón X + swipe para cerrar (Toast.tsx).
- **Skill-tree (PROGRESSION):** guard product-aware (en HO muestra estado neutral, no el árbol CrossFit).
- ~7 pantallas legacy borradas (Login, Register, Landing, Onboarding, VoltaDashboard, AtletaHome, CommandCenter).

## ✅ COMPLETADO sesión 2026-05-28 (commiteado + pusheado a `feat/api-first-refactor`)
Todo buildea verde (`npm run build`, tsc -b) y está en `origin` → Render redeploya `peakqual-v2`.
- **Wave B coach** (`afc9cdb`): SkillEvaluationPanel, SkillFocusAssign, **SessionHistoryList** (JSX convertido a `.shl-*`, disco PlateBadge por tier, chip RPE `data-level`). Cluster AthleteTrainingView **100% V2**.
- **Stats atleta** (`7132ffd` + `b4d94a2`): SessionSchedule (`.ssch-*`), PulseHub (`.plh-*`), KnowledgePills (`.kp-*`), HoStats (`.hst-*`), OlyIndex (`.oly-*`), PerformanceDeepDive (`.pdd-*`). Las 6 en V2.
- **Social + perfil** (`f8e3226` + `1776d1d` + `6664538`): Leaderboard (`.lb-*`, product-aware), SocialCardsGallery (`.scg-*`), SocialCard (`.soc-*`, solo chrome — las cards virales `components/social/*Card` NO se tocaron), Profile (`.prof-*`), PreMium (`.prem-*`), BeltCeremony (`.belt-*`, immersive), HormonalSetup (`.horm-*`), BaselineAssessment (`.base-*`) + LogTestSheet (inline-token-swap). Las 8 en V2.
- **Demo HO** (`c979a8f`): entrada demo determinística por cuadrante (LoginV3 + LandingV3) — desbloquea ver TODO HO en Render. Cómo acceder: ver "FALTA PARA HO 100%" abajo.

> Patrón usado: cada pantalla scopea bajo una clase root `.xxx-root`, hereda `tokens.css`, se monta en PhoneLayout (sin chrome propio), colores dinámicos via `--c` inline. Las big stats usan `<Chart>`/`<Heatmap365>` con colores hex alineados a tokens. `BottomSheet` es `position:fixed` pero **renderiza inline** (no portal) → el contenido hereda el accent del root de página.

## ⏳ FALTA PARA HO 100%
- ✅ **Demo HO** — HECHO (commit `c979a8f`). Entrada determinística por cuadrante. **Cómo verlo en Render:** abrir `https://peakqual-v2.onrender.com/` → footer **"Modo demo · QA"** → en el Login tocar **Atleta HO** o **Coach HO** (o Volta) → aterriza en ese cuadrante; los pills arriba (HO/VOL · ATL/COACH) roamean todo. Atajo: `…/?demo=1&p=ho`. El dato HO demo es Matías + roster (atletas en `data/athletes.ts`). Los 401 a `holy-oly-3.onrender.com` son esperados (token demo no es JWT) → fallback a mock por diseño.
- **QA visual** de lo migrado: ahora SÍ se puede (entrar por Demo HO). Falta el click-through humano pantalla por pantalla (sólo verifiqué `npm run build` verde + render del coach dash + HoStats en dev).
- (Opcional) Help/support bot in-app (extender WISE) — **decisión Boss 2026-05-28: dejarlo anotado**, foco en HO.
- (Opcional) Unificar disco a PlateBadge en CoachDashV2 (hoy usa `<plate-3d>` vía @ts-nocheck).

## 🟦 VOLTA (estado, fuera de foco actual)
- En V2: VoltaDashboardV3 (home), flujo WOD VoltaPreWod/VoltaWarmup/VoltaActiveWod.
- Legacy aún: VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult.

## ⚠️ GOTCHAS (no tropezar de nuevo)
1. **`npm run build` (tsc -b) es más estricto que `npx tsc --noEmit`** (atrapa unused vars con noUnusedLocals). SIEMPRE verificar con `npm run build`, no solo tsc --noEmit.
2. **Discos:** usar el componente React `{ PlateBadge }` de `src/components/PlateBadge.tsx` (tier = 'white'|'green'|'yellow'|'blue'|'red', size = number). **NO** usar el custom element crudo `<plate-3d>` (no tiene tipo JSX → rompe `tsc -b`). Excepción: CoachDashV2 usa `<plate-3d>` (anda vía `@ts-nocheck` + `import '../lib/web-components'`) — se podría unificar a PlateBadge después.
3. **Demo HO — RESUELTO** (`c979a8f`). Antes: forzar `product:current=holy-oly` no alcanzaba porque `enterDemoMode()` no seteaba product/role y `ProductContext`/`RoleContext` sólo leen storage al init (de ahí la "auto-corrección"). Ahora la entrada demo usa los setters `useProduct().setProduct`/`useRole().setRole` (reactivos) + `enterDemoMode()`. El dato HO ya existía (`AthleteContext`: demoMode+holy-oly → `roster.find(a => a.product !== 'volta')` = Matías). Claves localStorage: `user`, `token`, `demoMode`, `product:current`, `role:current`; `isAuthenticated = !!user`.
4. **Chrome propio:** algunas V2 lazy (AtletaHomeV2, CoachDashV2, CheckinV2, SkillTreeV2) traían su propio marco de teléfono (status bar / bottom nav). Al wirearlas como pantalla real hay que **quitarles ese chrome** (PhoneLayout ya lo provee) y scopear su CSS (sin resets globales). Ya hecho para las wireadas.
5. **App.tsx es el punto de colisión** del routing — serializar ediciones ahí (un solo editor a la vez).
6. **Agentes y worktree:** instruir SIEMPRE `cd` al worktree + `git rev-parse` verify + rutas absolutas. Un agente editó `hungry-tesla` por error.
7. **CSS scopeado:** cada pantalla V2 scopea todo bajo una clase root (ej. `.atv-root`), sin `body`/`html`/`*` globales.

## 🧭 ROUTING (referencia rápida)
- Vistas en `src/context/NavigationContext.tsx` (union `View` + `VALID_VIEWS`).
- Router maestro en `src/App.tsx` `renderView()`: primero PUBLIC, después `if (product === 'volta') {switch} else {switch HO}`.
- `PUBLIC_VIEWS`, `NAV_MAP_HO/VOLTA`, `handleNavChange`, `ATHLETE_ONLY`/`COACH_ONLY`.

## 🔍 CÓMO VERIFICAR / VER
- Build: `cd frontend && npm run build` (debe dar exit 0).
- Correr local: `cd frontend && npm install && npm run dev` → `localhost:5173` (o `:5174`).
- **NO hay link desplegado** de esta rama. Render sirve `main` (viejo). Para link compartible: deploy de preview en Render (necesita dashboard del Boss) o merge a main (NO recomendado hasta cerrar HO).

## ▶️ PRÓXIMOS PASOS (orden sugerido)
1. **QA visual** humano de las 17 pantallas migradas (Wave B + 6 Stats + 8 Social/perfil) entrando por Demo HO en Render (ver arriba cómo). Anotar lo que se vea raro.
2. **Volta** (fuera de foco hasta cerrar HO): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult.
3. (Opcional) Help/support bot (WISE) · unificar disco PlateBadge en CoachDashV2.

> Pantallas HO de atleta/coach: **migración a V2 COMPLETA**. Demo HO: **HECHO**. HO al 100% salvo QA visual humano.

## 📌 Decisiones del Boss (vigentes)
- Estrategia: **migrar + borrar por pantalla** (no borrar todo, no partir de cero).
- Foco: **Holy Oly al 100% primero** (Volta después).
- Discos S/M/L usados más en toda la app (motivo de marca halterofilia).
- Notificaciones cerrables con X + swipe (hecho).
- Atleta DEBE tener skip en el calentamiento (hecho: 2 botones).
