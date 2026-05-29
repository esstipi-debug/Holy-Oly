/**
 * sessionDetail · LA QUILLA del Coach HO (spec §3.1 / §5).
 *
 * El modelo de sesión del roster (AthleteSession.load) es un solo número → sin
 * desglose por ejercicio no hay IMR real. Este módulo GENERA, para cada atleta,
 * el detalle POR EJERCICIO de su semana (movimiento · sets · reps · %1RM · kg ·
 * tonelaje) a partir de fuentes REALES: el tipo de día de su macro (getWeekPlan)
 * + sus 1RM reales (athlete.maxes). Con eso calcula el IMR:
 *
 *     IMR_ejercicio = (peso medio / 1RM) × 100         (peso medio = tonelaje / reps)
 *     IMR_sesión    = Σ(IMR_ej × reps_ej) / Σ(reps_ej)  (cada lift vs su propio 1RM)
 *
 * Determinístico (seed por atleta+día): cada atleta lee distinto y estable.
 * Es la base del gráfico "IMR vs banda de fase" y del detalle de sesión/ejercicio.
 */
import type { AthleteMaxes, AthleteProfile } from './athletes';
import { getWeekPlan, type WeekPlanDay } from './macroDetail';
import { seeded } from './derive';

export interface ExerciseDetail {
  movement: string;          // 'Arrancada'
  sets: number;
  reps: number;              // por set
  pct: number;               // %1RM (redondeado)
  kg: number;                // peso de trabajo
  baseLift: string;          // lift de referencia (para el tooltip)
  base1RM: number;           // 1RM contra el que se mide
  tonnage: number;           // sets × reps × kg
  imr: number;               // kg / 1RM × 100
}

export interface SessionDetail {
  dow: string;               // 'LUN'…'DOM'
  type: WeekPlanDay['type'];
  label: string;             // 'Intensidad · Clásicos'
  rest: boolean;
  exercises: ExerciseDetail[];
  totalTonnage: number;      // kg
  totalReps: number;
  imr: number;               // IMR de sesión (0 si descanso)
  rpe: string;
  dur: number;               // minutos
}

// Plantilla de ejercicios por tipo de día. `base` resuelve el 1RM real del lift.
// C&J = min(clean, jerk) (hay que hacer ambos). Los tirones miden vs el clásico.
interface ExTemplate { mv: string; lift: string; base: (m: AthleteMaxes) => number; sets: number; reps: number; pct: number }
const cj = (m: AthleteMaxes) => Math.min(m.clean || 0, m.jerk || 0) || Math.max(m.clean || 0, m.jerk || 0);

const TEMPLATES: Record<WeekPlanDay['type'], ExTemplate[]> = {
  int: [
    { mv: 'Arrancada',          lift: 'Snatch',    base: m => m.snatch,      sets: 5, reps: 2, pct: 85 },
    { mv: 'Cargada + Envión',   lift: 'C&J',       base: cj,                 sets: 4, reps: 1, pct: 88 },
    { mv: 'Sentadilla Atrás',   lift: 'Back Squat',base: m => m.back_squat,  sets: 3, reps: 2, pct: 90 },
  ],
  med: [
    { mv: 'Arrancada colgada',  lift: 'Snatch',    base: m => m.snatch,      sets: 4, reps: 3, pct: 72 },
    { mv: 'Sentadilla Frontal', lift: 'Front Squat',base: m => m.front_squat,sets: 4, reps: 4, pct: 80 },
    { mv: 'Cargada de potencia',lift: 'Clean',     base: m => m.clean,       sets: 4, reps: 2, pct: 75 },
  ],
  vol: [
    { mv: 'Arrancada muscular', lift: 'Snatch',    base: m => m.snatch,      sets: 4, reps: 4, pct: 60 },
    { mv: 'Sentadilla Atrás',   lift: 'Back Squat',base: m => m.back_squat,  sets: 5, reps: 5, pct: 70 },
    { mv: 'Tirón de arranque',  lift: 'Snatch',    base: m => m.snatch,      sets: 4, reps: 3, pct: 92 },
  ],
  tec: [
    { mv: 'Arrancada técnica',  lift: 'Snatch',    base: m => m.snatch,      sets: 5, reps: 3, pct: 55 },
    { mv: 'Cargada de potencia',lift: 'Clean',     base: m => m.clean,       sets: 4, reps: 2, pct: 62 },
  ],
  act: [
    { mv: 'Envión de potencia', lift: 'Jerk',      base: m => m.jerk,        sets: 3, reps: 2, pct: 65 },
    { mv: 'Push Press',         lift: 'Jerk',      base: m => m.jerk,        sets: 4, reps: 3, pct: 55 },
  ],
  rec: [
    { mv: 'Técnica barra liviana', lift: 'Snatch', base: m => m.snatch,      sets: 5, reps: 5, pct: 35 },
  ],
  rest: [],
};

const META: Record<WeekPlanDay['type'], { rpe: string; dur: number }> = {
  int:  { rpe: '8-9', dur: 90 },
  med:  { rpe: '7',   dur: 80 },
  vol:  { rpe: '6-7', dur: 95 },
  tec:  { rpe: '5-6', dur: 75 },
  act:  { rpe: '5',   dur: 60 },
  rec:  { rpe: '3-4', dur: 45 },
  rest: { rpe: '—',   dur: 0 },
};

const round = (v: number) => Math.round(v);

/** Construye el detalle de una sesión para un atleta y un día del plan. */
function buildSession(maxes: AthleteMaxes, day: WeekPlanDay, athleteId: string, dayIdx: number): SessionDetail {
  const base: SessionDetail = {
    dow: day.dow, type: day.type, label: day.name, rest: day.rest,
    exercises: [], totalTonnage: 0, totalReps: 0, imr: 0,
    rpe: META[day.type].rpe, dur: META[day.type].dur,
  };
  if (day.rest) return base;

  const rand = seeded(`${athleteId}:wk:${dayIdx}`);
  const exercises = TEMPLATES[day.type].map((t) => {
    const oneRM = Math.max(1, round(t.base(maxes)));
    // jitter determinístico ±2% para que no sea idéntico entre atletas/sesiones
    const pct = Math.max(20, Math.min(100, t.pct + Math.round((rand() - 0.5) * 4)));
    const kg = round((pct / 100) * oneRM);
    const tonnage = t.sets * t.reps * kg;
    const imr = Math.round((kg / oneRM) * 100);
    return {
      movement: t.mv, sets: t.sets, reps: t.reps, pct, kg,
      baseLift: t.lift, base1RM: oneRM, tonnage, imr,
    };
  });

  const totalReps = exercises.reduce((s, e) => s + e.sets * e.reps, 0);
  const totalTonnage = exercises.reduce((s, e) => s + e.tonnage, 0);
  // IMR de sesión = media de IMR por ejercicio ponderada por reps (cada lift vs su 1RM).
  const imr = totalReps > 0
    ? Math.round(exercises.reduce((s, e) => s + e.imr * e.sets * e.reps, 0) / totalReps)
    : 0;

  return { ...base, exercises, totalTonnage, totalReps, imr };
}

/** Semana completa del atleta (7 días Lun→Dom) con detalle por ejercicio + IMR. */
export function getAthleteWeek(athlete: AthleteProfile): SessionDetail[] {
  const plan = getWeekPlan(athlete.macrocycle?.program_id ?? null);
  return plan.map((d, i) => buildSession(athlete.maxes, d, athlete.id, i));
}

/** IMR medio de la semana (solo días de entrenamiento). */
export function weekImr(week: SessionDetail[]): number {
  const train = week.filter(s => !s.rest && s.imr > 0);
  return train.length ? Math.round(train.reduce((s, d) => s + d.imr, 0) / train.length) : 0;
}

/** Tonelaje total de la semana (kg). */
export function weekTonnage(week: SessionDetail[]): number {
  return week.reduce((s, d) => s + d.totalTonnage, 0);
}
