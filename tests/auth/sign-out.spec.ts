import { test, expect } from '../../fixtures/roles.fixture';
import { NavbarPage } from '../../pages/shared/navbar.page';

test.describe('Sign out', { tag: '@smoke' }, () => {
    test('signing out returns the visitor to a public page', async ({ page, loginAs }) => {
        // Arrange
        const navbar = new NavbarPage(page);

        // Act
        await loginAs('student');
        await navbar.signOut();

        // Assert
        await expect(page).toHaveURL('/');
    });
});
