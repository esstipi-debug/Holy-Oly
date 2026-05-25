/**
 * Baseline / Tests de Referencia.
 *
 * Esta data es la base sobre la que se calculan cargas (%1RM) y volúmenes
 * personalizados de cada entrenamiento. Completar el assessment desbloquea
 * la personalización fina del programa.
 *
 * Persistencia: localStorage `baseline:results` → Record<testId, BaselineResult>.
 */

export type BaselineCategoryId =
  | 'vo2max'
  | 'olympic'
  | 'power'
  | 'squats'
  | 'deadlift'
  | 'gymnastics';

export interface BaselineCategory {
  id: BaselineCategoryId;
  name: string;
  icon: string;
  color: string;
  blurb: string;
  /** Qué se desbloquea / ajusta cuando se completa */
  unlocks: string;
}

export type TestUnit = 'kg' | 'reps' | 'seconds' | 'cm' | 'meters' | 'ml/kg/min';

export interface BaselineTest {
  id: string;
  category: BaselineCategoryId;
  name: string;
  /** Descripción corta del protocolo */
  protocol: string;
  unit: TestUnit;
  /** Cuál es la "buena" dirección — higher o lower better */
  betterWhen: 'higher' | 'lower';
  /** Repetir cada N días sugerido */
  retestDays: number;
  /** Referencia opcional (umbral RX, élite, etc.) */
  reference?: string;
}

export interface BaselineResult {
  value: number;
  unit: TestUnit;
  /** ISO date */
  date: string;
}

export const CATEGORIES: BaselineCategory[] = [
  {
    id: 'vo2max',
    name: 'VO₂max · Engine',
    icon: '🫁',
    color: '#56CCF2',
    blurb: 'Capacidad aeróbica y umbral metabólico',
    unlocks: 'Personaliza intervalos, zonas cardio y duración de WODs',
  },
  {
    id: 'olympic',
    name: 'Olímpicos',
    icon: '🏋️',
    color: '#F5C518',
    blurb: '1RM de movimientos olímpicos',
    unlocks: 'Calibra cargas en complejos olímpicos y técnica',
  },
  {
    id: 'power',
    name: 'Power · Explosividad',
    icon: '⚡',
    color: '#FF6B35',
    blurb: 'Producción de fuerza explosiva',
    unlocks: 'Ajusta volumen de plyometrics y descansos en CrossFit',
  },
  {
    id: 'squats',
    name: 'Squats',
    icon: '🦵',
    color: '#7C5CFF',
    blurb: '1RM de variantes de sentadilla',
    unlocks: 'Selecciona %1RM correcto en accesorios y sentadillas',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    icon: '🔥',
    color: '#A855F7',
    blurb: '1RM peso muerto',
    unlocks: 'Ajusta tonelaje pull semanal y trabajo de cadena posterior',
  },
  {
    id: 'gymnastics',
    name: 'Gimnasia',
    icon: '🤸',
    color: '#22C55E',
    blurb: 'Max reps unbroken y skills',
    unlocks: 'Escala reps de gimnasia en WODs y selecciona skill work',
  },
];

export const TESTS: BaselineTest[] = [
  // VO2max / Engine
  { id: 'row_2k',         category: 'vo2max', name: '2K Row',                protocol: 'Tiempo total en remo 2000m all-out',                  unit: 'seconds',     betterWhen: 'lower',  retestDays: 60, reference: 'RX <7:30 · Élite <6:50' },
  { id: 'run_1mile',      category: 'vo2max', name: '1 Milla Run',           protocol: 'Tiempo total 1609m en pista o asfalto',               unit: 'seconds',     betterWhen: 'lower',  retestDays: 60, reference: 'RX <7:00' },
  { id: 'assault_1min',   category: 'vo2max', name: 'Assault Bike 1\'',      protocol: 'Calorías máximas en 60 segundos',                     unit: 'reps',        betterWhen: 'higher', retestDays: 30, reference: 'RX ♂ 30+ cal · ♀ 22+' },
  { id: 'cooper_12min',   category: 'vo2max', name: 'Cooper 12\'',           protocol: 'Distancia total corriendo 12 minutos',                unit: 'meters',      betterWhen: 'higher', retestDays: 90, reference: 'RX 2400m+ · Élite 2800m+' },
  { id: 'vo2_estimate',   category: 'vo2max', name: 'VO₂max estimado',       protocol: 'Resultado de test Cooper, Astrand u otro lab',         unit: 'ml/kg/min',   betterWhen: 'higher', retestDays: 180, reference: 'RX 45+ · Élite 55+' },

  // Olympic
  { id: 'snatch_1rm',     category: 'olympic', name: 'Snatch',               protocol: '1RM Snatch técnico (squat snatch)',                    unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'cj_1rm',         category: 'olympic', name: 'Clean & Jerk',         protocol: '1RM Clean & Jerk completo',                            unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'power_snatch',   category: 'olympic', name: 'Power Snatch',         protocol: '1RM Power Snatch (sin squat completo)',                unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'power_clean',    category: 'olympic', name: 'Power Clean',          protocol: '1RM Power Clean',                                      unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'hang_snatch',    category: 'olympic', name: 'Hang Snatch',          protocol: '1RM Hang Snatch desde rodilla',                        unit: 'kg', betterWhen: 'higher', retestDays: 42 },
  { id: 'push_jerk',      category: 'olympic', name: 'Push Jerk',            protocol: '1RM Push Jerk',                                        unit: 'kg', betterWhen: 'higher', retestDays: 42 },

  // Power
  { id: 'vertical_jump',  category: 'power', name: 'Vertical Jump',          protocol: 'Salto vertical sin envión — diferencia altura',        unit: 'cm', betterWhen: 'higher', retestDays: 30, reference: 'RX 55cm+ · Élite 70cm+' },
  { id: 'broad_jump',     category: 'power', name: 'Broad Jump',             protocol: 'Salto largo desde parado',                             unit: 'cm', betterWhen: 'higher', retestDays: 30, reference: 'RX 230cm+ · Élite 280cm+' },
  { id: 'max_box_jump',   category: 'power', name: 'Max Box Jump',           protocol: 'Altura máxima de caja a la que llegás de salto',       unit: 'cm', betterWhen: 'higher', retestDays: 45, reference: 'RX 120cm+' },
  { id: 'sprint_30m',     category: 'power', name: 'Sprint 30m',             protocol: 'Tiempo total en 30m all-out desde parado',             unit: 'seconds', betterWhen: 'lower', retestDays: 45, reference: 'RX <4.5s' },
  { id: 'max_med_throw',  category: 'power', name: 'Med Ball Throw',         protocol: 'Distancia máxima — med ball 9kg desde pecho',          unit: 'meters', betterWhen: 'higher', retestDays: 45 },

  // Squats
  { id: 'back_squat',     category: 'squats', name: 'Back Squat',            protocol: '1RM Back Squat (bajo paralela)',                       unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'front_squat',    category: 'squats', name: 'Front Squat',           protocol: '1RM Front Squat',                                      unit: 'kg', betterWhen: 'higher', retestDays: 28 },
  { id: 'overhead_squat', category: 'squats', name: 'Overhead Squat',        protocol: '1RM Overhead Squat',                                   unit: 'kg', betterWhen: 'higher', retestDays: 42 },

  // Deadlift
  { id: 'conv_dl',        category: 'deadlift', name: 'Conv. Deadlift',      protocol: '1RM Deadlift convencional',                            unit: 'kg', betterWhen: 'higher', retestDays: 42 },
  { id: 'sumo_dl',        category: 'deadlift', name: 'Sumo Deadlift',       protocol: '1RM Sumo Deadlift',                                    unit: 'kg', betterWhen: 'higher', retestDays: 42 },
  { id: 'rdl_5rm',        category: 'deadlift', name: 'RDL 5RM',             protocol: '5RM Romanian Deadlift',                                unit: 'kg', betterWhen: 'higher', retestDays: 42 },

  // Gymnastics
  { id: 'strict_pullup',  category: 'gymnastics', name: 'Strict Pull-ups',   protocol: 'Max reps unbroken sin kipping',                        unit: 'reps', betterWhen: 'higher', retestDays: 28, reference: 'RX ♂ 10+ · ♀ 5+' },
  { id: 'kipping_pullup', category: 'gymnastics', name: 'Kipping Pull-ups',  protocol: 'Max reps unbroken con kipping',                        unit: 'reps', betterWhen: 'higher', retestDays: 28 },
  { id: 'hspu',           category: 'gymnastics', name: 'Strict HSPU',       protocol: 'Max reps Strict HSPU contra pared',                    unit: 'reps', betterWhen: 'higher', retestDays: 28 },
  { id: 'muscle_up',      category: 'gymnastics', name: 'Ring Muscle-ups',   protocol: 'Max reps unbroken ring muscle-ups',                    unit: 'reps', betterWhen: 'higher', retestDays: 28 },
  { id: 't2b',            category: 'gymnastics', name: 'Toes-to-Bar',       protocol: 'Max reps unbroken T2B',                                unit: 'reps', betterWhen: 'higher', retestDays: 21 },
  { id: 'double_under',   category: 'gymnastics', name: 'Double Unders',     protocol: 'Max consecutivos sin fallar',                          unit: 'reps', betterWhen: 'higher', retestDays: 21, reference: 'RX 50+ · Élite 200+' },
];

/* ------------------------------------------------------------------ */
/* API de persistencia + cálculo                                       */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'baseline:results';

export function loadResults(): Record<string, BaselineResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveResult(testId: string, result: BaselineResult): void {
  const all = loadResults();
  all[testId] = result;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteResult(testId: string): void {
  const all = loadResults();
  delete all[testId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export interface CategoryProgress {
  category: BaselineCategory;
  done: number;
  total: number;
  pct: number;
}

export function categoryProgress(results: Record<string, BaselineResult>): CategoryProgress[] {
  return CATEGORIES.map(cat => {
    const tests = TESTS.filter(t => t.category === cat.id);
    const done = tests.filter(t => results[t.id]).length;
    return { category: cat, done, total: tests.length, pct: Math.round((done / tests.length) * 100) };
  });
}

export function overallProgress(results: Record<string, BaselineResult>): { done: number; total: number; pct: number } {
  const done = Object.keys(results).filter(id => TESTS.find(t => t.id === id)).length;
  const total = TESTS.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

/** Tier de personalización desbloqueado según % de tests completados */
export function personalizationTier(pct: number): { tier: 0 | 1 | 2 | 3; label: string; perk: string } {
  if (pct >= 100) return { tier: 3, label: 'Plan Inteligente', perk: 'Cargas y volumen 100% personalizados · ajuste semana a semana' };
  if (pct >= 60)  return { tier: 2, label: 'Cargas Personalizadas', perk: '%1RM y zonas calculadas con tu data real' };
  if (pct >= 25)  return { tier: 1, label: 'Calibración Básica', perk: 'Cargas en olímpicos y squats ajustadas' };
  return { tier: 0, label: 'Plantilla Genérica', perk: 'Completá 25% para empezar a personalizar' };
}

/** Formato display según unidad */
export function formatValue(value: number, unit: TestUnit): string {
  if (unit === 'seconds') {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  }
  if (unit === 'meters') return `${value}m`;
  if (unit === 'cm') return `${value}cm`;
  if (unit === 'kg') return `${value}kg`;
  if (unit === 'reps') return `${value}`;
  if (unit === 'ml/kg/min') return `${value}`;
  return String(value);
}
