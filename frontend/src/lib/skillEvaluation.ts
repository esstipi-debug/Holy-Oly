/**
 * Skill Evaluation · veredicto formal del coach sobre la destreza del atleta
 * en cada movimiento del skill tree.
 *
 * Niveles 1-5: 1·novato · 2·básico · 3·funcional · 4·sólido · 5·maestría
 *
 * Distinto de skill_focus (loop semanal). Acá el coach califica destreza persistente.
 *
 * Backend: /v1/skill-evaluation (router en backend/src/api/skill_evaluation/)
 */
import { api } from './api';

export type SkillEvaluationLevel = 1 | 2 | 3 | 4 | 5;

export interface SkillEvaluationResponse {
  id: string;
  coach_id: string;
  athlete_id: string;
  movement_id: string;
  level: SkillEvaluationLevel;
  note?: string | null;
  /** ISO timestamp */
  evaluated_at: string;
  coach_name?: string | null;
}

export const skillEvaluation = {
  /** GET /v1/skill-evaluation/athlete/{athleteId} · coach lista evaluaciones del atleta */
  list: (opts: { athleteId: string }) =>
    api.get<SkillEvaluationResponse[]>(
      `/v1/skill-evaluation/athlete/${encodeURIComponent(opts.athleteId)}`,
    ),

  /** GET /v1/skill-evaluation/me · atleta lista sus evaluaciones */
  listMe: () => api.get<SkillEvaluationResponse[]>('/v1/skill-evaluation/me'),

  /** POST /v1/skill-evaluation · upsert por (athleteId, movementId) */
  upsert: (
    athleteId: string,
    movementId: string,
    level: SkillEvaluationLevel,
    note?: string,
  ) =>
    api.post<SkillEvaluationResponse>('/v1/skill-evaluation', {
      athlete_id: athleteId,
      movement_id: movementId,
      level,
      note: note ?? null,
    }),

  /** DELETE /v1/skill-evaluation/{id} · coach owner o admin */
  delete: (id: string) =>
    api.delete<void>(`/v1/skill-evaluation/${encodeURIComponent(id)}`),
};
