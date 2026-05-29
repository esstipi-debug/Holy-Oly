# Spec · Calendario de competencias + planificador de picos (Approach C)

> Fecha: 2026-05-29 · branch `feat/api-first-refactor` · pendiente #3 (parte 1 de 2; el tracking de peso corporal va en una ola siguiente).
> Visión: "administrador de macrociclos" — la competencia es el ancla y el macro se planifica hacia ella.

## Objetivo

Que el coach pueda **agendar competencias objetivo** por atleta y que el sistema **planifique el pico del macro hacia esa fecha**: calcular si el atleta pica a tiempo y, si no, sugerir desde qué semana arrancar (o qué macro elegir) para que el pico caiga en la competencia. Integra las tools de Wave 1 (asignación + transición + week-picker).

## Decisiones del Boss (vigentes)

- **Data de competencias = tool de input del coach.** NO se inventan competencias. El coach las carga (nombre/fecha/sede/objetivo). Persisten en sessionStorage, mismo patrón que el override de macro de Wave 1 (`ho:macroOverrides`).
- **Alcance de esta ola:** calendario + picos. El tracking de peso corporal queda para la ola siguiente.
- **Approach C:** al agendar una competencia, auto-sugerir macro/semana de arranque para que el pico caiga en la fecha.
- Fuera de alcance: vista calendario club-wide agregada (posible follow-up); peso corporal (próxima ola).

## Modelo de datos

```ts
// data/competitions.ts
export type CompetitionLevel = 'local' | 'nacional' | 'internacional';
export interface Competition {
  id: string;
  athleteId: string;        // competencia objetivo de un atleta
  name: string;             // "Campeonato Argentino"
  date: string;             // ISO 'YYYY-MM-DD'
  level?: CompetitionLevel;
  objective?: string;       // texto libre: "Clasificar", "PR total"
  priority?: boolean;       // A-meet (pico principal) vs B-meet
}
```

Persistencia: `sessionStorage['ho:competitions']` → `Competition[]`. CRUD: load / add / update / remove + persist. Sobrevive reload dentro de la sesión demo (igual que Wave 1). Sin backend.

## Anclaje del macro al calendario (sin cambiar el schema)

El macrociclo del atleta NO guarda `start_date`. Se deriva de `(hoy, semana actual)`:

- `macroStartDate = hoy − (currentWeek − 1) · 7 días`
- semana W del macro → fecha `macroStartDate + (W−1)·7`
- competencia en fecha D → `macroWeekAtComp = round((D − macroStartDate) / 7) + 1`

Esta derivación es consistente con el flujo de asignación: si el coach asigna hoy arrancando en S*, entonces `currentWeek = S*` y la competencia cae en `S* + weeksUntilComp`. No requiere persistir fecha de inicio.

**Fase de realización / pico:** coherente con lo existente (`CoachMacroView`: pct>0.7 = REAL; `AtletaHomeV2`: `peakAt = round(total·0.7)`). Definimos:
- `realizationStart = round(total · 0.7)`
- semana de competencia ideal = última semana (`total`) — el atleta compite al cierre del macro.
- "pica a tiempo" = la competencia cae dentro de `[realizationStart, total]`.

## Lógica de planificación (núcleo de Approach C)

`data/competitions.ts` expone helpers puros (determinísticos, testeables, sin React):

```ts
weeksBetween(today, date): number                       // round((date−today)/7)
nextCompetition(athleteId, today): Competition | null    // próxima futura, prioriza priority
planToward(macroTotalWeeks, compDate, today): {
  weeksUntil: number;
  suggestedStartWeek: number;   // clamp(1, total) de (total − weeksUntil)
  fits: 'ok' | 'too-short' | 'too-soon';
}
alignment(competition, athlete, today): {
  weeksUntil: number;
  compWeek: number;             // semana del macro en que cae la comp
  phase: 'ACUM'|'INTENS'|'REAL'|'DELOAD'|'TEST'|'POST';
  status: 'on-peak' | 'early' | 'late' | 'past';
  suggestedStartWeek: number;
  message: string;              // insight legible
}
```

- `suggestedStartWeek S* = clamp(1, total, total − weeksUntil)`. Semántica de `fits` (crisp, mutuamente excluyentes):
  - `'too-short'` ⇒ `weeksUntil > total − 1` (la comp está más lejos que lo que abarca el macro desde S1) → el pico llegaría antes y habría detraining; sugerir macro más largo o un bridge.
  - `'too-soon'` ⇒ `S* > realizationStart` (arrancarías ya en fase de realización, salteándote base/intensificación) → la comp es muy pronto para este macro; sugerir macro más corto o taper.
  - `'ok'` ⇒ `1 ≤ S* ≤ realizationStart`.
- **Fase en una semana W**: misma lógica de cuartiles que `CoachMacroView` (`pct = W/total`: ≤0.4 ACUM · ≤0.7 INTENS · <0.95 REAL · resto TEST); `W > total` ⇒ POST.
- Para macro existente en `currentWeek`: `compWeek = currentWeek + weeksUntil`.
  - `compWeek ∈ [realizationStart, total]` → `on-peak` ✓ ("pica a tiempo").
  - `compWeek < realizationStart` → `early` ("competís en fase {phase}, antes del pico S{total} → arrancá en S{S*} o elegí un macro más corto").
  - `compWeek > total` → `late` ("el macro termina {compWeek−total} sem antes de la comp → quedás sin pico → elegí un macro más largo o reiniciá en S{S*}").
  - comp pasada → `past`.

## Integración con Wave 1

- **AssignMacrocycle · WeekPickerModal:** si el atleta destino tiene una competencia próxima (prioritaria), mostrar hint "Para picar en {comp} ({fecha}): S{S\*}" y **pre-seleccionar S\*** (por macro seleccionado, según su `total`). Sigue usando `buildMacroAssignment` + `updateMacro` de Wave 1.
- **TransitionSheet:** `suggestStartWeek` prefiere el S* alineado a la competencia si existe (en vez del proporcional al progreso).
- **CompetitionsCard:** CTA "Planificar hacia esta competencia" → abre AssignMacrocycle (o TransitionSheet) con el contexto de la comp.

## Componentes

1. **`data/competitions.ts`** — tipos + persistencia sessionStorage + helpers puros (`weeksBetween`, `nextCompetition`, `planToward`, `alignment`). Sin data inventada.
2. **`context/CompetitionContext.tsx`** — estado de competencias + `addCompetition` / `updateCompetition` / `removeCompetition` + persistencia; montado junto a `AthleteContext` en `App.tsx`. Hook `useCompetitions()`.
3. **`components/coach/CompetitionsCard.tsx`** (en `AthleteDeepDive`, cerca de "Macrociclo activo") — lista las competencias del atleta con countdown + insight de alineación + banderas en una mini-barra del macro; botón "＋ Agregar" y "Planificar hacia esta comp".
4. **`components/coach/AddCompetitionSheet.tsx`** — `BottomSheet` con form (nombre, fecha, nivel, objetivo, prioridad). Al guardar → persiste + refleja.
5. **`AssignMacrocycle.tsx` + `TransitionSheet.tsx`** — week-picker competition-aware (hint + pre-select S*).
6. **`AtletaHomeV2.tsx`** — el countdown de pico usa la próxima competencia real si existe ("🏆 {comp} en N sem"), con fallback al pico estructural (`round(total·0.7)`). Mismo patrón "se refleja en el atleta" de Wave 1.

## Flujo de datos

```
Coach (AthleteDeepDive)
  → CompetitionsCard "Agregar" → AddCompetitionSheet → addCompetition()
     → CompetitionContext (estado + sessionStorage 'ho:competitions')
  → alignment(comp, athlete, today) → insight + banderas en timeline
  → "Planificar hacia esta comp" → AssignMacrocycle/TransitionSheet (pre-select S*)
     → updateMacro() (Wave 1) → roster muta + persiste
Atleta (AtletaHomeV2)
  → nextCompetition(athleteId, today) → countdown "🏆 {comp} en N sem"
```

## Manejo de errores / edge cases

- Sin competencias para el atleta → CompetitionsCard muestra estado vacío + "Agregar". Home usa fallback estructural.
- Fecha de comp en el pasado → `status: past`, se muestra atenuada (no rompe el countdown; `nextCompetition` la ignora).
- `total_weeks = 0` o atleta sin macro → no se computa alineación; CompetitionsCard muestra la comp + countdown, sin insight de pico (CTA "Asignar macro primero").
- `macroWeekAtComp` fuera de `[1, total]` → se reporta `early`/`late` con el delta, sin crashear.
- sessionStorage no disponible → CRUD en memoria (try/catch silencioso, igual que Wave 1).

## Verificación

- Build `tsc -b && vite build` limpio (atrapa unused).
- Preview: agendar competencia → ver insight de alineación + banderas → "Planificar hacia esta comp" pre-selecciona S* → home del atleta muestra el countdown real → persiste tras reload.
- Commit por ola + push (Render auto-deploya peakqual-v2).

## NO inventar

- Competencias = input del coach (no se seedean ficticias).
- Toda la matemática de fechas/picos deriva de `(hoy, semana actual, total_weeks)` reales del roster + curva del macro (`getMacroDetail`). Sin números mágicos de competencias.
