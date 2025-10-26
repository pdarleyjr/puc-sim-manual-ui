import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'safari >= 13'],
    }),
  ],
  base: '/puc-sim-manual-ui/',
  build: {
    target: 'es2018',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
