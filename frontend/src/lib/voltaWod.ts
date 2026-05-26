/**
 * Volta WOD Recommender · client.
 *
 * Backend: GET /v1/volta/wod/today  · router en backend/src/api/volta_wod/
 *
 * El engine corre cada vez que el atleta abre el dashboard. Backend cachea
 * por user_id hasta medianoche, así que el WOD del día no cambia entre
 * refreshes (a menos que pasemos refresh=true después de un check-in).
 *
 * Escala default: persistida en localStorage `volta:default_scale`.
 * El atleta elige una vez (rx / scaled / beginner) y se reutiliza cada día.
 */
import { api } from './api';

export type WodScale = 'rx' | 'scaled' | 'beginner';

export interface WodMovement {
  name: string;
  scaling: Record<WodScale, string>;
  tag?: string | null;
}

export interface WodMeta {
  engine_version: string;
  generated_at: string;
  expires_at: string;
  fallback: boolean;
  reason?: string | null;
}

export interface RecommendedWodResponse {
  title: string;
  type: 'AMRAP' | 'EMOM' | 'For Time' | 'Strength' | 'Active Recovery';
  duration_sec: number;
  movements: WodMovement[];
  intensity_target: 'low' | 'medium' | 'high';
  reasoning: string;
  risk_score: number;
  alternatives: string[];
  template_id?: string | null;
  meta: WodMeta;
}

const SCALE_KEY = 'volta:default_scale';

export const voltaWod = {
  /** GET /v1/volta/wod/today */
  today: (refresh = false) =>
    api.get<RecommendedWodResponse>(`/v1/volta/wod/today${refresh ? '?refresh=true' : ''}`),

  /** DELETE /v1/volta/wod/today/cache */
  invalidate: () => api.delete('/v1/volta/wod/today/cache'),

  /** Escala persistida del atleta (default: rx). */
  getScale: (): WodScale => {
    try {
      const v = localStorage.getItem(SCALE_KEY) as WodScale | null;
      if (v === 'rx' || v === 'scaled' || v === 'beginner') return v;
    } catch {
      /* privacy mode */
    }
    return 'rx';
  },

  setScale: (scale: WodScale) => {
    try {
      localStorage.setItem(SCALE_KEY, scale);
    } catch {
      /* privacy mode */
    }
  },
};
