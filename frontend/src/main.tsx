import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

// API URL para auto-demo login · usa siempre el backend prod para evitar
// problemas de proxy en dev (lib/api.ts maneja otra estrategia para runtime).
const AUTH_API = import.meta.env.VITE_API_URL ?? 'https://holy-oly-3.onrender.com';

// Deep-link bootstrap · debe correr antes del render para que los providers
// (ProductContext, etc.) lean el localStorage ya con el valor forzado por URL.
//
// `?p=ho`           → pre-setea product = holy-oly
// `?p=volta`        → pre-setea product = volta
// `?demo=1`         → habilita el botón "Entrar en modo Demo" en LOGIN
// `?demo=1&auto=1`  → auto-loguea de verdad contra backend (POST /v1/auth/login)
//                      con user demo · skipea pantalla LOGIN · va a HOME real
//                      conectado al backend + DB.

function readParams() {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

function syncProductLocal(params: URLSearchParams) {
  const p = params.get('p');
  if (p === 'ho') localStorage.setItem('product:current', 'holy-oly');
  else if (p === 'volta') localStorage.setItem('product:current', 'volta');
}

async function autoDemoLogin(): Promise<boolean> {
  // Login real al backend con user demo (creado vía /v1/auth/register la primera vez).
  // Devuelve true si el login fue OK · si falla, mostrá LOGIN normal y dejá que el
  // user use el botón "Entrar en modo Demo" del UI.
  try {
    const body = new URLSearchParams();
    body.set('username', 'demo@holyoly.com');
    body.set('password', 'demo1234');
    const res = await fetch(`${AUTH_API}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data?.access_token) return false;
    localStorage.setItem('token', data.access_token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    localStorage.setItem('demoMode', '1');
    return true;
  } catch {
    return false;
  }
}

async function bootstrap() {
  const params = readParams();
  syncProductLocal(params);
  const demoMode = params.get('demo') === '1';
  localStorage.setItem('app:demo_mode', demoMode ? '1' : '0');

  if (demoMode && params.get('auto') === '1') {
    const ok = await autoDemoLogin();
    if (ok) {
      // Aterriza en el HOME REAL del producto (HO o Volta) · NO override a DEMO_HUB.
      // Si Boss quiere ver progreso UI nuevo, abre #demo_hub explícito.
      if (!window.location.hash) {
        const product = localStorage.getItem('product:current') ?? 'holy-oly';
        const targetHash = product === 'volta' ? '#volta_home' : '#home';
        window.location.hash = targetHash;
        const targetView = product === 'volta' ? 'VOLTA_HOME' : 'HOME';
        localStorage.setItem('nav:currentView', targetView);
      }
    } else {
      // Login falló · deja que el user vea LOGIN (probablemente backend frío).
      // eslint-disable-next-line no-console
      console.warn('[auto-demo] login falló · backend down o credenciales mal');
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
