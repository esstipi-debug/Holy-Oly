/**
 * Tipos compartidos para sesiones planificadas (incluye soporte de doble sesión).
 *
 * 'full' = 1 sesión única del día (caso por defecto).
 * 'am' / 'pm' = doble sesión (mañana + tarde). Típico en halterofilia élite:
 * AM técnico/Olympic lifts · PM accessory/strength. También aplicable a Volta
 * cuando el atleta tiene 2 WODs en el día.
 */

export type TrainingSlot = 'am' | 'pm' | 'full';

export type TrainingFocus =
  | 'technique'
  | 'strength'
  | 'olympic'
  | 'accessory'
  | 'metcon';

export type MaxKey =
  | 'snatch'
  | 'clean'
  | 'jerk'
  | 'back_squat'
  | 'front_squat';

export interface PlannedExercise {
  name: string;
  sets: number;
  reps: number;
  pct: number;          // 0-1 (% de 1RM)
  max_key: MaxKey;      // de qué max derivar el peso
}

export interface PlannedSession {
  date: string;                 // ISO yyyy-mm-dd
  slot: TrainingSlot;
  focus: TrainingFocus;
  exercises: PlannedExercise[];
  /** Estado opcional · derivado de localStorage o backend cuando exista. */
  status?: 'pending' | 'in_progress' | 'completed';
}
