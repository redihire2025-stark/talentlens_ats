import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Separate from vite.config.ts on purpose: that file is managed by the
// Figma Make dev-server harness (custom plugins, fixed port) and isn't a
// place to layer test-runner concerns. This config only needs the same
// React + '@' alias setup for component tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
})
