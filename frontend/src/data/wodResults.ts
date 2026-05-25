/**
 * WOD Results · log + persistencia + detección de PR.
 *
 * Cada WOD que el atleta completa se loggea acá. Detectamos automáticamente
 * si es PR contra benchmarks históricos para disparar el flow viral.
 *
 * Persistencia: localStorage `wod:results` → WodResult[].
 * Cuando el backend esté arriba, sync vía POST /v1/wod/results.
 */

export type WodScoreType = 'time' | 'rounds_reps' | 'max_load' | 'reps' | 'calories';
export type WodScale = 'Rx+' | 'Rx' | 'Scaled' | 'Beginner';

export interface WodResult {
  id: string;
  /** Nombre del WOD (Fran, Helen, AMRAP 20...) */
  name: string;
  /** Benchmark conocido? (Fran, Helen, etc.) */
  benchmark?: string;
  scoreType: WodScoreType;
  /** En segundos si scoreType='time', reps totales si rounds_reps, kg si max_load */
  scoreValue: number;
  /** Detalle visible: "7+18" para rounds+reps, "3:42" para time */
  scoreDisplay: string;
  scale: WodScale;
  notes?: string;
  /** ISO date */
  performedAt: string;
}

/**
 * Benchmarks conocidos · referencia para tiempos/scores típicos de cada nivel.
 * `betterWhen=lower` para WODs por tiempo, `higher` para AMRAP/reps.
 */
export interface BenchmarkRef {
  id: string;
  name: string;
  scoreType: WodScoreType;
  betterWhen: 'lower' | 'higher';
  description: string;
  rxStandard: string;
}

export const BENCHMARKS: BenchmarkRef[] = [
  { id: 'fran',  name: 'Fran',  scoreType: 'time',         betterWhen: 'lower',  description: '21-15-9 Thrusters (43kg) + Pull-ups', rxStandard: 'Sub 5:00' },
  { id: 'helen', name: 'Helen', scoreType: 'time',         betterWhen: 'lower',  description: '3 rondas · 400m Run + 21 KB Swings (24kg) + 12 Pull-ups', rxStandard: 'Sub 11:00' },
  { id: 'grace', name: 'Grace', scoreType: 'time',         betterWhen: 'lower',  description: '30 Clean & Jerks @ 60kg ♂ / 43kg ♀', rxStandard: 'Sub 5:00' },
  { id: 'isabel',name: 'Isabel',scoreType: 'time',         betterWhen: 'lower',  description: '30 Snatches @ 60kg ♂ / 43kg ♀', rxStandard: 'Sub 5:00' },
  { id: 'murph', name: 'Murph', scoreType: 'time',         betterWhen: 'lower',  description: '1mi Run + 100 PU + 200 Push-up + 300 Squat + 1mi Run', rxStandard: 'Sub 50:00' },
  { id: 'cindy', name: 'Cindy', scoreType: 'rounds_reps',  betterWhen: 'higher', description: 'AMRAP 20: 5 PU + 10 Push-up + 15 Squat', rxStandard: '20+ rondas' },
  { id: 'mary',  name: 'Mary',  scoreType: 'rounds_reps',  betterWhen: 'higher', description: 'AMRAP 20: 5 HSPU + 10 Pistols + 15 PU', rxStandard: '12+ rondas' },
  { id: 'fight_gone_bad', name: 'Fight Gone Bad', scoreType: 'reps', betterWhen: 'higher', description: '3 rondas · 5 ejercicios · 60s c/u + 60s rest', rxStandard: '300+ reps' },
];

const STORAGE_KEY = 'wod:results';

export function loadResults(): WodResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveResult(result: WodResult): void {
  const all = loadResults();
  all.unshift(result);  // más reciente primero
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 100)));  // cap a 100
}

/**
 * Devuelve el mejor resultado histórico para un benchmark, o null si no hay.
 */
export function getBestForBenchmark(benchmarkId: string): WodResult | null {
  const bench = BENCHMARKS.find(b => b.id === benchmarkId);
  if (!bench) return null;
  const results = loadResults().filter(r => r.benchmark === benchmarkId);
  if (results.length === 0) return null;
  return results.reduce((best, r) => {
    if (bench.betterWhen === 'lower') return r.scoreValue < best.scoreValue ? r : best;
    return r.scoreValue > best.scoreValue ? r : best;
  });
}

/**
 * ¿Es PR este resultado vs el histórico?
 * Devuelve { isPR, previousBest } para mostrar delta en SocialCard.
 */
export function detectPR(result: WodResult): { isPR: boolean; previousBest: WodResult | null; deltaDisplay: string | null } {
  if (!result.benchmark) return { isPR: false, previousBest: null, deltaDisplay: null };
  const bench = BENCHMARKS.find(b => b.id === result.benchmark);
  if (!bench) return { isPR: false, previousBest: null, deltaDisplay: null };

  // El "previousBest" es el mejor antes de este resultado (excluye el recién guardado)
  const previousResults = loadResults().filter(r => r.benchmark === result.benchmark && r.id !== result.id);
  if (previousResults.length === 0) {
    return { isPR: true, previousBest: null, deltaDisplay: 'primer registro' };
  }
  const previousBest = previousResults.reduce((best, r) => {
    if (bench.betterWhen === 'lower') return r.scoreValue < best.scoreValue ? r : best;
    return r.scoreValue > best.scoreValue ? r : best;
  });
  const isPR = bench.betterWhen === 'lower'
    ? result.scoreValue < previousBest.scoreValue
    : result.scoreValue > previousBest.scoreValue;
  const delta = Math.abs(result.scoreValue - previousBest.scoreValue);
  const deltaDisplay = bench.scoreType === 'time'
    ? `-${Math.round(delta)}s vs anterior`
    : `+${delta} vs anterior`;
  return { isPR, previousBest, deltaDisplay: isPR ? deltaDisplay : null };
}

/* -------------- Helpers de formato -------------- */

export function formatScore(scoreType: WodScoreType, scoreValue: number): string {
  if (scoreType === 'time') {
    const m = Math.floor(scoreValue / 60);
    const s = Math.round(scoreValue % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  if (scoreType === 'rounds_reps') {
    // Convención: scoreValue como N.rrr donde parte entera = rondas, decimal = reps
    const rounds = Math.floor(scoreValue / 1000);
    const reps = scoreValue % 1000;
    return `${rounds}+${reps}`;
  }
  if (scoreType === 'max_load') return `${scoreValue}kg`;
  if (scoreType === 'reps') return `${scoreValue} reps`;
  if (scoreType === 'calories') return `${scoreValue} cal`;
  return String(scoreValue);
}

/** Convierte rondas+reps a un valor numérico ordenable: rondas * 1000 + reps */
export function packRoundsReps(rounds: number, reps: number): number {
  return rounds * 1000 + reps;
}
