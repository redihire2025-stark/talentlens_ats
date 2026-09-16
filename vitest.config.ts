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
      // Vitest runs tests in a real Node.js process (jsdom only polyfills
      // window/document into it), so Vite resolves packages by their Node
      // build, not their "browser" package.json field the way a real
      // browser build does. mammoth's Node build (lib/unzip.js) only
      // understands { path | buffer | file }, not the { arrayBuffer }
      // shape our browser-only code passes — so under test, force
      // resolution to the same browser bundle real usage gets.
      mammoth: path.resolve(__dirname, 'node_modules/mammoth/mammoth.browser.js'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
  },
})
