import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the built site served by `astro preview`. The
// port stays away from 4321, the dev server's default, so the two never collide.
const PORT = 4322;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: CI,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // In CI, use the Chrome preinstalled on the runner instead of downloading one.
    channel: CI ? 'chrome' : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --ignore-lock keeps the server in the foreground, where Playwright can
    // manage it: Astro otherwise backgrounds it when it detects an AI agent, and
    // it skips the lock file so a preview you already have open does not clash.
    command: `pnpm exec astro preview --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
  },
});
