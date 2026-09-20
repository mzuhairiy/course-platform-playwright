import { test, expect } from '@playwright/test';
import { SignInPage } from '../../pages/auth/sign-in.page';
import { getCredential } from '../../config/credentials';

test.describe('Sign in', () => {
    test('signing in with a valid profile redirects off the sign-in page', async ({ page }) => {
        const { email, password } = getCredential('student');
        const signIn = new SignInPage(page);

        await signIn.loginAs(email, password);

        await expect(page).not.toHaveURL(/\/sign-in/);
    });

    test('signing in with the wrong password shows an error and stays put', async ({ page }) => {
        const { email } = getCredential('student');
        const signIn = new SignInPage(page);

        await signIn.goto();
        await page.getByTestId('sign-in-email').fill(email);
        await page.getByTestId('sign-in-password').fill('definitely-the-wrong-password');
        await page.getByTestId('sign-in-submit').click();

        expect(await signIn.getErrorMessage()).not.toBe('');
        await expect(page).toHaveURL(/\/sign-in/);
    });
});
