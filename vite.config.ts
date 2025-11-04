import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/songs': 'http://127.0.0.1:8788',
      '/get-ranking': 'http://127.0.0.1:8788',
      '/log-search': 'http://127.0.0.1:8788',
    }
  }
})
