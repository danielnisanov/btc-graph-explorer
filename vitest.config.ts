// vitest.config.ts

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: { reporter: ['text', 'html'] },
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**', 'playwright-report/**', 'test-results/**'],
    testTimeout: 10000, // 10 seconds timeout for each test
    hookTimeout: 15000, // 15 seconds timeout for hooks
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
