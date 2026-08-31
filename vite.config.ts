/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Relative base so the built app works from any GitHub Pages sub-path
  // (e.g. /second-body/) without hard-coding the repository name anywhere.
  base: './',

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    // Lets you open the dev server from your phone on the same wifi.
    host: true,
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTestEnvironment.ts'],
    // The build-time tools are tested too: the exercise media validator is what
    // stops a broken animation reaching a phone, so it needs to be right.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tools/**/*.test.mjs'],
  },
});
