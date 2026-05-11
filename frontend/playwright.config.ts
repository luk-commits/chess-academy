import { defineConfig, devices } from '@playwright/test';

const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Zapobiega zatrzymaniu testów przy jednym błędzie (przydatne w CI)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test-results/playwright-report' }]],
  
  use: {
    // Adres Twojej usługi frontendowej widziany z poziomu hosta (Linux Mint)
    baseURL: 'http://localhost:5173',
    // Zbieraj ślady (trace) tylko przy powtórnej próbie błędu, by oszczędzać zasoby
    trace: 'on-first-retry',
    // Ustawienie na false pozwoliłoby Ci widzieć przeglądarkę (wymaga GUI)
    headless: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? {
              launchOptions: {
                executablePath: chromiumExecutablePath,
                args: ['--no-sandbox', '--disable-dev-shm-usage'],
              },
            }
          : {}),
      },
    },
  ],
});
