// En dev usamos paths relativos para pasar por el proxy de Vite (evita CORS).
// En prod, definí VITE_API_URL apuntando al backend (ej. https://holy-oly-3.onrender.com).
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'https://holy-oly-3.onrender.com');

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: 'athlete' | 'coach' | 'admin';
  product?: 'holy-oly' | 'volta';
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Error de red');
  }

  // 204 No Content → no body parseable
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/* ------------------------------------------------------------------ */
/* Baseline · Tests de Referencia                                     */
/* ------------------------------------------------------------------ */

export type BaselineUnit = 'kg' | 'reps' | 'seconds' | 'cm' | 'meters' | 'ml/kg/min';

export interface BaselineBackendResult {
  value: number;
  unit: BaselineUnit;
  /** ISO date string del backend (tested_at) */
  date: string;
}

export type BaselineResultsMap = Record<string, BaselineBackendResult>;

export const baselineApi = {
  /** GET /v1/baseline/results → último valor por test_id */
  list: () => api.get<BaselineResultsMap>('/v1/baseline/results'),
  /** POST /v1/baseline/results */
  upsert: (testId: string, value: number, unit: BaselineUnit) =>
    api.post<BaselineBackendResult>('/v1/baseline/results', {
      test_id: testId,
      value,
      unit,
    }),
  /** DELETE /v1/baseline/results/{test_id} */
  delete: (testId: string) =>
    api.delete<void>(`/v1/baseline/results/${encodeURIComponent(testId)}`),
};

export async function loginRequest(email: string, password: string) {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Credenciales inválidas' }));
    throw new Error(err.detail ?? 'Credenciales inválidas');
  }

  return res.json() as Promise<{ access_token: string; token_type: string; user: AuthUser }>;
}

export async function registerRequest(
  email: string,
  password: string,
  name: string,
  role: 'athlete' | 'coach',
  product: 'holy-oly' | 'volta'
) {
  const res = await fetch(`${API_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      role: role === 'coach' ? 'coach' : 'athlete',
      product,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al registrarse' }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Error al registrarse');
  }

  return res.json() as Promise<{ access_token: string; token_type: string; user: AuthUser }>;
}

export async function fetchMe(): Promise<AuthUser> {
  return request<AuthUser>('/v1/auth/me');
}

export async function checkBackendAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* WOD Results · Volta CrossFit benchmark tracking                    */
/* ------------------------------------------------------------------ */

export type WodResultScoreType = 'time' | 'rounds_reps' | 'reps' | 'weight';
export type WodResultRxOrScaled = 'rx' | 'scaled';

export interface WodResultCreate {
  wod_name: string;
  rx_or_scaled: WodResultRxOrScaled;
  score_type: WodResultScoreType;
  score_value: number;
  notes?: string | null;
}

export interface WodResultResponse {
  id: string;
  user_id: string;
  wod_name: string;
  rx_or_scaled: WodResultRxOrScaled;
  score_type: WodResultScoreType;
  score_value: number;
  notes?: string | null;
  /** ISO timestamp */
  completed_at: string;
  is_pr: boolean;
}

export const wodResults = {
  /** POST /v1/wod-results · crea + retorna con is_pr calculado */
  create: (body: WodResultCreate) =>
    api.post<WodResultResponse>('/v1/wod-results', body),
  /** GET /v1/wod-results?wod_name=...&limit=... */
  list: (opts?: { wod_name?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.wod_name) params.set('wod_name', opts.wod_name);
    if (opts?.limit !== undefined) params.set('limit', String(opts.limit));
    const qs = params.toString();
    return api.get<WodResultResponse[]>(`/v1/wod-results${qs ? `?${qs}` : ''}`);
  },
  /** GET /v1/wod-results/best/{wod_name}[?rx_or_scaled=rx|scaled] */
  bestFor: (wodName: string, rxOrScaled?: WodResultRxOrScaled) => {
    const qs = rxOrScaled ? `?rx_or_scaled=${rxOrScaled}` : '';
    return api.get<WodResultResponse | null>(
      `/v1/wod-results/best/${encodeURIComponent(wodName)}${qs}`,
    );
  },
  /** DELETE /v1/wod-results/{id} */
  delete: (id: string) =>
    api.delete<void>(`/v1/wod-results/${encodeURIComponent(id)}`),
};

