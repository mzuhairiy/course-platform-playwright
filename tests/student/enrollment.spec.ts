import { test, expect } from '../../fixtures/storage.fixture';
import { SignUpPage } from '../../pages/auth/sign-up.page';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { LecturePage } from '../../pages/student/lecture.page';
import { FREE_COURSE, PAID_COURSE } from '../../support/test-data';
import { THROWAWAY_NAME, THROWAWAY_PASSWORD, uniqueEmail } from '../../support/unique';

test.describe('Enrollment', () => {
    /**
     * Signs up its own throwaway student rather than using the `studentFresh`
     * profile: the SUT has no unenroll feature and this suite has no DB
     * access (§9), so enrolling a seed account would consume its clean-slate
     * state permanently and make the test a one-shot. A fresh account per
     * run keeps it repeatable; the leftover accounts are uniquely named and
     * harmless (§9, "biarkan data bernama unik menumpuk").
     */
    test('a fresh student can enrol in a free course and lands on its first lecture', { tag: '@mutating' }, async ({ page }) => {
        // Arrange
        const signUp = new SignUpPage(page);
        const courseDetail = new CourseDetailPage(page);
        const lecture = new LecturePage(page);

        // Act
        await signUp.signUpAs(THROWAWAY_NAME, uniqueEmail(), THROWAWAY_PASSWORD);
        await courseDetail.goto(FREE_COURSE.slug);
        await courseDetail.clickCallToAction();
        await lecture.waitForLoad();

        // Assert
        await expect(page).toHaveURL(`/learn/${FREE_COURSE.id}/${FREE_COURSE.firstLectureId}`);
        expect(await lecture.isLoaded()).toBe(true);
    });

    test('a non-enrolled student cannot open the learn page', { tag: '@dev-only' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('studentFresh');
        const lecture = new LecturePage(page);

        // Act
        await lecture.goto(PAID_COURSE.id, PAID_COURSE.firstLectureId);

        // Assert
        await expect(page).toHaveURL(`/courses/${PAID_COURSE.slug}`);
        expect(await lecture.isLoaded()).toBe(false);
    });
});
