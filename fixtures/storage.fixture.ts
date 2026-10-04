import { test as base, BrowserContext, Page } from '@playwright/test';
import { Role } from '../config/credentials';
import { storageStatePath } from '../config/storage-state';

type StorageFixtures = {
    /**
     * Hands back a `page` that's already signed in as `role`, loaded from
     * the storageState global-setup.ts cached — no UI login inside the test.
     *
     *   test('a student opening the instructor area sees the forbidden page',
     *     async ({ authedPage }) => {
     *       const page = await authedPage('student');
     *       await page.goto('/instructor');
     *     });
     *
     * Each call opens its own browser context (storageState can only be
     * applied at context-creation time, unlike the ambient `page` fixture),
     * closed automatically after the test.
     */
    authedPage: (role: Role) => Promise<Page>;
};

export const test = base.extend<StorageFixtures>({
    authedPage: async ({ browser }, use) => {
        const contexts: BrowserContext[] = [];

        await use(async (role: Role) => {
            const context = await browser.newContext({ storageState: storageStatePath(role) });
            contexts.push(context);
            return context.newPage();
        });

        await Promise.all(contexts.map((context) => context.close()));
    },
});

export { expect } from '@playwright/test';
