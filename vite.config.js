import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  base: process.env.VITE_BASE_PATH || "/Financial-Tracker",
  optimizeDeps: {
    exclude: ['@vladmandic/face-api'],
  },
})
