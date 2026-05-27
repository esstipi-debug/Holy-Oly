/**
 * Sprint 1 Engines · Progression client API
 *
 * Reemplaza el cálculo del belt en frontend (que usaba prior_fitness/15 hack)
 * con datos reales del backend:
 *
 * - Belt Engine (05) con persistencia + permanencia
 * - Smart Streak (06) con grace day
 * - OLY Index (11) normalizado por bodyweight
 */
import { api } from './api';

// ---------------------------------------------------------------------------
// Types · espejo de los Pydantic models del backend
// ---------------------------------------------------------------------------

export interface BeltCriteria {
  belt_idx: number;
  min_oly_index: number;
  min_active_days: number;
  min_streak: number;
}

export interface BeltStatus {
  belt_idx: number;                     // 0=Blanco ... 7=Maestro
  earned_at: string | null;             // ISO timestamp
  next_belt_idx: number | null;
  progress_pct: number;                 // 0-100 hacia next belt
  progress_breakdown: Record<string, number>; // {oly, active_days, streak}
  next_criteria: BeltCriteria | null;
  current_oly_index: number;
  current_active_days: number;
  current_best_streak: number;
}

export interface StreakStatus {
  current: number;
  best: number;
  grace_used: boolean;
  last_active_date: string | null;
  total_active_days: number;
}

export type OlyCategory = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'world_class';

export interface OlyIndex {
  oly_index: number;
  best_snatch_kg: number;
  best_clean_kg: number;
  body_weight_kg: number;
  bw_estimated: boolean;
  category: OlyCategory;
}

export interface ProgressionBundle {
  belt: BeltStatus;
  streak: StreakStatus;
  oly_index: OlyIndex;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const progressionApi = {
  bundle:   () => api.get<ProgressionBundle>('/v1/progression/me'),
  belt:     () => api.get<BeltStatus>('/v1/progression/belt'),
  streak:   () => api.get<StreakStatus>('/v1/progression/streak'),
  olyIndex: () => api.get<OlyIndex>('/v1/progression/oly-index'),
};

// ---------------------------------------------------------------------------
// Belt mapping (espejo de BELTS en BeltCeremony.tsx)
// ---------------------------------------------------------------------------

export const BELT_NAMES = [
  'BLANCO', 'AMARILLO', 'NARANJA', 'AZUL',
  'PÚRPURA', 'MARRÓN', 'NEGRO', 'MAESTRO',
] as const;

export const OLY_CATEGORY_LABEL: Record<OlyCategory, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  elite: 'Élite',
  world_class: 'Top mundial',
};
