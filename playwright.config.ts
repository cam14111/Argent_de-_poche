import { defineConfig, devices } from '@playwright/test'

// L'application est servie sous le base path /Argent_de-_poche/ (GitHub Pages).
const BASE_URL = 'http://localhost:5173/Argent_de-_poche/'

// En environnement conteneur/CI, Chromium peut être pré-installé à un
// emplacement fixe. On le pointe via PLAYWRIGHT_CHROMIUM_PATH si défini.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
