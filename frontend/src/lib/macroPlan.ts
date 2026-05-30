/**
 * Generador de plan de macrociclo · client-side, determinista.
 *
 * Produce una periodización plausible (semana → días → ejercicios con %RM)
 * a partir de los parámetros del programa asignado (focus, semanas) y se
 * combina con los maxes reales del atleta para mostrar pesos.
 *
 * Por qué client-side: el explorador necesita funcionar en demo (sin token) y
 * offline. Para usuarios reales autenticados, el plan "fuente de verdad" vive
 * en el engine (`/v1/macrocycles/{id}/weeks/{n}` · mismo shape: day/theme/
 * exercises{name,sets,reps,intensity,rpe}). TODO: preferir el engine cuando
 * haya macro asignado + auth (Slice spine).
 */

export type MaxKey = 'snatch' | 'clean' | 'jerk' | 'back_squat' | 'front_squat';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: number;
  /** 0..1 (fracción del 1RM). 0 = accesorio guiado por RPE (sin peso prescripto). */
  intensity: number;
  rpe: number;
  maxKey?: MaxKey;
}

export interface PlanDay {
  /** índice global 0-based a través de todo el macro */
  index: number;
  week: number;
  dayInWeek: number;
  dayLabel: string;
  theme: string;
  exercises: PlanExercise[];
}

export interface MacroPlan {
  programName: string;
  focus: string;
  totalWeeks: number;
  sessionsPerWeek: number;
  days: PlanDay[];
  /** intensidad representativa por semana (0..1) · alimenta la curva */
  weekIntensity: number[];
}

export interface GenMacroInput {
  programName: string;
  focus: string;
  totalWeeks: number;
  sessionsPerWeek?: number;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const LIFT: Record<MaxKey, string> = {
  snatch: 'Arranque',
  clean: 'Cargada',
  jerk: 'Envión',
  back_squat: 'Sentadilla Trasera',
  front_squat: 'Sentadilla Frontal',
};

const ACCESSORY: Record<MaxKey, { name: string; rpe: number }> = {
  snatch: { name: 'Tirón de Arranque', rpe: 7 },
  clean: { name: 'Tirón de Cargada', rpe: 7 },
  jerk: { name: 'Push Press', rpe: 7 },
  back_squat: { name: 'Trabajo de Core', rpe: 5 },
  front_squat: { name: 'Buenos Días', rpe: 6 },
};

interface DayTheme {
  theme: string;
  main: MaxKey;
  second: MaxKey | null;
}

const DAY_THEMES: DayTheme[] = [
  { theme: 'Arranque + Sentadilla', main: 'snatch', second: 'back_squat' },
  { theme: 'Envión + Sentadilla Frontal', main: 'clean', second: 'front_squat' },
  { theme: 'Sentadilla Pesada + Arranque', main: 'back_squat', second: 'snatch' },
  { theme: 'Técnica + Accesorios', main: 'snatch', second: null },
  { theme: 'Potencia + Velocidad', main: 'clean', second: 'jerk' },
  { theme: 'Volumen + Tirones', main: 'back_squat', second: 'clean' },
];

function focusAdjustment(focus: string): number {
  const f = (focus || '').toLowerCase();
  if (f.includes('peak') || f.includes('pico') || f.includes('power') || f.includes('potencia')) return 0.03;
  if (f.includes('hypertroph') || f.includes('hipertrof') || f.includes('volumen') || f.includes('volume')) return -0.05;
  if (f.includes('técn') || f.includes('tecn') || f.includes('technic')) return -0.06;
  return 0;
}

/** Intensidad base de la semana siguiendo una periodización (ramp + onda + deload + taper). */
function weekBaseIntensity(week: number, total: number, focusAdj: number): number {
  const p = total > 1 ? (week - 1) / (total - 1) : 0;
  let base = 0.70 + 0.20 * p;                              // ramp 70% → 90%
  base += 0.025 * Math.sin((week - 1) * (Math.PI * 2 / 4)); // onda de 4 semanas
  if (week % 4 === 0) base -= 0.07;                         // deload cada 4ta semana
  if (week === total) base -= 0.10;                         // taper final
  base += focusAdj;
  return Math.max(0.60, Math.min(0.95, Math.round(base * 100) / 100));
}

function setsReps(intensity: number): { sets: number; reps: number } {
  if (intensity >= 0.88) return { sets: 4, reps: 2 };
  if (intensity >= 0.80) return { sets: 5, reps: 3 };
  if (intensity >= 0.72) return { sets: 4, reps: 4 };
  return { sets: 5, reps: 5 };
}

const clampInt = (v: number) => Math.max(0.55, Math.min(0.95, Math.round(v * 100) / 100));
const rpeFor = (intensity: number) => Math.max(6, Math.min(9, Math.round(intensity * 10 - 1)));

function buildExercises(theme: DayTheme, wi: number, dayInWeek: number): PlanExercise[] {
  const out: PlanExercise[] = [];
  // Variación determinista por día para que no sean idénticos
  const dayOffset = dayInWeek % 2 === 0 ? -0.02 : 0.0;

  // Lift principal
  const mainInt = clampInt(wi + dayOffset);
  const mainSR = setsReps(mainInt);
  out.push({ name: LIFT[theme.main], ...mainSR, intensity: mainInt, rpe: rpeFor(mainInt), maxKey: theme.main });

  // Lift secundario
  if (theme.second) {
    const secInt = clampInt(wi - 0.05 + dayOffset);
    const secSR = setsReps(secInt);
    out.push({ name: LIFT[theme.second], ...secSR, intensity: secInt, rpe: rpeFor(secInt), maxKey: theme.second });
  }

  // Accesorio guiado por RPE (sin %RM)
  const acc = ACCESSORY[theme.main];
  out.push({ name: acc.name, sets: 3, reps: theme.main === 'back_squat' ? 10 : 5, intensity: 0, rpe: acc.rpe });

  return out;
}

export function generateMacroPlan(input: GenMacroInput): MacroPlan {
  const spw = Math.max(1, Math.min(6, input.sessionsPerWeek ?? 4));
  const total = Math.max(1, input.totalWeeks || 12);
  const focusAdj = focusAdjustment(input.focus);

  const days: PlanDay[] = [];
  const weekIntensity: number[] = [];
  let idx = 0;

  for (let w = 1; w <= total; w++) {
    const wi = weekBaseIntensity(w, total, focusAdj);
    weekIntensity.push(wi);
    for (let d = 1; d <= spw; d++) {
      const theme = DAY_THEMES[(d - 1) % DAY_THEMES.length];
      days.push({
        index: idx++,
        week: w,
        dayInWeek: d,
        dayLabel: DAY_LABELS[(d - 1) % DAY_LABELS.length],
        theme: theme.theme,
        exercises: buildExercises(theme, wi, d),
      });
    }
  }

  return {
    programName: input.programName,
    focus: input.focus,
    totalWeeks: total,
    sessionsPerWeek: spw,
    days,
    weekIntensity,
  };
}

/** Peso prescripto = intensidad × max, redondeado a 2.5kg. null si es accesorio/RPE o falta el max. */
export function prescribedWeight(
  ex: PlanExercise,
  maxes: Partial<Record<MaxKey, number>>,
): number | null {
  if (!ex.maxKey || ex.intensity <= 0) return null;
  const max = maxes[ex.maxKey];
  if (!max || max <= 0) return null;
  return Math.round((ex.intensity * max) / 2.5) * 2.5;
}

/** Índice del día "hoy" según la posición actual del atleta en el macro. */
export function anchorDayIndex(plan: MacroPlan, week: number, dayInWeek: number): number {
  const w = Math.max(1, Math.min(plan.totalWeeks, week || 1));
  const d = Math.max(1, Math.min(plan.sessionsPerWeek, dayInWeek || 1));
  const found = plan.days.find((day) => day.week === w && day.dayInWeek === d);
  if (found) return found.index;
  const firstOfWeek = plan.days.find((day) => day.week === w);
  return firstOfWeek ? firstOfWeek.index : 0;
}
