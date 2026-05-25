/**
 * Sistema de progresión de movimientos.
 *
 * Cada familia tiene 5 niveles (1=Beginner, 5=Elite) con prerequisitos claros.
 * Los datos de progreso son por atleta (sample).
 */

export type MovementCategory = 'Gymnastics' | 'Weightlifting' | 'Engine' | 'Strength' | 'Power';

export interface MovementTier {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  reqs: string;        // criterio para alcanzar este nivel
  unlocks?: string;    // qué WODs/movs se desbloquean al llegar acá
}

export interface MovementFamily {
  id: string;
  name: string;
  category: MovementCategory;
  emoji: string;
  product: ('holy-oly' | 'volta')[];   // dónde aplica
  tiers: MovementTier[];
}

export const MOVEMENTS: MovementFamily[] = [
  // ── GYMNASTICS ──────────────────────────────────────────
  {
    id: 'pullup',
    name: 'Pull-up',
    category: 'Gymnastics',
    emoji: '🆙',
    product: ['volta'],
    tiers: [
      { level: 1, name: 'Ring Row',          reqs: '15 ring rows estrictos sin pausa',           unlocks: 'WODs Beginner' },
      { level: 2, name: 'Banded Pull-up',    reqs: '10 reps con banda verde',                    unlocks: 'Scaled WODs' },
      { level: 3, name: 'Strict Pull-up',    reqs: '5 strict pull-ups consecutivos',             unlocks: 'WODs Rx (sub Fran)' },
      { level: 4, name: 'Kipping Pull-up',   reqs: '15 kipping unbroken con buena posición',     unlocks: 'Fran, Helen Rx' },
      { level: 5, name: 'Bar Muscle-up',     reqs: '3 BMU consecutivos',                         unlocks: 'WODs Elite, Open prescribed' },
    ],
  },
  {
    id: 'hspu',
    name: 'HSPU',
    category: 'Gymnastics',
    emoji: '🤸',
    product: ['volta'],
    tiers: [
      { level: 1, name: 'Pike Push-up',         reqs: '10 strict pike push-ups',           unlocks: 'Skill work' },
      { level: 2, name: 'Pike Elevated',        reqs: '8 reps con cajón 24"',              unlocks: '' },
      { level: 3, name: 'Wall HSPU (kipping)',  reqs: '5 kipping HSPU pared',              unlocks: 'WODs con HSPU' },
      { level: 4, name: 'Strict HSPU',          reqs: '3 strict HSPU consecutivos',        unlocks: 'Diane, Rx HSPU WODs' },
      { level: 5, name: 'Deficit HSPU 6"',      reqs: '3 reps en deficit de 6"',           unlocks: 'WODs Elite' },
    ],
  },
  {
    id: 'du',
    name: 'Double Under',
    category: 'Engine',
    emoji: '🪢',
    product: ['volta'],
    tiers: [
      { level: 1, name: 'Single Under fluido',   reqs: '50 SU sin error',                     unlocks: '' },
      { level: 2, name: 'DU intento',            reqs: '1 DU consecutivo entre SU',           unlocks: 'WODs Scaled' },
      { level: 3, name: 'DU 10 unbroken',        reqs: '10 DU sin error',                     unlocks: 'WODs Rx low-vol' },
      { level: 4, name: 'DU 50 unbroken',        reqs: '50 DU sin error',                     unlocks: 'Annie Rx' },
      { level: 5, name: 'DU 100 unbroken',       reqs: '100 DU sin error',                    unlocks: 'WODs Elite vol alto' },
    ],
  },

  // ── WEIGHTLIFTING ───────────────────────────────────────
  {
    id: 'snatch',
    name: 'Arrancada',
    category: 'Weightlifting',
    emoji: '🏋️',
    product: ['holy-oly', 'volta'],
    tiers: [
      { level: 1, name: 'PVC + Posición',      reqs: 'Overhead squat estable con PVC',             unlocks: 'Empty bar work' },
      { level: 2, name: 'Power Snatch barra',  reqs: 'Snatch técnico sub 50% BW',                  unlocks: 'WODs Scaled' },
      { level: 3, name: 'Snatch sub 70% 1RM',  reqs: 'Snatch full @ 70% sin fallo',                unlocks: 'Macrociclos intermedios' },
      { level: 4, name: 'Snatch sub 85% 1RM',  reqs: 'Triplas @ 85% técnicamente limpias',         unlocks: 'Competencias locales' },
      { level: 5, name: 'PR sostenido',        reqs: 'Snatch ≥ 1×BW (masc) o 0.75×BW (fem)',      unlocks: 'Competencias regionales' },
    ],
  },
  {
    id: 'cleanjerk',
    name: 'Clean & Jerk',
    category: 'Weightlifting',
    emoji: '💪',
    product: ['holy-oly', 'volta'],
    tiers: [
      { level: 1, name: 'Front Rack estable',   reqs: 'Front squat al 50% BW con codos altos',     unlocks: '' },
      { level: 2, name: 'Power Clean técnico',  reqs: 'Power clean sub 70% BW',                    unlocks: 'Grace Scaled' },
      { level: 3, name: 'Squat Clean & Push J.',reqs: 'C&J @ 70% sin fallo',                       unlocks: 'WODs Rx light' },
      { level: 4, name: 'Split Jerk + Squat C', reqs: 'C&J ≥ 1×BW masc / 0.85×BW fem',            unlocks: 'Grace Rx, DT Rx' },
      { level: 5, name: 'Top-end',              reqs: 'C&J ≥ 1.3×BW masc / 1×BW fem',              unlocks: 'Competencias regionales' },
    ],
  },

  // ── STRENGTH ────────────────────────────────────────────
  {
    id: 'backsquat',
    name: 'Sentadilla Atrás',
    category: 'Strength',
    emoji: '🦵',
    product: ['holy-oly', 'volta'],
    tiers: [
      { level: 1, name: 'Air Squat profundo',  reqs: '20 air squats con full ROM',          unlocks: '' },
      { level: 2, name: 'Goblet Squat',         reqs: '10 reps con KB 24kg',                 unlocks: '' },
      { level: 3, name: 'BS @ 1×BW',            reqs: 'Back squat al peso corporal',         unlocks: 'WODs Rx con BS' },
      { level: 4, name: 'BS @ 1.5×BW',          reqs: 'BS @ 1.5×BW limpio',                  unlocks: 'Strength blocks intermedios' },
      { level: 5, name: 'BS @ 2×BW',            reqs: 'BS @ 2×BW',                           unlocks: 'Strength blocks elite' },
    ],
  },

  // ── ENGINE ──────────────────────────────────────────────
  {
    id: 'row',
    name: 'Row',
    category: 'Engine',
    emoji: '🚣',
    product: ['volta'],
    tiers: [
      { level: 1, name: '500m sub 2:30',    reqs: 'Completar 500m a ritmo moderado',     unlocks: '' },
      { level: 2, name: '500m sub 2:00',    reqs: '500m sub 2:00',                       unlocks: '' },
      { level: 3, name: '2k sub 8:30',      reqs: '2k a ritmo sub 8:30',                 unlocks: 'WODs Rx engine' },
      { level: 4, name: '5k sub 22:00',     reqs: '5k a ritmo sostenido',                unlocks: 'Endurance WODs' },
      { level: 5, name: '10k sub 45:00',    reqs: '10k a ritmo sub 4:30/km',             unlocks: 'WODs Elite engine' },
    ],
  },

  // ── POWER ───────────────────────────────────────────────
  {
    id: 'boxjump',
    name: 'Box Jump',
    category: 'Power',
    emoji: '📦',
    product: ['volta'],
    tiers: [
      { level: 1, name: 'Step-up',          reqs: 'Step-up controlado a 20"',           unlocks: '' },
      { level: 2, name: 'Box Jump 20"',     reqs: '10 reps unbroken a 20"',             unlocks: '' },
      { level: 3, name: 'Box Jump 24"',     reqs: '15 reps unbroken a 24"',             unlocks: 'WODs Rx (Karen, Helen)' },
      { level: 4, name: 'Box Jump Over 30"', reqs: 'Box jump over 30" sustentado',       unlocks: 'WODs Rx high-vol' },
      { level: 5, name: 'BJO 36"',           reqs: 'Box jump over 36"',                  unlocks: 'WODs Elite' },
    ],
  },
];

// ─── PROGRESO DEL ATLETA (sample data) ──────────────────────────────────
// En backend real esto vendría de la DB.

export interface MovementProgress {
  movementId: string;
  currentLevel: 1 | 2 | 3 | 4 | 5;
  progressToNext: number;     // 0-100
  history: { date: string; level: number; note?: string }[];
  recentReps?: { date: string; value: number; unit: 'kg' | 'reps' | 'sec' | 'm' }[];
  blockers?: string;          // qué le falta para subir
}

export const SAMPLE_PROGRESS: MovementProgress[] = [
  {
    movementId: 'pullup', currentLevel: 3, progressToNext: 65,
    history: [
      { date: '2025-08', level: 1 },
      { date: '2025-10', level: 2, note: 'Quitó banda verde' },
      { date: '2026-01', level: 3, note: '5 strict consecutivos' },
    ],
    recentReps: [
      { date: '06 may', value: 6,  unit: 'reps' },
      { date: '03 may', value: 7,  unit: 'reps' },
      { date: '30 abr', value: 5,  unit: 'reps' },
      { date: '27 abr', value: 6,  unit: 'reps' },
    ],
    blockers: 'Falta volumen en kipping (target 15 unbroken)',
  },
  {
    movementId: 'hspu', currentLevel: 2, progressToNext: 40,
    history: [
      { date: '2025-11', level: 1 },
      { date: '2026-02', level: 2 },
    ],
    recentReps: [
      { date: '05 may', value: 8, unit: 'reps' },
      { date: '02 may', value: 7, unit: 'reps' },
      { date: '28 abr', value: 8, unit: 'reps' },
    ],
    blockers: 'Movilidad torácica + estabilidad escapular',
  },
  {
    movementId: 'du', currentLevel: 3, progressToNext: 30,
    history: [
      { date: '2025-09', level: 1 },
      { date: '2025-11', level: 2 },
      { date: '2026-03', level: 3 },
    ],
    recentReps: [
      { date: '06 may', value: 12, unit: 'reps' },
      { date: '04 may', value: 15, unit: 'reps' },
      { date: '01 may', value: 10, unit: 'reps' },
    ],
    blockers: 'Cadencia de muñeca · 50 unbroken sigue lejos',
  },
  {
    movementId: 'snatch', currentLevel: 4, progressToNext: 75,
    history: [
      { date: '2025-06', level: 2 },
      { date: '2025-09', level: 3 },
      { date: '2026-02', level: 4 },
    ],
    recentReps: [
      { date: '06 may', value: 95,  unit: 'kg' },
      { date: '03 may', value: 92,  unit: 'kg' },
      { date: '29 abr', value: 90,  unit: 'kg' },
      { date: '25 abr', value: 95,  unit: 'kg' },
    ],
    blockers: 'PR estancado en 102kg · falta 5kg para 1×BW',
  },
  {
    movementId: 'cleanjerk', currentLevel: 4, progressToNext: 60,
    history: [
      { date: '2025-07', level: 2 },
      { date: '2025-11', level: 3 },
      { date: '2026-03', level: 4 },
    ],
    recentReps: [
      { date: '06 may', value: 108, unit: 'kg' },
      { date: '02 may', value: 105, unit: 'kg' },
    ],
    blockers: 'Falta consistencia técnica en split jerk',
  },
  {
    movementId: 'backsquat', currentLevel: 4, progressToNext: 80,
    history: [
      { date: '2025-05', level: 3 },
      { date: '2025-10', level: 4 },
    ],
    recentReps: [
      { date: '04 may', value: 145, unit: 'kg' },
      { date: '27 abr', value: 142, unit: 'kg' },
    ],
    blockers: '5kg más para 1.5×BW',
  },
  {
    movementId: 'row', currentLevel: 3, progressToNext: 50,
    history: [
      { date: '2025-08', level: 2 },
      { date: '2026-01', level: 3 },
    ],
    recentReps: [
      { date: '05 may', value: 510, unit: 'sec' },
      { date: '01 may', value: 525, unit: 'sec' },
    ],
    blockers: 'Engine aeróbica — apuntar 5k sub 22:00',
  },
  {
    movementId: 'boxjump', currentLevel: 3, progressToNext: 70,
    history: [
      { date: '2025-09', level: 2 },
      { date: '2025-12', level: 3 },
    ],
    recentReps: [
      { date: '06 may', value: 24, unit: 'reps' },
      { date: '03 may', value: 22, unit: 'reps' },
    ],
    blockers: 'Probar BJO 30" en próxima evaluación',
  },
];

export const getMovement = (id: string) => MOVEMENTS.find(m => m.id === id);
export const getProgress = (id: string) => SAMPLE_PROGRESS.find(p => p.movementId === id);

export const CATEGORIES: { id: MovementCategory; label: string; color: string }[] = [
  { id: 'Gymnastics',    label: 'Gymnastics',    color: '#A855F7' },
  { id: 'Weightlifting', label: 'Halterofilia',  color: '#F59E0B' },
  { id: 'Strength',      label: 'Fuerza',        color: '#EF4444' },
  { id: 'Engine',        label: 'Engine',        color: '#00E5FF' },
  { id: 'Power',         label: 'Power',         color: '#22C55E' },
];
