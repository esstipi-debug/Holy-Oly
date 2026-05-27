/**
 * Engine 13 · Hormonal Periodization · client API.
 *
 * Opt-in puro · cliente envía si está habilitado. Si el atleta nunca lo
 * configuró, /current devuelve 404 y la UI muestra "Activá tracking".
 */
import { api } from './api';

export type HormonalPhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseRecommendation {
  phase: HormonalPhase;
  intensity_adjustment_pct: number;
  volume_adjustment_pct: number;
  load_multiplier: number;
  xp_multiplier: number;
  focus: string;
  rest_recommendation: string;
  coach_note: string;
}

export interface HormonalCurrent {
  phase: HormonalPhase;
  day_of_cycle: number;
  days_until_next_period: number;
  next_period_estimated: string;
  cycle_start_date: string;
  cycle_length_days: number;
  recommendation: PhaseRecommendation;
}

export interface SetupPayload {
  cycle_start_date: string;       // YYYY-MM-DD
  cycle_length_days?: number;     // default 28
  source?: string;                // manual | flo | apple_health | oura
  notes?: string;
}

export interface LogPayload {
  log_date?: string;
  symptoms?: string[];
  flow_intensity?: 'light' | 'moderate' | 'heavy';
  notes?: string;
}

export const hormonalApi = {
  setup: (payload: SetupPayload) => api.post<{ id: string; is_enabled: boolean }>('/v1/hormonal/setup', payload),
  disable: () => api.delete<{ disabled: boolean }>('/v1/hormonal/setup'),
  current: () => api.get<HormonalCurrent>('/v1/hormonal/current'),
  log: (payload: LogPayload) => api.post('/v1/hormonal/log', payload),
  history: (days: number = 30) => api.get<{ entries: Array<{
    log_date: string; day_of_cycle: number; phase: HormonalPhase;
    symptoms: string[] | null; flow_intensity: string | null; notes: string | null;
  }> }>(`/v1/hormonal/history?days=${days}`),
};

// Helper · color por fase
export const PHASE_COLORS: Record<HormonalPhase, { primary: string; bg: string; emoji: string; label: string }> = {
  menstruation: { primary: '#E11D48', bg: 'rgba(225,29,72,0.10)', emoji: '🌑', label: 'Menstruación' },
  follicular:   { primary: '#22C55E', bg: 'rgba(34,197,94,0.10)', emoji: '🌱', label: 'Folicular' },
  ovulation:    { primary: '#F5C518', bg: 'rgba(245,197,24,0.12)', emoji: '☀️', label: 'Ovulación' },
  luteal:       { primary: '#7C5CFF', bg: 'rgba(124,92,255,0.10)', emoji: '🌙', label: 'Lútea' },
};
