import { chromium } from '@playwright/test';
import fs from 'fs';
import { getEnvironment } from './environments';
import { getAllCredentials } from './credentials';
import { AUTH_DIR, storageStatePath } from './storage-state';
import { SignInPage } from '../pages/auth/sign-in.page';

/**
 * Logs in once per credential profile, ahead of the whole run, and caches
 * each session to .auth/<environment>-<role>.json. Tests that only need
 * "signed in as X" as a precondition should consume that via
 * fixtures/storage.fixture.ts's `authedPage(role)` instead of repeating a
 * UI login.
 *
 * tests/auth/*.spec.ts, tests/smoke/role-dashboards.spec.ts, and
 * tests/rbac/role-landing.spec.ts deliberately keep using the real
 * loginAs()-via-UI fixture — for them, the login (or the redirect it
 * produces) IS the behavior under test, not a precondition to skip past.
 */
export default async function globalSetup() {
    const env = getEnvironment();
    fs.mkdirSync(AUTH_DIR, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    try {
        for (const profile of getAllCredentials()) {
            const context = await browser.newContext({ baseURL: env.baseURL });
            const page = await context.newPage();
            await new SignInPage(page).loginAs(profile.email, profile.password);
            await context.storageState({ path: storageStatePath(profile.role) });
            await context.close();
        }
    } finally {
        await browser.close();
    }
}
