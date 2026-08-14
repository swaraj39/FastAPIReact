import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Only /api/* is forwarded to the backend (with the /api prefix
      // stripped). Page routes (/products, /admin, ...) stay on Vite's
      // SPA fallback so a hard refresh doesn't hit the API and 401.
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
