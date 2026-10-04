import { test, expect } from '../../fixtures/storage.fixture';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { ENROLLED_SEED_COURSE, FREE_COURSE, PAID_COURSE } from '../../support/test-data';

test.describe('Course detail', () => {
    test('a course page shows its curriculum', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courseDetail = new CourseDetailPage(page);

        // Act
        await courseDetail.goto(FREE_COURSE.slug);

        // Assert
        expect(await courseDetail.getCurriculumSectionCount()).toBeGreaterThan(0);
        expect(await courseDetail.getCurriculumLectureCount()).toBeGreaterThan(0);
    });

    test('an enrolled student sees continue, not enrol', { tag: '@dev-only' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('student');
        const courseDetail = new CourseDetailPage(page);

        // Act
        await courseDetail.goto(ENROLLED_SEED_COURSE.slug);

        // Assert
        expect(await courseDetail.getCallToActionLabel()).toBe('Continue Learning');
    });

    test('a paid course offers checkout, not direct enrolment', { tag: '@dev-only' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('studentFresh');
        const courseDetail = new CourseDetailPage(page);

        // Act
        await courseDetail.goto(PAID_COURSE.slug);

        // Assert
        expect(await courseDetail.getCallToActionLabel()).toMatch(/^Buy for/);
    });
});
