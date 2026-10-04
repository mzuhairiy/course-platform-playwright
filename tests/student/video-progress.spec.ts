import { test, expect } from '../../fixtures/student.fixture';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { LecturePage } from '../../pages/student/lecture.page';
import { enrollInFreeCourse } from '../../support/flows';
import { FREE_COURSE, SAMPLE_CLIP_SECONDS } from '../../support/test-data';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

/**
 * Seeking the dummy clip instead of playing it (§11): `watchFraction` moves
 * the playhead and fires the events the SUT's own player listens for, so the
 * 90% completion rule is exercised for real without waiting the clip out.
 *
 * Each test signs up its own student — lecture progress can't be reset from
 * the UI, so a shared seed account would keep a lecture "finished" forever.
 */
test.describe('Video progress', { tag: '@dev-only' }, () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('watching under the threshold leaves the lecture incomplete', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        await enrollInFreeCourse(page, FREE_COURSE.slug);

        // Act
        await lecture.watchFraction(0.5, SAMPLE_CLIP_SECONDS);

        // Assert
        expect(await lecture.isMarkedComplete()).toBe(false);
        expect(await lecture.getCompletionStatusText()).toContain('Tonton');
    });

    test('watching past the threshold completes the lecture', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        await enrollInFreeCourse(page, FREE_COURSE.slug);

        // Act
        await lecture.watchFraction(1, SAMPLE_CLIP_SECONDS);
        await lecture.waitForComplete();

        // Assert
        expect(await lecture.isMarkedComplete()).toBe(true);
        expect(await lecture.getCompletionStatusText()).toContain('selesai');
    });

    test('lecture completion survives a reload', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        await enrollInFreeCourse(page, FREE_COURSE.slug);
        await lecture.watchFraction(1, SAMPLE_CLIP_SECONDS);
        await lecture.waitForComplete();

        // Act
        await lecture.reload();

        // Assert
        expect(await lecture.isMarkedComplete()).toBe(true);
    });

    test('completing a lecture raises the course progress', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        await enrollInFreeCourse(page, FREE_COURSE.slug);
        const progressBefore = await lecture.getCourseProgressPercentage();

        // Act
        await lecture.watchFraction(1, SAMPLE_CLIP_SECONDS);
        await lecture.waitForComplete();

        // Assert
        expect(await lecture.getCourseProgressPercentage()).toBeGreaterThan(progressBefore);
    });

    test('resuming lands on the first unfinished lecture', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        const courseDetail = new CourseDetailPage(page);
        await enrollInFreeCourse(page, FREE_COURSE.slug);
        await lecture.watchFraction(1, SAMPLE_CLIP_SECONDS);
        await lecture.waitForComplete();

        // Act
        await courseDetail.goto(FREE_COURSE.slug);
        await courseDetail.clickCallToAction();
        await lecture.waitForLoad();

        // Assert
        await expect(page).toHaveURL(`/learn/${FREE_COURSE.id}/${FREE_COURSE.secondLectureId}`);
    });
});
