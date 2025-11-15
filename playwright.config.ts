// playwright.config.ts

import { defineConfig } from '@playwright/test';

export default defineConfig({
  // only look inside tests/e2e
  testDir: 'tests/e2e',
  // only run files that end with .e2e.spec.ts
  testMatch: '**/*.e2e.spec.ts',
  // ignore all unit-test folders
  ignore: ['src/**'],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
});
