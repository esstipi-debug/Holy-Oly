const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'holyoly_token';

export type Role = 'admin' | 'coach' | 'athlete';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  form?: boolean;
}

export async function request<T = unknown>(
  path: string,
  { body, auth = true, form = false, headers, ...rest }: RequestOptions = {}
): Promise<T> {
  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  if (auth) {
    const token = tokenStore.get();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (form) {
      h['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(body as Record<string, string>).toString();
    } else {
      h['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers: h, body: payload });
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    throw new ApiError(res.status, (data as { detail?: string } | null)?.detail || res.statusText, data);
  }
  return data as T;
}

function safeJson(t: string): unknown {
  try { return JSON.parse(t); } catch { return t; }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) => request<T>(p, { method: 'POST', body }),
  put: <T>(p: string, body?: unknown) => request<T>(p, { method: 'PUT', body }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),

  auth: {
    login: (email: string, password: string) =>
      request<LoginResponse>('/v1/auth/login', {
        method: 'POST',
        auth: false,
        form: true,
        body: { username: email, password },
      }),
    me: () => request<User>('/v1/auth/me'),
    refresh: () => request<LoginResponse>('/v1/auth/refresh', { method: 'POST' }),
  },
};
