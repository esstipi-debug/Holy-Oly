import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend deployed en Render con CORS estricto que NO permite localhost.
// Para dev, proxy server-to-server bypasea CORS. En build prod, VITE_API_URL
// debe apuntar al backend directo (y CORS_ORIGINS debe incluir el host del front).
const BACKEND = 'https://holy-oly-3.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1':     { target: BACKEND, changeOrigin: true, secure: true },
      '/health': { target: BACKEND, changeOrigin: true, secure: true },
    },
  },
})
