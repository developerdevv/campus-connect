import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Vite doesn't load .env files into process.env before evaluating config.
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = env.VITE_API_PROXY
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      // In live mode, proxy relative /api/* calls to the backend if configured.
      proxy: apiProxy ? { '/api': { target: apiProxy, changeOrigin: true } } : undefined,
    },
  }
})
