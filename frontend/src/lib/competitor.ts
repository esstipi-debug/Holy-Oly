/**
 * Volta Competitor · client.
 *
 * Tier "competidor" para atletas Volta CrossFit (Open / Quarterfinals /
 * Semifinals / Games). Coach habilita el flag · atleta ve un layout extra
 * en VoltaDashboard.
 *
 * Backend: /v1/volta/competitor  +  /v1/volta/custom-wod
 *  (router en backend/src/api/competitor/)
 *
 * El recommender de WOD (voltaWod.today) chequea custom_wods antes del
 * engine, así que si el coach asignó algo para hoy, el atleta lo ve
 * directamente en la card principal del dashboard.
 */
import { api } from './api';

export type CompetitorCategory = 'RX' | 'Scaled' | 'Masters' | 'Teens';
export type CustomWodType =
  | 'AMRAP'
  | 'EMOM'
  | 'For Time'
  | 'Strength'
  | 'Skill'
  | 'Recovery';
export type CustomWodIntensity = 'low' | 'medium' | 'high';
export type CustomWodScale = 'rx' | 'scaled' | 'beginner';

export interface CompetitorProfile {
  user_id: string;
  is_competitor: boolean;
  open_rank_worldwide?: number | null;
  open_rank_regional?: number | null;
  open_year?: number | null;
  category: CompetitorCategory;
  target_event?: string | null;
  weekly_volume_target_kg?: number | null;
  weekly_sessions_target: number;
  coach_notes?: string | null;
  last_updated: string;
}

export interface PromotePayload {
  athlete_id: string;
  category?: CompetitorCategory;
  target_event?: string | null;
  weekly_sessions_target?: number;
  weekly_volume_target_kg?: number | null;
  coach_notes?: string | null;
}

export interface CompetitorPatchSelf {
  category?: CompetitorCategory;
  open_rank_worldwide?: number;
  open_rank_regional?: number;
  open_year?: number;
}

export interface CompetitorPatchAthlete extends CompetitorPatchSelf {
  target_event?: string | null;
  weekly_sessions_target?: number;
  weekly_volume_target_kg?: number | null;
  coach_notes?: string | null;
}

export interface CustomWodMovement {
  name: string;
  scaling: Record<CustomWodScale, string>;
  tag?: string | null;
}

export interface CustomWodCreatePayload {
  athlete_id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  type: CustomWodType;
  duration_sec?: number | null;
  movements: CustomWodMovement[];
  intensity_target?: CustomWodIntensity | null;
  notes?: string | null;
}

export interface CustomWodResponse {
  id: string;
  coach_id: string;
  athlete_id: string;
  date: string;
  title: string;
  type: CustomWodType;
  duration_sec?: number | null;
  movements: CustomWodMovement[];
  intensity_target?: CustomWodIntensity | null;
  notes?: string | null;
  created_at: string;
  coach_name?: string | null;
}

export const competitorApi = {
  /** GET /me · atleta · 404 si no es competidor (null swallowed por handler) */
  getMe: async (): Promise<CompetitorProfile | null> => {
    try {
      return await api.get<CompetitorProfile>('/v1/volta/competitor/me');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 404 → atleta hobbyist · no es competidor
      if (msg.includes('No sos atleta competidor')) return null;
      throw e;
    }
  },

  /** GET /athlete/{id} · coach */
  getAthlete: (athleteId: string) =>
    api.get<CompetitorProfile>(
      `/v1/volta/competitor/athlete/${encodeURIComponent(athleteId)}`,
    ),

  /** POST /promote · coach upsert · sets is_competitor=TRUE */
  promote: (payload: PromotePayload) =>
    api.post<CompetitorProfile>('/v1/volta/competitor/promote', payload),

  /** PATCH /me · atleta */
  updateMe: (payload: CompetitorPatchSelf) =>
    api.patch<CompetitorProfile>('/v1/volta/competitor/me', payload),

  /** PATCH /athlete/{id} · coach */
  updateAthlete: (athleteId: string, payload: CompetitorPatchAthlete) =>
    api.patch<CompetitorProfile>(
      `/v1/volta/competitor/athlete/${encodeURIComponent(athleteId)}`,
      payload,
    ),

  /** DELETE /athlete/{id} · coach · soft delete */
  demote: (athleteId: string) =>
    api.delete<void>(
      `/v1/volta/competitor/athlete/${encodeURIComponent(athleteId)}`,
    ),
};

export const customWodApi = {
  /** POST · coach asigna WOD a competidor */
  create: (payload: CustomWodCreatePayload) =>
    api.post<CustomWodResponse>('/v1/volta/custom-wod', payload),

  /** GET /me/today · atleta · null si no hay */
  todayMe: () =>
    api.get<CustomWodResponse | null>('/v1/volta/custom-wod/me/today'),

  /** GET /athlete/{id} · coach · últimos 30 días */
  listForAthlete: (athleteId: string) =>
    api.get<CustomWodResponse[]>(
      `/v1/volta/custom-wod/athlete/${encodeURIComponent(athleteId)}`,
    ),

  /** DELETE · coach borra propio */
  delete: (id: string) =>
    api.delete<void>(`/v1/volta/custom-wod/${encodeURIComponent(id)}`),
};
