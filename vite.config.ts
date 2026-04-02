import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy table: maps URL prefix → backend service
// Order matters — more specific prefixes must come first.
const proxy = (target: string) => ({ target, changeOrigin: true })

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1/admin':       proxy('http://localhost:8084'),
      '/api/v1/tickets':     proxy('http://localhost:8084'),
      '/api/v1/auth':        proxy('http://localhost:8081'),
      '/api/v1/users/me':    proxy('http://localhost:8081'),
      '/api/v1/users':       proxy('http://localhost:8084'),
      '/api/v1/roles':       proxy('http://localhost:8084'),
      '/api/v1/permissions': proxy('http://localhost:8084'),
    },
  },
})
