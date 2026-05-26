/**
 * Wellness daily check-in · feeds el stress engine y el Wise Score.
 *
 * Backend: /v1/wellness/checkin  (router en backend/src/api/wellness/)
 *
 * Offline-first fallback: si no hay backend (503/network error), guardamos
 * el check-in en localStorage bajo `wellness:checkin:YYYY-MM-DD` para que
 * el atleta vea "✓ guardado hoy" aunque la DB esté caída. Cuando vuelva el
 * backend, un mecanismo de sync futuro va a hacer flush (TODO).
 */
import { api } from './api';

export interface WellnessCheckinCreate {
  sleep_hours: number;
  sleep_quality: number;
  soreness: number;
  motivation: number;
  life_stress: number;
  caffeine_mg?: number;
  hydration_liters?: number;
  hrv?: number | null;
  notes?: string | null;
}

export interface WellnessCheckinResponse {
  id: string;
  user_id: string;
  sleep_hours: number;
  sleep_quality: number;
  soreness: number;
  motivation: number;
  life_stress: number;
  caffeine_mg: number;
  hydration_liters: number;
  hrv?: number | null;
  notes?: string | null;
  /** ISO timestamp */
  created_at: string;
}

const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `wellness:checkin:${yyyy}-${mm}-${dd}`;
};

const readLocalToday = (): WellnessCheckinResponse | null => {
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return null;
    return JSON.parse(raw) as WellnessCheckinResponse;
  } catch {
    return null;
  }
};

const writeLocalToday = (data: WellnessCheckinResponse) => {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(data));
  } catch {
    /* quota / privacy mode → no-op */
  }
};

export const wellness = {
  /** POST /v1/wellness/checkin · crea check-in. Offline → fallback localStorage. */
  create: async (body: WellnessCheckinCreate): Promise<WellnessCheckinResponse> => {
    try {
      const res = await api.post<WellnessCheckinResponse>('/v1/wellness/checkin', body);
      writeLocalToday(res);
      return res;
    } catch (err) {
      // Fallback offline-first: simulamos respuesta y persistimos localmente.
      const fallback: WellnessCheckinResponse = {
        id: `local-${Date.now()}`,
        user_id: 'local',
        sleep_hours: body.sleep_hours,
        sleep_quality: body.sleep_quality,
        soreness: body.soreness,
        motivation: body.motivation,
        life_stress: body.life_stress,
        caffeine_mg: body.caffeine_mg ?? 0,
        hydration_liters: body.hydration_liters ?? 0,
        hrv: body.hrv ?? null,
        notes: body.notes ?? null,
        created_at: new Date().toISOString(),
      };
      writeLocalToday(fallback);
      // Re-throw para que el caller vea el error real, pero el fallback ya
      // está guardado: el siguiente fetch /today devuelve el local cache.
      throw err;
    }
  },

  /** GET /v1/wellness/checkin/today · 404 → null. Offline → localStorage. */
  today: async (): Promise<WellnessCheckinResponse | null> => {
    try {
      return await api.get<WellnessCheckinResponse>('/v1/wellness/checkin/today');
    } catch (err) {
      // Si el backend dijo 404 explícito, no hay check-in hoy.
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('No hay check-in') || msg.includes('Not Found') || msg.includes('404')) {
        // Aún así, si tenemos un local-only (DB caída cuando se creó), devolverlo.
        return readLocalToday();
      }
      // Cualquier otro error (network, 503): caer al local cache.
      return readLocalToday();
    }
  },

  /** GET /v1/wellness/checkin/history?days=N */
  history: (days = 14) =>
    api.get<WellnessCheckinResponse[]>(`/v1/wellness/checkin/history?days=${days}`),
};
