import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    // Configuration spécifique pour Firebase
    proxy: {
      // Proxy pour éviter les erreurs CORS avec Firebase
    }
  },
  // Configuration pour Firebase Web SDK
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Fixes pour Firebase dans Vite
      'util': 'util'
    }
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore']
  }
})