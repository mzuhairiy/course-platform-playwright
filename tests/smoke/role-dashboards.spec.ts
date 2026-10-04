import { test, expect } from '../../fixtures/roles.fixture';
import { StudentDashboardPage } from '../../pages/student/dashboard.page';
import { InstructorDashboardPage } from '../../pages/instructor/dashboard.page';
import { AdminDashboardPage } from '../../pages/admin/dashboard.page';

/**
 * One smoke test per role, proving the whole chain works together:
 * active environment -> credential profile -> real login -> the dashboard
 * that role actually reaches. A failure here almost always means the
 * environment/credential config is wrong, not the SUT.
 */
test.describe('role dashboards', { tag: ['@smoke', '@rbac'] }, () => {
    test('a student lands on the student dashboard', async ({ page, loginAs }) => {
        // Arrange
        const dashboard = new StudentDashboardPage(page);

        // Act
        await loginAs('student');
        await dashboard.goto();

        // Assert
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('a fresh student lands on the student dashboard', async ({ page, loginAs }) => {
        // Arrange
        const dashboard = new StudentDashboardPage(page);

        // Act
        await loginAs('studentFresh');
        await dashboard.goto();

        // Assert
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('an instructor lands on the instructor dashboard', async ({ page, loginAs }) => {
        // Arrange
        const dashboard = new InstructorDashboardPage(page);

        // Act
        await loginAs('instructor');
        await dashboard.goto();

        // Assert
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('a second instructor profile also reaches the instructor dashboard', async ({
        page,
        loginAs,
    }) => {
        // Arrange
        const dashboard = new InstructorDashboardPage(page);

        // Act
        await loginAs('instructorOther');
        await dashboard.goto();

        // Assert
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('an admin lands on the admin dashboard', async ({ page, loginAs }) => {
        // Arrange
        const dashboard = new AdminDashboardPage(page);

        // Act
        await loginAs('admin');
        await dashboard.goto();

        // Assert
        expect(await dashboard.isLoaded()).toBe(true);
    });
});
