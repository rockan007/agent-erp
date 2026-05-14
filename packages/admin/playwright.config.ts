import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
  },
  webServer: {
    command: 'pnpm --filter @erp/admin dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
