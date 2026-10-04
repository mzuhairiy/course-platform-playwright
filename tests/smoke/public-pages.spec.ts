import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/marketing/home.page';
import { CoursesPage } from '../../pages/student/courses.page';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { NotFoundPage } from '../../pages/shared/not-found.page';
import { FREE_COURSE } from '../../support/test-data';

const UNKNOWN_ROUTE = '/this-route-does-not-exist';

test.describe('Public pages', { tag: '@smoke' }, () => {
    test('the landing page renders its primary call to action', async ({ page }) => {
        // Arrange
        const home = new HomePage(page);

        // Act
        await home.goto();

        // Assert
        expect(await home.isPrimaryCallToActionVisible()).toBe(true);
    });

    test('the course catalogue renders for an anonymous visitor', async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.goto();

        // Assert
        expect(await courses.getVisibleCourseCount()).toBeGreaterThan(0);
    });

    test('a course detail page renders for an anonymous visitor', async ({ page }) => {
        // Arrange
        const courseDetail = new CourseDetailPage(page);

        // Act
        await courseDetail.goto(FREE_COURSE.slug);

        // Assert
        expect(await courseDetail.getCallToActionLabel()).toBe('Sign in to enroll');
    });

    test('an unknown route renders the not-found page', async ({ page }) => {
        // Arrange
        const notFound = new NotFoundPage(page);

        // Act
        await page.goto(UNKNOWN_ROUTE);

        // Assert
        expect(await notFound.isVisible()).toBe(true);
    });
});
