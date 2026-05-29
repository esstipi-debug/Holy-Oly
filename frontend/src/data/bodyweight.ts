import type { AthleteProfile } from './athletes';
import type { Competition } from './competitions';
import { toDate } from './competitions';

/**
 * bodyweight · pesajes (input del coach/atleta) + gestión de categoría de peso.
 * NO inventa historial: el punto de arranque es el body_weight real del atleta; la
 * serie crece con pesajes registrados. Persiste en sessionStorage (patrón Wave 1/3).
 */
export interface WeighIn { id: string; athleteId: string; date: string; kg: number; }

const KEY = 'ho:weighins';
export function loadWeighIns(): WeighIn[] {
  try { const raw = sessionStorage.getItem(KEY); if (raw) return JSON.parse(raw) as WeighIn[]; } catch { /* ignore */ }
  return [];
}
export function saveWeighIns(list: WeighIn[]): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
export function weighInsFor(list: WeighIn[], athleteId: string): WeighIn[] {
  return list.filter(w => w.athleteId === athleteId).sort((a, b) => a.date.localeCompare(b.date));
}
export function latestWeight(list: WeighIn[], athlete: AthleteProfile): number {
  const own = weighInsFor(list, athlete.id);
  return own.length ? own[own.length - 1].kg : athlete.maxes.body_weight;
}
export function parseClassLimit(weightClass: string): number | null {
  const m = weightClass.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

const DAY = 86400000;
export type MakeWeightStatus = 'under' | 'on' | 'over' | 'no-class';
export interface MakeWeight {
  limit: number | null;
  current: number;
  delta: number;            // current − limit, redondeado 0.1
  daysToMeet: number | null;
  status: MakeWeightStatus;
  message: string;
}
export function makeWeight(athlete: AthleteProfile, nextComp: Competition | null, latestKg: number, today: Date): MakeWeight {
  const limit = parseClassLimit(athlete.weight_class);
  const current = Math.round(latestKg * 10) / 10;
  const daysToMeet = nextComp ? Math.max(0, Math.round((toDate(nextComp.date).getTime() - today.getTime()) / DAY)) : null;
  if (limit == null) {
    return { limit: null, current, delta: 0, daysToMeet, status: 'no-class', message: 'Categoría sin asignar' };
  }
  const delta = Math.round((current - limit) * 10) / 10;
  let status: MakeWeightStatus;
  let message: string;
  if (delta > 0.05) {
    status = 'over';
    message = nextComp ? `Bajar ${delta} kg para ${nextComp.name} · ${daysToMeet} días` : `${delta} kg sobre el límite (${limit}kg)`;
  } else if (delta < -0.05) {
    status = 'under';
    message = `${Math.abs(delta)} kg de margen · límite ${limit}kg`;
  } else {
    status = 'on';
    message = `En el límite (${limit}kg)`;
  }
  return { limit, current, delta, daysToMeet, status, message };
}
