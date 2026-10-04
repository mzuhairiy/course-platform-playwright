import { Page } from '@playwright/test';
import { test as base } from './storage.fixture';
import { SignUpPage } from '../pages/auth/sign-up.page';
import { THROWAWAY_NAME, THROWAWAY_PASSWORD, uniqueEmail } from '../support/unique';

export interface ThrowawayStudent {
    page: Page;
    email: string;
}

type StudentFixtures = {
    /**
     * Signs up a brand-new student in its own browser context and hands back
     * their `page`, already signed in (sign-up auto-logs-in; no email
     * verification). The student is guaranteed to own nothing, so a
     * @mutating test can enrol/buy/review without touching a shared seed
     * account (§9.1). Call it twice for a test that needs two different users.
     * Every context is closed after the test.
     */
    newStudent: () => Promise<Page>;

    /** Same as `newStudent`, for the tests that also need to find the account (e.g. an admin looking it up). */
    newStudentAccount: () => Promise<ThrowawayStudent>;
};

export const test = base.extend<StudentFixtures>({
    newStudentAccount: async ({ browser }, use) => {
        const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];

        await use(async () => {
            const context = await browser.newContext();
            contexts.push(context);
            const page = await context.newPage();
            const email = uniqueEmail();
            await new SignUpPage(page).signUpAs(THROWAWAY_NAME, email, THROWAWAY_PASSWORD);
            return { page, email };
        });

        await Promise.all(contexts.map((context) => context.close()));
    },

    newStudent: async ({ newStudentAccount }, use) => {
        await use(async () => (await newStudentAccount()).page);
    },
});

export { expect } from '@playwright/test';
