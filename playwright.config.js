const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for smoke tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker for smoke tests
  
  // Global setup - runs once before all tests EXCEPT auth and registration tests
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: undefined,
  
  reporter: [
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://beta.superconstruct.io',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Reuse saved authentication state for all tests
    storageState: '.auth/user.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Auth tests don't use global setup - they test login itself
    // IMPORTANT: This project must NOT load ANY authentication state
    {
      name: 'auth',
      testMatch: '**/auth/**',
      globalSetup: undefined, // Don't run global setup for auth tests
      use: { 
        baseURL: process.env.BASE_URL || 'https://beta.superconstruct.io',
        trace: 'retain-on-failure',
        screenshot: 'on',
        video: 'retain-on-failure',
        actionTimeout: 15000,
        navigationTimeout: 30000,
        ...devices['Desktop Chrome'],
        // CRITICAL: Explicitly set storageState to false to prevent any auth loading
        storageState: false,
        httpCredentials: undefined,
      },
    },
    // Uncomment for mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration for local testing
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
