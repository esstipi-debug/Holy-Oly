# Recomendador de macrociclos client-side — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que el panel WISE de AssignMacrocycle proponga macros recomendados client-side (en demo) según el perfil de 1RM, mostrados aparte + elección libre (spec 2026-05-29-macro-recommender-design.md).

**Architecture:** Lógica pura `data/macroRecommender.ts` (nivel + debilidades → `MacroSuggestResponse`, mismo shape que el backend) usada como fallback en AssignMacrocycle cuando `trySuggestMacrosFor` da null. Se agrega a Freddy Perdomo al roster real. Reusa el panel WISE existente sin tocar su UI.

**Tech Stack:** React 19 + Vite + TS. Sin test runner → **verificación = `cd frontend && npm run build` + preview**. NO inventar (24 macros reales, 1RM reales de Freddy).

> Worktree: `C:/Users/Gamer/Desktop/Holy Oly 001/.claude/worktrees/compassionate-rhodes-7d48f8` · rutas relativas a `frontend/src/`.

---

## File structure

- **Modify** `data/athletes.ts` — extender `AthleteMaxes` (halones opcionales) + agregar a Freddy Perdomo.
- **Create** `data/macroRecommender.ts` — `athleteLevel` + `recommendMacros` + `macroFocus` (puro).
- **Modify** `pages/AssignMacrocycle.tsx` — fallback client-side en el effect de sugerencias.

---

## Task 1: AthleteMaxes + Freddy Perdomo

**Files:** Modify `frontend/src/data/athletes.ts`

- [ ] **Step 1: Extender AthleteMaxes** (líneas 14-21)

```ts
export interface AthleteMaxes {
  snatch: number;
  clean: number;
  jerk: number;
  back_squat: number;
  front_squat: number;
  body_weight: number;
  snatch_pull?: number;   // halón de arranque (opcional · no todos lo registran)
  clean_pull?: number;    // halón de envión (opcional)
}
```

- [ ] **Step 2: Agregar a Freddy** — insertar el objeto antes del cierre `];` del array `athletes` (queda como último; el persona demo sigue siendo el primer HO):

Reemplazar:
```ts
  },
];

// Mapa rápido email → perfil
```
por:
```ts
  },
  {
    id: 'ath_freddy',
    email: 'freddy.perdomo@demo.com',
    password: '',
    name: 'Freddy Perdomo',
    age: 0,
    gender: 'M',
    weight_class: '—',
    club: 'Sin asignar',
    province: 'Sin asignar',
    coach_id: 'coach_001',
    role: 'athlete',
    subscription: 'FREE',
    macrocycle: { program_id: '', program_name: 'Sin asignar', week: 0, day: 0, total_weeks: 0, focus: 'Por definir' },
    maxes: { snatch: 127, clean: 165, jerk: 165, back_squat: 230, front_squat: 0, body_weight: 0, snatch_pull: 130, clean_pull: 170 },
    injuries: [],
    sessions_last_7: [],
    prior_fitness: 50,
    prior_fatigue: 30,
  },
];

// Mapa rápido email → perfil
```

- [ ] **Step 3: Build** — `cd frontend && npm run build` → PASS.

---

## Task 2: `data/macroRecommender.ts`

**Files:** Create `frontend/src/data/macroRecommender.ts`

- [ ] **Step 1: Escribir el módulo**

```ts
import type { AthleteProfile, AthleteMaxes } from './athletes';
import { MACROCYCLES, type Macrocycle } from './macrocycles';
import type { MacroSuggestResponse, MacroSuggestionItem } from '../lib/macrocycleApi';

/**
 * Recomendador de macrociclos CLIENT-SIDE (funciona en demo, sin backend).
 * Scorea los 24 macros reales por nivel (total olímpico) + debilidades (ratios
 * arranque/envión, halones, cuclilla). NO inventa: sólo data real del catálogo + 1RM.
 */
export type AthleteLevel = 'novato' | 'intermedio' | 'avanzado' | 'elite';

const LEVEL_LABEL: Record<AthleteLevel, string> = {
  novato: 'Novato', intermedio: 'Intermedio', avanzado: 'Avanzado', elite: 'Elite',
};
const LEVEL_TARGET: Record<AthleteLevel, number> = { novato: 2, intermedio: 3, avanzado: 4, elite: 4.5 };

export function athleteLevel(maxes: AthleteMaxes): AthleteLevel {
  const total = (maxes.snatch || 0) + (maxes.clean || 0);
  if (total >= 260) return 'elite';
  if (total >= 200) return 'avanzado';
  if (total >= 120) return 'intermedio';
  return 'novato';
}

const parseFreqN = (f: string): number => { const m = f.match(/\d+/); return m ? parseInt(m[0], 10) : 5; };
const parseWeeksN = (d: string): number => { const m = d.match(/\d+/); return m ? parseInt(m[0], 10) : 12; };

function macroFocus(m: Macrocycle): string {
  if (m.family === 'Chino' || m.family === 'Coreano') return 'Técnica';
  if (m.family === 'Búlgaro') return 'Intensidad';
  if (/novicio|principiante/i.test(m.id)) return 'Base';
  if (/competidor|avanzado|polaco/i.test(m.id) || (m.intensity >= 5 && m.volume <= 2)) return 'Peaking';
  if (m.volume >= 5) return 'Volumen';
  return 'Fuerza';
}

interface Scored { macro: Macrocycle; score: number; reasons: string[]; }

export function recommendMacros(athlete: AthleteProfile, limit = 3): MacroSuggestResponse {
  const maxes = athlete.maxes;
  const level = athleteLevel(maxes);
  const target = LEVEL_TARGET[level];
  const snatch = maxes.snatch || 0, clean = maxes.clean || 0, jerk = maxes.jerk || 0;
  const total = snatch + clean;
  const snatchRatio = clean > 0 ? snatch / clean : 0;
  const spRatio = maxes.snatch_pull && snatch > 0 ? maxes.snatch_pull / snatch : null;
  const cpRatio = maxes.clean_pull && clean > 0 ? maxes.clean_pull / clean : null;
  const squatRatio = clean > 0 ? maxes.back_squat / clean : 0;

  const scored: Scored[] = MACROCYCLES.filter(m => m.product === 'holy-oly').map(m => {
    const reasons: string[] = [`Nivel ${LEVEL_LABEL[level]} → intensidad objetivo ${target}/5`];
    let levelScore = 1 - Math.abs(m.intensity - target) / 4;
    if ((level === 'avanzado' || level === 'elite') && m.intensity <= 2) levelScore *= 0.3;
    if (level === 'novato' && m.intensity >= 5) levelScore *= 0.3;

    let bonus = 0;
    const techFamily = m.family === 'Chino' || m.family === 'Coreano';
    if (snatchRatio > 0 && snatchRatio < 0.78 && techFamily) {
      bonus += 0.25; reasons.push(`Arranque ${Math.round(snatchRatio * 100)}% del envión (bajo) → foco técnica de arranque`);
    }
    if (((spRatio !== null && spRatio < 1.05) || (cpRatio !== null && cpRatio < 1.05)) && techFamily) {
      bonus += 0.25; reasons.push('Tirones poco cargados → énfasis en pulls');
    }
    if (jerk > 0 && clean > 0 && jerk < clean && m.family === 'Colombiano') {
      bonus += 0.2; reasons.push('Envión/jerk a reforzar → escuela con foco overhead');
    }
    if (squatRatio > 1.35) {
      if (techFamily) { bonus += 0.15; reasons.push('Pierna muy fuerte → transferir a técnica'); }
      else if (m.volume >= 5) bonus -= 0.1;
    }
    const score = Math.max(0, Math.min(1, 0.6 * levelScore + 0.4 * Math.min(1, bonus)));
    return { macro: m, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit);

  const suggestions: MacroSuggestionItem[] = top.map(s => ({
    macro_id: s.macro.id,
    macro_name: s.macro.name,
    school: s.macro.family,
    focus: macroFocus(s.macro),
    duration_weeks: parseWeeksN(s.macro.duration),
    sessions_per_week: parseFreqN(s.macro.frequency),
    difficulty: s.macro.intensity,
    score: s.score,
    reasoning: s.reasons.join(' · '),
    estimated_difficulty: LEVEL_LABEL[level],
    estimated_weeks: parseWeeksN(s.macro.duration),
  }));

  const weakNote = snatchRatio > 0 && snatchRatio < 0.78 ? ' · arranque a mejorar'
    : (spRatio !== null && spRatio < 1.05) || (cpRatio !== null && cpRatio < 1.05) ? ' · tirones a cargar'
    : '';
  return {
    suggestions,
    rationale: `Recomendado por tu perfil (nivel ${LEVEL_LABEL[level]} · total ${total}kg${weakNote}).`,
    athlete_level: LEVEL_LABEL[level],
    goal: 'auto',
    inputs_used: { total, snatch_ratio: Math.round(snatchRatio * 100) / 100, level },
  };
}
```

- [ ] **Step 2: Build** — `cd frontend && npm run build` → PASS (verifica que el shape `MacroSuggestionItem`/`MacroSuggestResponse` matchee `lib/macrocycleApi.ts`).

---

## Task 3: Fallback client-side en AssignMacrocycle

**Files:** Modify `frontend/src/pages/AssignMacrocycle.tsx`

- [ ] **Step 1: Importar el recomendador** (junto a los imports de data)

```tsx
import { recommendMacros } from '../data/macroRecommender';
```

- [ ] **Step 2: Usar como fallback** — en el effect de sugerencias, reemplazar:

```tsx
      const res = await trySuggestMacrosFor(target.id);
      if (cancelled) return;
      setSuggestions(res);
```
por:
```tsx
      const res = await trySuggestMacrosFor(target.id);
      if (cancelled) return;
      setSuggestions(res ?? recommendMacros(target));
```

- [ ] **Step 3: Build + preview**

Run: `cd frontend && npm run build` → PASS.
Preview (`?demo=1` → Coach HO → roster incluye a **Freddy Perdomo** → tap su card → deep-dive → "Cambiar macro" / o FAB "Asignar"): el panel **WISE "sugiere para Freddy"** muestra **top-3 reales** con razones (Chino 5D / Coreano 5D / Coreano 6D arriba, con "Arranque 77%… → técnica", "Tirones poco cargados → pulls"). "Asignar este macro" selecciona; "Ver todos" abre el catálogo (elección libre). Probar también un atleta existente (otro nivel) → recomendaciones distintas.

- [ ] **Step 4: Commit + push**

```bash
git add frontend/src/data/athletes.ts frontend/src/data/macroRecommender.ts frontend/src/pages/AssignMacrocycle.tsx
git commit -m "feat(coach): recomendador de macrociclos client-side + Freddy Perdomo"
git push origin feat/api-first-refactor
```

---

## Notas de verificación

- Build limpio en cada task.
- El recomendador es determinístico: Freddy (elite, arranque 77%, halones <105%, pierna fuerte) → Chino/Coreano arriba.
- Edge: atleta sin 1RM (maxes 0) → novato → recomienda novicios. Sin divide-by-zero (guardas en ratios).
- NO inventar: 24 macros reales + 1RM reales de Freddy; nivel = heurístico documentado.
