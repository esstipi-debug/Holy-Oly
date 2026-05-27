import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

// Deep-link bootstrap · debe correr antes del render para que los providers
// (ProductContext, etc.) lean el localStorage ya con el valor forzado por URL.
//
// `?p=ho`        → pre-setea product = holy-oly
// `?p=volta`     → pre-setea product = volta
// `?demo=1`      → habilita el botón "Entrar en modo Demo" en LOGIN
// `?demo=1&auto=1` → auto-loguea como atleta demo · skipea LOGIN
(() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const productFromUrl = params.get('p');
    if (productFromUrl === 'ho') {
      localStorage.setItem('product:current', 'holy-oly');
    } else if (productFromUrl === 'volta') {
      localStorage.setItem('product:current', 'volta');
    }
    const demoMode = params.get('demo') === '1';
    localStorage.setItem('app:demo_mode', demoMode ? '1' : '0');

    // Auto-demo: pre-popula auth en localStorage antes que AuthProvider lea
    const autoDemo = demoMode && params.get('auto') === '1';
    if (autoDemo) {
      const DEMO_USER = {
        id: 'demo-athlete-1',
        email: 'demo@holyoly.com',
        name: 'Demo Atleta',
        role: 'athlete',
        product: localStorage.getItem('product:current') || 'holy-oly',
      };
      localStorage.setItem('demoMode', '1');
      localStorage.setItem('token', 'demo');
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
    }
  } catch { /* SSR/private mode · ignore */ }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
