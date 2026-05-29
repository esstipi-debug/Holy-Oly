/**
 * macroTransition · asistente de transición de días/semana.
 *
 * Cuando un atleta quiere entrenar más (o menos) días, el coach necesita: (1)
 * macros AFINES a la nueva frecuencia — misma escuela primero, luego intensidad
 * cercana; (2) en qué semana arranca el macro nuevo — proporcional a su progreso
 * actual (continuar) o desde S1 (reiniciar). El coach decide con el week picker
 * (decisión del Boss). Todo deriva del catálogo canónico (macrocycles.ts).
 */
import { MACROCYCLES, type Macrocycle } from './macrocycles';

const parseFreq = (f: string): number => { const m = f.match(/\d+/); return m ? parseInt(m[0], 10) : 5; };
const parseWeeks = (d: string): number => { const m = d.match(/\d+/); return m ? parseInt(m[0], 10) : 12; };

export const macroFreq = (id: string): number => {
  const m = MACROCYCLES.find(x => x.id === id);
  return m ? parseFreq(m.frequency) : 0;
};
export const macroWeeks = (id: string): number => {
  const m = MACROCYCLES.find(x => x.id === id);
  return m ? parseWeeks(m.duration) : 12;
};

/** Frecuencias (días/sem) disponibles en el catálogo HO, distintas de la actual. */
export function availableTargetFreqs(currentId: string): number[] {
  const curFreq = macroFreq(currentId);
  return Array.from(new Set(MACROCYCLES.filter(m => m.product === 'holy-oly').map(m => parseFreq(m.frequency))))
    .filter(f => f !== curFreq)
    .sort((a, b) => a - b);
}

export interface AffineMacro {
  macro: Macrocycle;
  freq: number;
  weeks: number;
  sameFamily: boolean;
  reason: string;
}

/** Macros afines a la frecuencia objetivo: misma familia primero, luego intensidad cercana. */
export function affineMacros(currentId: string, targetFreq: number): AffineMacro[] {
  const cur = MACROCYCLES.find(m => m.id === currentId);
  const pool = MACROCYCLES.filter(
    m => m.product === 'holy-oly' && m.id !== currentId && parseFreq(m.frequency) === targetFreq,
  );
  return pool
    .map(m => {
      const sameFamily = !!cur && m.family === cur.family;
      const intDiff = cur ? Math.abs(m.intensity - cur.intensity) : 0;
      const score = (sameFamily ? 100 : 0) - intDiff * 5;
      const reason = sameFamily
        ? `Misma escuela (${m.family}) · continuidad técnica`
        : `Escuela ${m.family} · intensidad similar (${m.intensity}/5)`;
      return { macro: m, freq: targetFreq, weeks: parseWeeks(m.duration), sameFamily, reason, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...rest }) => rest);
}

/** Semana de arranque sugerida al CONTINUAR: proporcional al progreso actual. */
export function suggestStartWeek(currentWeek: number, currentTotal: number, targetTotal: number): number {
  if (currentTotal <= 0) return 1;
  const pct = Math.min(1, Math.max(0, currentWeek / currentTotal));
  return Math.max(1, Math.min(targetTotal, Math.round(pct * targetTotal)));
}
