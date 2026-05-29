// API URL · siempre backend real holy-oly-3 (CORS abierto en backend).
// Override con VITE_API_URL si querés apuntar a otra instancia.
const API_URL = import.meta.env.VITE_API_URL ?? 'https://holy-oly-3.onrender.com';

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
    // El demo corre OFFLINE: el token 'demo' no es JWT → el backend responde 401
    // "Token inválido o expirado". No mostramos ese error crudo (alarma sin sentido
    // en el demo): lo convertimos en un mensaje benigno para que los componentes
    // caigan a su estado vacío en vez de un error rojo.
    if (res.status === 401 && token === 'demo') {
      throw new Error('Sin datos en vivo · demo offline');
    }
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
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
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

/* ------------------------------------------------------------------ */
/* Macrocycle Deviations · 5 tipos de desvío del plan                 */
/* ------------------------------------------------------------------ */

export type DeviationType =
  | 'load_deviation'
  | 'intensity_low'
  | 'intensity_high'
  | 'skip'
  | 'early_termination';

export type DeviationSeverity = 'low' | 'medium' | 'high';

export interface DeviationItem {
  type: DeviationType;
  session_date: string;
  expected: string;
  actual: string;
  delta: string;
  severity: DeviationSeverity;
  explanation: string;
}

export interface WeekDeviations {
  week: number;
  week_start: string;
  deviations: DeviationItem[];
}

export interface DeviationsResponse {
  macro_id: string;
  athlete_id: string;
  weeks_analyzed: number;
  summary: {
    total_deviations: number;
    severity: DeviationSeverity;
    by_type: Partial<Record<DeviationType, number>>;
  };
  weeks: WeekDeviations[];
  recommendation: string;
  data_source: 'db' | 'empty';
}

export const deviationsApi = {
  /**
   * GET /v1/macrocycles/{macro_id}/deviations?weeks=N&athlete_id=UUID
   * Coach DEBE pasar athlete_id · atleta puede omitirlo (default = self).
   */
  get: (opts: { macro_id: string; weeks?: number; athlete_id?: string }) => {
    const params = new URLSearchParams();
    if (opts.weeks !== undefined) params.set('weeks', String(opts.weeks));
    if (opts.athlete_id) params.set('athlete_id', opts.athlete_id);
    const qs = params.toString();
    return api.get<DeviationsResponse>(
      `/v1/macrocycles/${encodeURIComponent(opts.macro_id)}/deviations${qs ? `?${qs}` : ''}`,
    );
  },
};

/* ------------------------------------------------------------------ */
/* Weekly Analytics · análisis semanal del atleta para el coach       */
/* ------------------------------------------------------------------ */

export type AnalyticsTrend = 'up' | 'down' | 'flat';

export interface WeekAnalytics {
  week_start: string;
  tonelaje_kg: number;
  avg_intensity_pct: number;
  adherence_pct: number;
  avg_rpe: number;
  zone_distribution: {
    liviano: number;
    tecnico: number;
    fuerza: number;
    maximo: number;
  };
  focus_distribution: {
    olympic: number;
    strength: number;
    accessory: number;
    metcon: number;
    rest: number;
  };
  sessions_completed: number;
  sessions_planned: number;
}

export interface WeeklyAnalyticsResponse {
  athlete_id: string;
  weeks_analyzed: number;
  weeks: WeekAnalytics[];
  trends: {
    tonelaje_trend: AnalyticsTrend;
    intensity_trend: AnalyticsTrend;
    adherence_trend: AnalyticsTrend;
    rpe_trend: AnalyticsTrend;
    alert: string | null;
  };
  data_source: 'db' | 'empty';
}

export const analyticsApi = {
  /** GET /v1/analytics/athlete/{athlete_id}/weekly?weeks=N */
  weekly: (athleteId: string, weeks = 8) =>
    api.get<WeeklyAnalyticsResponse>(
      `/v1/analytics/athlete/${encodeURIComponent(athleteId)}/weekly?weeks=${weeks}`,
    ),
};

/* ------------------------------------------------------------------ */
/* Manual Sessions · coach asigna entrenamiento ad-hoc del día        */
/* ------------------------------------------------------------------ */

export type ManualSessionSlot = 'am' | 'pm' | 'full';
export type ManualSessionFocus = 'technique' | 'strength' | 'olympic' | 'accessory' | 'metcon';
export type ManualSessionMaxKey = 'snatch' | 'clean' | 'jerk' | 'back_squat' | 'front_squat';

export interface ManualSessionExercise {
  name: string;
  sets: number;
  reps: number;
  pct: number;
  max_key: ManualSessionMaxKey;
}

export interface ManualSessionCreate {
  athlete_id: string;
  date: string;          // ISO yyyy-mm-dd
  slot?: ManualSessionSlot;
  focus: ManualSessionFocus;
  exercises: ManualSessionExercise[];
  note?: string | null;
}

export interface ManualSessionPatch {
  slot?: ManualSessionSlot;
  focus?: ManualSessionFocus;
  exercises?: ManualSessionExercise[];
  note?: string | null;
}

export interface ManualSessionResponse {
  id: string;
  athlete_id: string;
  coach_id: string;
  date: string;
  slot: ManualSessionSlot;
  focus: ManualSessionFocus;
  exercises: ManualSessionExercise[];
  note?: string | null;
  created_at: string;
  coach_name?: string | null;
}

export const manualSessionsApi = {
  /** POST /v1/manual-sessions · coach asigna · 201 */
  create: (body: ManualSessionCreate) =>
    api.post<ManualSessionResponse>('/v1/manual-sessions', body),
  /** GET /v1/manual-sessions?athlete_id=&from=&to= */
  list: (opts?: { athlete_id?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (opts?.athlete_id) params.set('athlete_id', opts.athlete_id);
    if (opts?.from) params.set('from', opts.from);
    if (opts?.to) params.set('to', opts.to);
    const qs = params.toString();
    return api.get<ManualSessionResponse[]>(`/v1/manual-sessions${qs ? `?${qs}` : ''}`);
  },
  /** GET /v1/manual-sessions/me/today · atleta */
  meToday: () => api.get<ManualSessionResponse[]>('/v1/manual-sessions/me/today'),
  /** PATCH /v1/manual-sessions/{id} */
  patch: (id: string, body: ManualSessionPatch) =>
    api.patch<ManualSessionResponse>(`/v1/manual-sessions/${encodeURIComponent(id)}`, body),
  /** DELETE /v1/manual-sessions/{id} */
  delete: (id: string) =>
    api.delete<void>(`/v1/manual-sessions/${encodeURIComponent(id)}`),
};
