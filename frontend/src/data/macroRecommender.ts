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
