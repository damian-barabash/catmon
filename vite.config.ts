import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      // GitHub Pages SPA fallback: serve index.html for unknown routes.
      name: 'spa-404',
      closeBundle() {
        try { copyFileSync('dist/index.html', 'dist/404.html') } catch { /* dev */ }
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'], motion: ['framer-motion'], md: ['marked'] },
      },
    },
  },
})
