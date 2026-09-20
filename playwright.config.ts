import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './config/environments';

// getEnvironment() (via config/load-env.ts) has already loaded .env.<TEST_ENV>
// and .env by the time this line runs — see load-env.ts for why the loading
// lives there instead of here.
const env = getEnvironment();

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    timeout: env.timeout,
    retries: env.retries,
    workers: env.workers,
    reporter: [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list'],
    ],

    use: {
        baseURL: env.baseURL,
        headless: env.headless,
        trace: env.trace,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    // Printed once per run in the HTML report's metadata — a quick way to
    // confirm which environment a run actually targeted.
    metadata: {
        environment: env.name,
        baseURL: env.baseURL,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
