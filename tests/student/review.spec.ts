import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/student.fixture';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { enrollInFreeCourse } from '../../support/flows';
import { REVIEW_COURSE } from '../../support/test-data';
import { uniqueName } from '../../support/unique';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

/**
 * Reviews land on a shared seed course, so each test removes the review it
 * wrote (§9 poin 2) — otherwise every run would leave another student's
 * rating in the course's public average. The page is kept at module scope so
 * `afterEach` can reach it; hooks run even when the test failed.
 */
let reviewerPage: Page | undefined;

test.afterEach(async () => {
    if (!reviewerPage) return;
    const courseDetail = new CourseDetailPage(reviewerPage);
    await courseDetail.goto(REVIEW_COURSE.slug);
    if (await courseDetail.isReviewOfferedAsEdit()) {
        await courseDetail.deleteReview();
    }
    reviewerPage = undefined;
});

test.describe('Review', () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('an enrolled student can leave a review', { tag: '@mutating' }, async ({ newStudent }) => {
        // Arrange
        const page = (reviewerPage = await newStudent());
        const courseDetail = new CourseDetailPage(page);
        const comment = uniqueName('Materinya jelas dan runut.');
        await enrollInFreeCourse(page, REVIEW_COURSE.slug);
        await courseDetail.goto(REVIEW_COURSE.slug);

        // Act
        await courseDetail.submitReview(4, comment);

        // Assert
        expect(await courseDetail.isReviewShown(comment)).toBe(true);
    });

    test('a review can be edited', { tag: '@mutating' }, async ({ newStudent }) => {
        // Arrange
        const page = (reviewerPage = await newStudent());
        const courseDetail = new CourseDetailPage(page);
        const original = uniqueName('Awalnya biasa saja.');
        const revised = uniqueName('Setelah selesai, ternyata sangat membantu.');
        await enrollInFreeCourse(page, REVIEW_COURSE.slug);
        await courseDetail.goto(REVIEW_COURSE.slug);
        await courseDetail.submitReview(2, original);

        // Act
        await courseDetail.editReview(5, revised);

        // Assert
        expect(await courseDetail.isReviewShown(revised)).toBe(true);
        expect(await courseDetail.isReviewShown(original)).toBe(false);
    });

    test('a review can be deleted', { tag: '@mutating' }, async ({ newStudent }) => {
        // Arrange
        const page = (reviewerPage = await newStudent());
        const courseDetail = new CourseDetailPage(page);
        const comment = uniqueName('Review yang akan ditarik kembali.');
        await enrollInFreeCourse(page, REVIEW_COURSE.slug);
        await courseDetail.goto(REVIEW_COURSE.slug);
        await courseDetail.submitReview(3, comment);

        // Act
        await courseDetail.deleteReview();

        // Assert
        expect(await courseDetail.isReviewShown(comment)).toBe(false);
    });

    test('a non-enrolled student sees no review form', { tag: ['@dev-only', '@rbac'] }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('studentFresh');
        const courseDetail = new CourseDetailPage(page);

        // Act
        await courseDetail.goto(REVIEW_COURSE.slug);

        // Assert
        expect(await courseDetail.isReviewsSectionShown()).toBe(true);
        expect(await courseDetail.isReviewFormOffered()).toBe(false);
    });
});
