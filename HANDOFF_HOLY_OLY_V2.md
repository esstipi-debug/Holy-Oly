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

## 🚧 EN VUELO / SIN COMMITEAR (terminar primero)
**Cluster AthleteTrainingView ola B** (en `src/components/`):
- `SkillEvaluationPanel.tsx` + `skill-evaluation.css` → restyle hecho, compila limpio.
- `SkillFocusAssign.tsx` + `skill-focus.css` → restyle hecho, compila limpio.
- `SessionHistoryList.tsx` + `session-history.css` → **A MEDIO TERMINAR**. El CSS V2 está completo (clases `.shl-root`, `.shl-row`, `.shl-row-icon`, `.shl-row-disc`, `.shl-row-main`, `.shl-row-date/kind/summary`, `.shl-rpe[data-level="high|mid|low"]`, `.shl-caret`), pero el **JSX NO fue convertido** a esas clases (sigue con estilos inline + tokens legacy). Errores de build:
  - `rpeChipStyle` (línea ~221) ya no existe → renombrado a `rpeLevel` (devuelve 'high'|'mid'|'low'|null). El chip RPE (~268-278) usa `rpe.bg/.fg/.bd` (objeto viejo) → cambiar a `<span className="shl-rpe" data-level={rpeLevel(...)}>`.
  - `PlateBadge` + `tierFromSession` importados/declarados sin usar → wirear el disco (`tierFromSession(s)` → `<PlateBadge tier={tier} size={32}>` en `.shl-row-disc`).
  - **Pasos:** agregar `className="shl-root"` al root, convertir el JSX de la fila a las clases `.shl-*`, fix del chip + disco, `npm run build` verde, commitear los 3 archivos de la ola B → con eso **coach HO 100% V2**.

## ⏳ FALTA PARA HO 100%
- **Stats atleta:** HoStats, OlyIndex, PerformanceDeepDive, SessionSchedule, PulseHub, KnowledgePills.
- **Social + perfil/ajustes:** Leaderboard, SocialCard, SocialCardsGallery, Profile, HormonalSetup, PreMium, BeltCeremony, BaselineAssessment.
- **Demo HO** (ver Gotchas).

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
1. **Terminar Wave B**: convertir el JSX de `SessionHistoryList.tsx` a sus clases `.shl-*` (CSS ya hecho) + wirear disco + fix chip → `npm run build` verde → commit los 3 archivos ola B.
2. **Stats atleta** a V2 (olas de ≤3): HoStats, OlyIndex, PerformanceDeepDive, Schedule, Pulse, Pills.
3. **Social + perfil** a V2: Leaderboard, SocialCard/Gallery, Profile, Hormonal, Premium, Belt, Baseline.
4. **Demo HO**: atleta/coach demo Holy Oly + entrada, para QA end-to-end real.
5. (Opcional) **Help/support bot** in-app (extender WISE) — destrabar problemas de usuarios.
6. (Opcional) Unificar disco a PlateBadge en CoachDashV2.

## 📌 Decisiones del Boss (vigentes)
- Estrategia: **migrar + borrar por pantalla** (no borrar todo, no partir de cero).
- Foco: **Holy Oly al 100% primero** (Volta después).
- Discos S/M/L usados más en toda la app (motivo de marca halterofilia).
- Notificaciones cerrables con X + swipe (hecho).
- Atleta DEBE tener skip en el calentamiento (hecho: 2 botones).
