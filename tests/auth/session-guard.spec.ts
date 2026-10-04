import { test, expect } from '@playwright/test';
import { SignInPage } from '../../pages/auth/sign-in.page';

const PROTECTED_PATH = '/dashboard';

test.describe('Session guard', { tag: ['@smoke', '@rbac'] }, () => {
    test('a signed-out visitor hitting a protected page is sent to sign-in', async ({ page }) => {
        // Arrange
        const signIn = new SignInPage(page);

        // Act
        await page.goto(PROTECTED_PATH);
        await signIn.waitForLoad();

        // Assert
        const url = new URL(page.url());
        expect(url.pathname).toBe('/sign-in');
        expect(url.searchParams.get('callbackUrl')).toBe(PROTECTED_PATH);
    });
});
