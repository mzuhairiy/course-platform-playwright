import { test, expect } from '@playwright/test';
import { SignUpPage } from '../../pages/auth/sign-up.page';
import { StudentDashboardPage } from '../../pages/student/dashboard.page';
import { getCredential } from '../../config/credentials';
import { THROWAWAY_NAME, THROWAWAY_PASSWORD, uniqueEmail } from '../../support/unique';

/**
 * Sign-up can't be undone from the UI, so the account a test creates is left
 * behind — uniquely named, never reused (§9 poin 1).
 */
test.describe('Sign up', { tag: '@mutating' }, () => {
    test('signing up with a fresh email creates a student account', async ({ page }) => {
        // Arrange
        const signUp = new SignUpPage(page);
        const dashboard = new StudentDashboardPage(page);

        // Act
        await signUp.signUpAs(THROWAWAY_NAME, uniqueEmail(), THROWAWAY_PASSWORD);
        await dashboard.waitForLoad();

        // Assert
        await expect(page).toHaveURL('/dashboard');
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('signing up with an existing email is rejected', async ({ page }) => {
        // Arrange
        const { email } = getCredential('student');
        const signUp = new SignUpPage(page);

        // Act
        await signUp.attemptSignUpAs(THROWAWAY_NAME, email, THROWAWAY_PASSWORD);

        // Assert
        expect(await signUp.getFormError()).not.toBe('');
        await expect(page).toHaveURL(/\/sign-up/);
    });
});
