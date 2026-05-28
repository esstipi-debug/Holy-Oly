# HANDOFF · Migración Holy Oly → V2 (estilo "Macrociclos")

> Para iniciar una sesión nueva y continuar. Leer esto primero.
> Generado al cierre de la sesión anterior.

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

> Patrón usado: cada pantalla scopea bajo una clase root `.xxx-root`, hereda `tokens.css`, se monta en PhoneLayout (sin chrome propio), colores dinámicos via `--c` inline. Las big stats usan `<Chart>`/`<Heatmap365>` con colores hex alineados a tokens. `BottomSheet` es `position:fixed` pero **renderiza inline** (no portal) → el contenido hereda el accent del root de página.

## ⏳ FALTA PARA HO 100%
- **Demo HO** (ver Gotchas) — **el item bloqueante ahora**. Todas las pantallas HO de atleta migradas NO se pueden ver en el preview de Render porque el usuario demo es de Volta y no hay demo HO. Crear atleta (+coach) demo Holy Oly + entrada desbloquea QA end-to-end real.
- **QA visual** de lo migrado una vez exista el demo HO (sólo se verificó `npm run build` verde, no click-through en browser por el gap del demo).
- (Opcional) Help/support bot in-app (extender WISE) — **decisión Boss 2026-05-28: dejarlo anotado**, foco en HO.
- (Opcional) Unificar disco a PlateBadge en CoachDashV2 (hoy usa `<plate-3d>` vía @ts-nocheck).

## 🟦 VOLTA (estado, fuera de foco actual)
- En V2: VoltaDashboardV3 (home), flujo WOD VoltaPreWod/VoltaWarmup/VoltaActiveWod.
- Legacy aún: VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult.

## ⚠️ GOTCHAS (no tropezar de nuevo)
1. **`npm run build` (tsc -b) es más estricto que `npx tsc --noEmit`** (atrapa unused vars con noUnusedLocals). SIEMPRE verificar con `npm run build`, no solo tsc --noEmit.
2. **Discos:** usar el componente React `{ PlateBadge }` de `src/components/PlateBadge.tsx` (tier = 'white'|'green'|'yellow'|'blue'|'red', size = number). **NO** usar el custom element crudo `<plate-3d>` (no tiene tipo JSX → rompe `tsc -b`). Excepción: CoachDashV2 usa `<plate-3d>` (anda vía `@ts-nocheck` + `import '../lib/web-components'`) — se podría unificar a PlateBadge después.
3. **Usuario demo es de VOLTA** (CrossFit Palermo). Forzar `product:current=holy-oly` en preview se "corrige" solo al producto del atleta demo. **No hay atleta/coach demo HO** → no se puede demostrar HO end-to-end. Pendiente: crear un demo HO (seed/usuario + entrada). Claves localStorage: `user`, `token`, `demoMode`, `product:current`, `role:current`; `isAuthenticated = !!user`.
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
1. **Demo HO**: crear atleta/coach demo Holy Oly (seed/usuario mock + entrada) para QA end-to-end real. Es lo que falta para poder VER en Render todo lo migrado (gotcha #3). Claves localStorage: `user`, `token`, `demoMode`, `product:current`, `role:current`.
2. **QA visual** de las 17 pantallas migradas (Wave B + 6 Stats + 8 Social/perfil) una vez exista el demo HO.
3. **Volta** (fuera de foco hasta cerrar HO): VoltaWodSummary, VoltaStats, VoltaCoachDash, VoltaCoachWod, VoltaCoachTools, LogWodResult.
4. (Opcional) Help/support bot (WISE) · unificar disco PlateBadge en CoachDashV2.

> Pantallas HO de atleta/coach: **migración a V2 COMPLETA** salvo Demo HO.

## 📌 Decisiones del Boss (vigentes)
- Estrategia: **migrar + borrar por pantalla** (no borrar todo, no partir de cero).
- Foco: **Holy Oly al 100% primero** (Volta después).
- Discos S/M/L usados más en toda la app (motivo de marca halterofilia).
- Notificaciones cerrables con X + swipe (hecho).
- Atleta DEBE tener skip en el calentamiento (hecho: 2 botones).
