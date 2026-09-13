import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/proxy/28tech': {
        target: 'https://blog.28tech.com.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/28tech/, '')
      }
    }
  }
})
