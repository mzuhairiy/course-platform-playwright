import { test, expect } from '../../fixtures/student.fixture';
import { getCredential } from '../../config/credentials';
import { AdminUsersPage } from '../../pages/admin/users.page';
import { SignInPage } from '../../pages/auth/sign-in.page';
import { InstructorDashboardPage } from '../../pages/instructor/dashboard.page';
import { ForbiddenPage } from '../../pages/shared/forbidden.page';
import { NavbarPage } from '../../pages/shared/navbar.page';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';
import { THROWAWAY_PASSWORD } from '../../support/unique';

/**
 * Role changes act on a throwaway student signed up for the test — never on a
 * seed account. Three browser projects run in parallel against one database,
 * so promoting (then restoring) a shared seed student would let each project
 * change the role under the others mid-test.
 */
test.describe('Admin user management', () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('an admin can list every user', { tag: '@smoke' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('admin');
        const users = new AdminUsersPage(page);

        // Act
        await users.goto();

        // Assert
        expect(await users.getListedRoles()).toEqual(expect.arrayContaining(['STUDENT', 'INSTRUCTOR', 'ADMIN']));
    });

    test('an admin can promote a student to instructor', { tag: '@mutating' }, async ({ authedPage, newStudentAccount }) => {
        // Arrange
        const { email } = await newStudentAccount();
        const users = new AdminUsersPage(await authedPage('admin'));
        await users.goto();

        // Act
        await users.changeRole(email, 'INSTRUCTOR');

        // Assert
        expect(await users.getRole(email)).toBe('INSTRUCTOR');
    });

    test('an admin cannot change their own role', { tag: ['@smoke', '@negative'] }, async ({ authedPage }) => {
        // Arrange
        const { email } = getCredential('admin');
        const users = new AdminUsersPage(await authedPage('admin'));

        // Act
        await users.goto();

        // Assert
        expect(await users.isRoleEditable(email)).toBe(false);
    });

    /**
     * Only the *withdrawal* direction applies to a live session: the SUT
     * re-reads the role from the DB per request on the server side (BUG-002),
     * but the edge middleware that gates /instructor still trusts the role in
     * the session token — so a newly *granted* role only shows up after the
     * next sign-in. That asymmetry is why the student here signs in again after
     * the promotion, then loses the role without signing in again.
     */
    test('withdrawing a role takes effect without a re-login', { tag: ['@mutating', '@rbac'] }, async ({ authedPage, newStudentAccount }) => {
        // Arrange
        const student = await newStudentAccount();
        const users = new AdminUsersPage(await authedPage('admin'));
        const instructorArea = new InstructorDashboardPage(student.page);
        const forbidden = new ForbiddenPage(student.page);
        await users.goto();
        await users.changeRole(student.email, 'INSTRUCTOR');
        await new NavbarPage(student.page).signOut();
        await new SignInPage(student.page).loginAs(student.email, THROWAWAY_PASSWORD);
        await instructorArea.waitForLoad();
        await users.changeRole(student.email, 'STUDENT');

        // Act — the student's still-open session, no sign-in in between.
        await instructorArea.visit();

        // Assert
        expect(await forbidden.isVisible()).toBe(true);
    });
});
