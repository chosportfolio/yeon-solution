import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/yeon-solution/',
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://127.0.0.1:3001' },
    headers: { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff' },
  },
})
