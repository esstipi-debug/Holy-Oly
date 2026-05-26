/**
 * Skill Focus · loop coach↔atleta sobre el skill tree.
 *
 * Coach asigna 1-3 movimientos del skill tree del atleta como focos de la semana.
 * Atleta los ve con glow ámbar en MovementProgression.
 * Al marcar 'dominated' → se cierra el foco.
 *
 * Backend: /v1/coach/skill-focus  (router en backend/src/api/skill_focus/)
 */
import { api } from './api';

export type SkillFocusStatus = 'active' | 'dominated' | 'retired';

export interface SkillFocusResponse {
  id: string;
  coach_id: string;
  athlete_id: string;
  movement_id: string;
  note?: string | null;
  status: SkillFocusStatus;
  /** ISO timestamp */
  assigned_at: string;
  /** ISO timestamp */
  resolved_at?: string | null;
  /** Resuelto en el backend con LEFT JOIN users */
  coach_name?: string | null;
}

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'https://holy-oly-3.onrender.com');

/** PATCH genérico para skill-focus (api.ts no expone PATCH global). */
async function patchStatus(
  id: string,
  status: SkillFocusStatus,
): Promise<SkillFocusResponse> {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${API_URL}/v1/coach/skill-focus/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Error al actualizar el foco');
  }
  return res.json();
}

export const skillFocus = {
  /** GET /v1/coach/skill-focus/me · atleta lista sus focos activos */
  list: () => api.get<SkillFocusResponse[]>('/v1/coach/skill-focus/me'),

  /** GET /v1/coach/skill-focus/athlete/{athleteId} · coach lista focos del atleta */
  listForAthlete: (athleteId: string) =>
    api.get<SkillFocusResponse[]>(
      `/v1/coach/skill-focus/athlete/${encodeURIComponent(athleteId)}`,
    ),

  /** POST /v1/coach/skill-focus · coach crea un foco (409 si ya existe active) */
  create: (athleteId: string, movementId: string, note?: string) =>
    api.post<SkillFocusResponse>('/v1/coach/skill-focus', {
      athlete_id: athleteId,
      movement_id: movementId,
      note: note ?? null,
    }),

  /** PATCH status='dominated' (atleta marca dominado · cierra el foco) */
  markDominated: (id: string) => patchStatus(id, 'dominated'),

  /** PATCH status='retired' (coach archiva sin marcar dominado) */
  retire: (id: string) => patchStatus(id, 'retired'),

  /** PATCH status='active' (reabrir un foco) */
  reactivate: (id: string) => patchStatus(id, 'active'),

  /** DELETE /v1/coach/skill-focus/{id} · borrado físico (solo coach dueño) */
  delete: (id: string) =>
    api.delete<void>(`/v1/coach/skill-focus/${encodeURIComponent(id)}`),
};
