import { test, expect } from '@playwright/test';
import { SignInPage } from '../../pages/auth/sign-in.page';
import { getCredential } from '../../config/credentials';

const UNKNOWN_EMAIL = 'nobody-has-this-address@example.com';
const WRONG_PASSWORD = 'definitely-the-wrong-password';

test.describe('Sign in', { tag: '@smoke' }, () => {
    test('signing in with a valid profile redirects off the sign-in page', async ({ page }) => {
        // Arrange
        const { email, password } = getCredential('student');
        const signIn = new SignInPage(page);

        // Act
        await signIn.loginAs(email, password);

        // Assert
        await expect(page).not.toHaveURL(/\/sign-in/);
    });

    test('signing in with the wrong password shows an error and stays put', async ({ page }) => {
        // Arrange
        const { email } = getCredential('student');
        const signIn = new SignInPage(page);

        // Act
        await signIn.attemptLoginAs(email, WRONG_PASSWORD);

        // Assert
        expect(await signIn.getErrorMessage()).not.toBe('');
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('signing in with an unknown email shows an error', async ({ page }) => {
        // Arrange
        const { password } = getCredential('student');
        const signIn = new SignInPage(page);

        // Act
        await signIn.attemptLoginAs(UNKNOWN_EMAIL, password);

        // Assert
        expect(await signIn.getErrorMessage()).not.toBe('');
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('the sign-in page rejects an empty submission', async ({ page }) => {
        // Arrange
        const signIn = new SignInPage(page);

        // Act
        await signIn.submitEmpty();

        // Assert
        const fieldErrors = await signIn.getFieldErrors();
        expect(fieldErrors.email).not.toBe('');
        expect(fieldErrors.password).not.toBe('');
        await expect(page).toHaveURL(/\/sign-in/);
    });
});
