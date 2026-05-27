/**
 * WODs API · Fase 2 refactor API-first
 *
 * Cliente para /v1/wods/* · reemplaza:
 * - mock `BENCHMARKS` en data/wodResults.ts
 * - mock `BENCHMARKS` con tiempos hardcoded en VoltaStats.tsx
 * - mock `WOD` en VoltaActiveWod.tsx
 */
import { api } from './api';

// ---------------------------------------------------------------------------
// Types (espejo de los Pydantic models del backend)
// ---------------------------------------------------------------------------

export type ScoreType = 'time' | 'rounds_reps' | 'reps' | 'weight';
export type BetterWhen = 'lower' | 'higher';

export interface BenchmarkRef {
  id: string;
  name: string;
  score_type: ScoreType;
  better_when: BetterWhen;
  description: string;
  rx_standard: string;
}

export interface BenchmarkWithMyBest extends BenchmarkRef {
  my_best_value: number | null;
  my_best_rx: 'rx' | 'scaled' | null;
  my_best_at: string | null;
  my_previous_value: number | null;
}

export interface TodayWodMovement {
  name: string;
  scaling?: { rx?: string; scaled?: string; beginner?: string };
  tag?: string;
}

export interface TodayWod {
  source: 'custom' | 'engine' | 'none';
  title?: string;
  type?: string;
  duration_sec?: number;
  movements: TodayWodMovement[];
  intensity_target?: string;
  notes?: string;
  benchmark_id?: string;
}

export interface HistoryEntry {
  id: string;
  wod_name: string;
  rx_or_scaled: string;
  score_type: string;
  score_value: number;
  is_pr: boolean;
  completed_at: string;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const wodsApi = {
  benchmarks: () => api.get<BenchmarkWithMyBest[]>('/v1/wods/benchmarks'),
  today:      () => api.get<TodayWod>('/v1/wods/today'),
  myHistory:  (limit = 50) => api.get<HistoryEntry[]>(`/v1/wods/me/history?limit=${limit}`),
};

// ---------------------------------------------------------------------------
// Formatters (puro UI · no van al backend)
// ---------------------------------------------------------------------------

/** Formatea score según tipo · 285s → "4:45" · 1250 → "1+250" para rounds_reps */
export function formatScore(value: number, type: ScoreType): string {
  if (type === 'time') {
    const min = Math.floor(value / 60);
    const sec = Math.round(value % 60);
    return `${min}:${String(sec).padStart(2, '0')}`;
  }
  if (type === 'rounds_reps') {
    // Convención: rounds*1000 + reps (ver migration 006_wod_results.sql)
    const rounds = Math.floor(value / 1000);
    const reps = Math.round(value % 1000);
    return `${rounds}+${reps}`;
  }
  return String(Math.round(value));
}

/** Delta entre best y previous · "-33s" o "+3 rondas" · null si no hay previous */
export function formatDelta(
  best: number | null,
  previous: number | null,
  type: ScoreType,
  betterWhen: BetterWhen,
): string | null {
  if (best == null || previous == null) return null;
  const diff = best - previous;
  if (diff === 0) return '=';
  const improved = (betterWhen === 'lower' && diff < 0) || (betterWhen === 'higher' && diff > 0);
  const sign = diff > 0 ? '+' : '';
  if (type === 'time') {
    return `${improved ? '↓' : '↑'}${sign}${Math.round(diff)}s`;
  }
  if (type === 'rounds_reps') {
    const rounds = diff / 1000;
    return `${improved ? '+' : ''}${rounds.toFixed(1)} rondas`;
  }
  return `${sign}${Math.round(diff)}`;
}
