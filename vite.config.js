import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const PORT = Number(env.PORT) || 5173

  return {
    plugins: [react()],
    server: {
      port: PORT,
    },
  }
})
