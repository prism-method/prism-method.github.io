import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base = '/';

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
})

