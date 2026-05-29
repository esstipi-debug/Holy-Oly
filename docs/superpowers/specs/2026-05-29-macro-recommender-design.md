# Spec · Recomendador de macrociclos client-side (F1)

> Fecha: 2026-05-29 · branch `feat/api-first-refactor`. Feature 1 de 2 (la otra: UI mujeres, después).

## Objetivo

Que el sistema PROPONGA macrociclos recomendados para un atleta según su perfil de 1RM, los muestre **aparte** del catálogo, y el coach elija **libremente**. Debe funcionar en **demo** (sin backend). Caso de prueba: **Freddy Perdomo** (1RM reales, sin peso).

## Decisiones del Boss

- Recomendador **client-side** (el panel WISE de AssignMacrocycle hoy usa backend → vacío en demo).
- Scoring por **nivel + debilidades** (enfoque A), determinístico y transparente.
- Agregar a **Freddy Perdomo** con sus 1RM reales, **categoría '—' / sin peso** (nivel por total).
- Recomendados **aparte** (reusar el panel WISE, ya separado del catálogo) + elección libre.
- Fuera de alcance: selector de objetivo manual (YAGNI); UI mujeres (F2).
- **NO inventar:** scoring sobre los 24 macros reales (`data/macrocycles.ts`); 1RM de Freddy reales.

## Modelo de datos

Extender `AthleteMaxes` (`data/athletes.ts`) con halones opcionales (no todos los atletas los tienen):

```ts
export interface AthleteMaxes {
  snatch: number; clean: number; jerk: number;
  back_squat: number; front_squat: number; body_weight: number;
  snatch_pull?: number;   // halón de arranque (opcional)
  clean_pull?: number;    // halón de envión (opcional)
}
```

**Freddy Perdomo** (nuevo en `athletes`): id `ath_freddy`, gender 'M', age 0 (desconocido), `weight_class: '—'`, club 'Sin asignar', `macrocycle` sin asignar (program_id ''), `maxes: { snatch:127, clean:165, jerk:165, back_squat:230, front_squat:0, body_weight:0, snatch_pull:130, clean_pull:170 }`, `sessions_last_7: []`, subscription 'FREE'. (front_squat/body_weight/age = 0 → desconocidos, no inventados.)

## Lógica (`data/macroRecommender.ts`, pura)

```ts
export type AthleteLevel = 'novato' | 'intermedio' | 'avanzado' | 'elite';

export function athleteLevel(maxes): AthleteLevel
// total = snatch + clean. Umbrales absolutos (heurístico; sin BW):
//   <120 novato · 120-199 intermedio · 200-259 avanzado · ≥260 elite.
//   (Nota: refinable con bodyweight/Sinclair a futuro.) Freddy 292 → elite.

export function recommendMacros(athlete, limit = 3): MacroSuggestResponse
```

**Scoring** por cada macro HO (`product==='holy-oly'`), `score ∈ [0,1]`:
- `levelScore = 1 − |macro.intensity − target| / 4`, con `target` por nivel: novato 2 · intermedio 3 · avanzado 4 · elite 4.5. Penalización dura: nivel avanzado/elite × macro.intensity≤2 → `levelScore *= 0.3`; nivel novato × intensity≥5 → `*= 0.3`.
- `weaknessBonus` (suma, cap 1.0; cada factor ~0.25), con su `reason`:
  - `snatchRatio = snatch/clean`; si `< 0.78` → +0.25 a familias **Chino/Coreano** → reason "Arranque {pct}% del envión (bajo) → foco técnica de arranque".
  - halones (si presentes): `snatch_pull/snatch` o `clean_pull/clean` `< 1.05` → +0.25 a **Coreano/Chino** → reason "Tirones poco cargados → énfasis en pulls".
  - `jerk < clean` → +0.2 a **Colombiano** → reason "Envión/jerk a reforzar → escuela con foco overhead".
  - `back_squat/clean > 1.35` → +0.15 a **Chino/Coreano**, −0.1 a alto volumen (Ruso) → reason "Pierna muy fuerte → transferir a técnica".
- `score = clamp(0,1, 0.6*levelScore + 0.4*weaknessBonus)`.
- `reasons[]` siempre incluye un motivo de nivel ("Nivel {level} → intensidad {target}/5").

Ordenar desc, tomar `limit` (3). Mapear a `MacroSuggestionItem` (shape del backend, ver `lib/macrocycleApi.ts`): `{ macro_id, macro_name, school: family, focus: macroFocus(macro), duration_weeks: parseWeeks(duration), sessions_per_week: parseFreq(frequency), difficulty: intensity, score, reasoning: reasons.join(' · '), estimated_difficulty: level, estimated_weeks }`. Devolver `MacroSuggestResponse { suggestions, rationale, athlete_level: level, goal: 'auto', inputs_used }`.

`macroFocus(macro)`: heurístico legible — Chino/Coreano → 'Técnica' · Polaco/USA Avanzado/Cubano Competidor → 'Peaking' · Ruso/Cubano Avanzado → 'Volumen' · Búlgaro → 'Intensidad' · novicios → 'Base' · resto → 'Fuerza'.

## Integración UI (`AssignMacrocycle.tsx`)

En el effect de sugerencias: `const res = await trySuggestMacrosFor(target.id); setSuggestions(res ?? recommendMacros(target));`. El panel WISE existente ("WISE sugiere para {nombre}") renderiza los recomendados **sin cambios** (top-3 con score + reasoning + "Asignar este macro"), separado del catálogo ("Ver todos"). Sólo cambia el origen (client-side cuando el backend da null). El coach elige libre (catálogo completo disponible).

## Flujo

```
Coach → Asignar macro (Freddy seleccionado) → effect: backend null (demo) → recommendMacros(Freddy)
  → MacroSuggestResponse (top-3: Chino 5D, Coreano 5D, Cubano Avanzado…) con razones
  → panel WISE los muestra aparte → "Asignar este macro" o "Ver todos" (elección libre)
```

## Edge cases

- maxes en 0 (atleta sin 1RM) → nivel novato → recomienda novicios (Cubano Novicio, USA Principiante) con reason "Sin 1RM cargados → base técnica". Sin divide-by-zero (guardas en ratios).
- Sin halones → se omite el factor de pulls.
- `clean === 0` → snatchRatio se omite (sin recomendación de arranque).

## Verificación

- Build `tsc -b && vite build` limpio.
- Preview: roster incluye a Freddy → Asignar macro para Freddy → panel WISE muestra top-3 reales con razones coherentes (Chino/Coreano arriba) → elegir uno asigna (reusa Wave 1). Probar también un atleta existente (nivel intermedio) → recomendaciones distintas.
- Commit + push.

## NO inventar

- Scoring sobre los 24 macros reales. 1RM de Freddy reales (del xlsx). Campos desconocidos (peso/edad/front squat) = 0, no inventados. Umbrales de nivel = heurístico documentado, no data falsa.
