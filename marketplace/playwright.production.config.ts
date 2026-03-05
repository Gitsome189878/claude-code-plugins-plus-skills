import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for PRODUCTION E2E tests
 * Runs against live tonsofskills.com — no local server needed
 */
export default defineConfig({
  testDir: './tests/production',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,

  reporter: process.env.CI
    ? [['html', { outputFolder: 'test-results/production-report' }], ['github'], ['list']]
    : [['html', { outputFolder: 'test-results/production-report' }], ['list']],

  use: {
    baseURL: 'https://tonsofskills.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Production timeouts — network latency expected
    navigationTimeout: 15000,
    actionTimeout: 10000,
  },

  // Longer timeout for production network calls
  timeout: 30000,

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    // WebKit requires system libs (libgtk-4, etc.) — only enable in CI
    ...(process.env.CI ? [{
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
      },
    }] : []),
  ],

  // No webServer — tests hit production directly
});
