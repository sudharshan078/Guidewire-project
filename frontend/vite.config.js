import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/user': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/policy': 'http://localhost:8000',
      '/claims': 'http://localhost:8000',
      '/fraud': 'http://localhost:8000',
      '/payment': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
    }
  }
})
