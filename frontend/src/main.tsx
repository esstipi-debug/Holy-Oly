import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'

// Deep-link bootstrap · debe correr antes del render para que los providers
// (ProductContext, etc.) lean el localStorage ya con el valor forzado por URL.
//
// `?p=ho`     → pre-setea product = holy-oly
// `?p=volta`  → pre-setea product = volta
// `?demo=1`   → habilita el botón "Entrar en modo Demo" en LOGIN
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
  } catch { /* SSR/private mode · ignore */ }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
