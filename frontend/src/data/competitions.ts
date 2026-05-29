import type { AthleteProfile } from './athletes';
import { getMacroDetail } from './macroDetail';

/**
 * competitions · calendario de competencias objetivo (input del coach) + lógica de
 * planificación de picos. NO inventa data: las competencias las carga el coach y
 * persisten en sessionStorage (mismo patrón que el override de macro de Wave 1).
 * Toda la matemática deriva de fechas/semanas reales del roster + curva del macro.
 */

export type CompetitionLevel = 'local' | 'nacional' | 'internacional';

export interface Competition {
  id: string;
  athleteId: string;
  name: string;
  date: string;            // 'YYYY-MM-DD'
  level?: CompetitionLevel;
  objective?: string;
  priority?: boolean;
}

const KEY = 'ho:competitions';

export function loadCompetitions(): Competition[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Competition[];
  } catch { /* ignore */ }
  return [];
}
export function saveCompetitions(list: Competition[]): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

const DAY = 86400000;
export function toDate(iso: string): Date { return new Date(iso + 'T00:00:00'); }
export function weeksBetween(today: Date, target: Date): number {
  return Math.round((target.getTime() - today.getTime()) / (7 * DAY));
}

export type Phase = 'ACUM' | 'INTENS' | 'REAL' | 'TEST' | 'POST';
const PHASE_LABEL: Record<Phase, string> = {
  ACUM: 'Acumulación', INTENS: 'Intensificación', REAL: 'Realización', TEST: 'Test/Pico', POST: 'Post-macro',
};
export function phaseLabel(p: Phase): string { return PHASE_LABEL[p]; }
export function phaseOfWeek(week: number, total: number): Phase {
  if (total <= 0) return 'ACUM';
  if (week > total) return 'POST';
  const pct = week / total;
  if (pct <= 0.4) return 'ACUM';
  if (pct <= 0.7) return 'INTENS';
  if (pct < 0.95) return 'REAL';
  return 'TEST';
}

export function competitionsFor(list: Competition[], athleteId: string): Competition[] {
  return list.filter(c => c.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));
}

export function nextCompetition(list: Competition[], athleteId: string, today: Date): Competition | null {
  const upcoming = competitionsFor(list, athleteId).filter(c => toDate(c.date).getTime() >= today.getTime());
  if (!upcoming.length) return null;
  const prio = upcoming.filter(c => c.priority);
  return prio[0] ?? upcoming[0];
}

export interface PlanResult {
  weeksUntil: number;
  suggestedStartWeek: number;
  realizationStart: number;
  fits: 'ok' | 'too-short' | 'too-soon';
}
export function planToward(macroTotalWeeks: number, compDate: string, today: Date): PlanResult {
  const total = Math.max(1, macroTotalWeeks);
  const weeksUntil = Math.max(0, weeksBetween(today, toDate(compDate)));
  const realizationStart = Math.max(1, Math.round(total * 0.7));
  const suggestedStartWeek = Math.max(1, Math.min(total, total - weeksUntil));
  let fits: PlanResult['fits'] = 'ok';
  if (weeksUntil > total - 1) fits = 'too-short';
  else if (suggestedStartWeek > realizationStart) fits = 'too-soon';
  return { weeksUntil, suggestedStartWeek, realizationStart, fits };
}

export interface Alignment {
  weeksUntil: number;
  compWeek: number;
  phase: Phase;
  status: 'on-peak' | 'early' | 'late' | 'past';
  suggestedStartWeek: number;
  message: string;
}
export function alignment(comp: Competition, athlete: AthleteProfile, today: Date): Alignment {
  const total = Math.max(1, athlete.macrocycle.total_weeks || getMacroDetail(athlete.macrocycle.program_id).duration);
  const current = Math.max(1, athlete.macrocycle.week || 1);
  const weeksUntil = weeksBetween(today, toDate(comp.date));
  const compWeek = current + weeksUntil;
  const realizationStart = Math.max(1, Math.round(total * 0.7));
  const phase = phaseOfWeek(compWeek, total);
  const suggestedStartWeek = Math.max(1, Math.min(total, total - weeksUntil));
  let status: Alignment['status'];
  let message: string;
  if (weeksUntil < 0) {
    status = 'past';
    message = `Competencia pasada (hace ${-weeksUntil} sem).`;
  } else if (compWeek >= realizationStart && compWeek <= total) {
    status = 'on-peak';
    message = `Cae en S${compWeek}/${total} (realización) · pica a tiempo ✓`;
  } else if (compWeek < realizationStart) {
    status = 'early';
    message = `Cae en S${compWeek}/${total} (${phaseLabel(phase)}), antes del pico S${total} → arrancá en S${suggestedStartWeek} o elegí un macro más corto.`;
  } else {
    status = 'late';
    message = `El macro termina ${compWeek - total} sem antes de la comp → quedás sin pico → elegí un macro más largo o reiniciá en S${suggestedStartWeek}.`;
  }
  return { weeksUntil, compWeek, phase, status, suggestedStartWeek, message };
}
