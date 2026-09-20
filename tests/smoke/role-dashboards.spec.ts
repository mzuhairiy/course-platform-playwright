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
test.describe('@smoke role dashboards', () => {
    test('a student lands on the student dashboard', async ({ page, loginAs }) => {
        await loginAs('student');
        const dashboard = new StudentDashboardPage(page);
        await dashboard.goto();
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('a fresh student lands on the student dashboard', async ({ page, loginAs }) => {
        await loginAs('studentFresh');
        const dashboard = new StudentDashboardPage(page);
        await dashboard.goto();
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('an instructor lands on the instructor dashboard', async ({ page, loginAs }) => {
        await loginAs('instructor');
        const dashboard = new InstructorDashboardPage(page);
        await dashboard.goto();
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('a second instructor profile also reaches the instructor dashboard', async ({
        page,
        loginAs,
    }) => {
        await loginAs('instructorOther');
        const dashboard = new InstructorDashboardPage(page);
        await dashboard.goto();
        expect(await dashboard.isLoaded()).toBe(true);
    });

    test('an admin lands on the admin dashboard', async ({ page, loginAs }) => {
        await loginAs('admin');
        const dashboard = new AdminDashboardPage(page);
        await dashboard.goto();
        expect(await dashboard.isLoaded()).toBe(true);
    });
});
