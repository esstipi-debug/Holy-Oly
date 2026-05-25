const API_URL = import.meta.env.VITE_API_URL ?? 'https://holy-oly-api.onrender.com';

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

  return res.json();
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  get: <T>(path: string) => request<T>(path),
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

