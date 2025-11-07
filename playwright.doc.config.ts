import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration for documentation screenshot generation
 */
export default defineConfig({
  testDir: './tests/doc',
  fullyParallel: false, // Run sequentially for screenshots
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Single worker for consistent screenshots
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'off', // We handle screenshots manually
  },

  projects: [
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1556, height: 974 }, // Custom viewport for screenshot capture
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
