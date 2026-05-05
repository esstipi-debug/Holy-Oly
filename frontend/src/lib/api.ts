const API_URL = import.meta.env.VITE_API_URL ?? 'https://holy-oly-api.onrender.com';

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
  // El backend usa OAuth2PasswordRequestForm (form-urlencoded)
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Credenciales inválidas' }));
    throw new Error(err.detail ?? 'Credenciales inválidas');
  }

  return res.json() as Promise<{ access_token: string; token_type: string; user: { id: string; email: string; role: string } }>;
}
