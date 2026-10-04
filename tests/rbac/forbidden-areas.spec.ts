import { test, expect } from '../../fixtures/storage.fixture';
import { Role } from '../../config/credentials';
import { ForbiddenPage } from '../../pages/shared/forbidden.page';

const INSTRUCTOR_AREA_PATH = '/instructor';
const ADMIN_AREA_PATH = '/admin';

/**
 * Role-gate matrix only — crossing into another role's *area*. Resource-
 * ownership RBAC (one instructor's course editor vs another's) is covered in
 * course-ownership.spec.ts.
 */
const FORBIDDEN_MATRIX: Array<{ role: Role; path: string; title: string }> = [
    {
        role: 'student',
        path: INSTRUCTOR_AREA_PATH,
        title: 'a student opening the instructor area sees the forbidden page',
    },
    {
        role: 'student',
        path: ADMIN_AREA_PATH,
        title: 'a student opening the admin area sees the forbidden page',
    },
    {
        role: 'instructor',
        path: ADMIN_AREA_PATH,
        title: 'an instructor opening the admin area sees the forbidden page',
    },
];

test.describe('Forbidden areas', { tag: ['@smoke', '@rbac'] }, () => {
    for (const { role, path, title } of FORBIDDEN_MATRIX) {
        test(title, async ({ authedPage }) => {
            // Arrange
            const page = await authedPage(role);
            const forbidden = new ForbiddenPage(page);

            // Act
            await page.goto(path);

            // Assert
            expect(await forbidden.isVisible()).toBe(true);
        });
    }
});
