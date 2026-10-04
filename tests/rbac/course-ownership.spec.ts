import { test, expect } from '../../fixtures/storage.fixture';
import { CourseEditPage } from '../../pages/instructor/course-edit.page';
import { ForbiddenPage } from '../../pages/shared/forbidden.page';
import { INSTRUCTOR_OWNED_COURSE } from '../../support/test-data';

/**
 * Resource-ownership RBAC — the other half of forbidden-areas.spec.ts, which
 * only covers crossing into another role's *area*. Both tests read the seed
 * course `instructor` owns, so they need the seed (@dev-only).
 */
test.describe('Course ownership', { tag: ['@dev-only', '@rbac'] }, () => {
    test('an instructor cannot open another instructor\'s course editor', async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('instructorOther');
        const edit = new CourseEditPage(page);
        const forbidden = new ForbiddenPage(page);

        // Act
        await edit.goto(INSTRUCTOR_OWNED_COURSE.id);

        // Assert
        expect(await forbidden.isVisible()).toBe(true);
        expect(await edit.isLoaded()).toBe(false);
    });

    test('an admin can open any instructor\'s course editor', async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('admin');
        const edit = new CourseEditPage(page);

        // Act
        await edit.goto(INSTRUCTOR_OWNED_COURSE.id);
        await edit.waitForLoad();

        // Assert
        expect(await edit.isLoaded()).toBe(true);
    });
});
