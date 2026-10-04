import { test, expect } from '../../fixtures/instructor.fixture';
import { LessonManagerPage } from '../../pages/instructor/lesson-manager.page';
import { SCRATCH_LESSON } from '../../support/test-data';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

const THREE_LESSONS = ['Intro', 'Middle', 'Wrap up'];

test.describe('Lesson management', { tag: '@mutating' }, () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('an instructor can add a video lesson', async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create();
        const lessons = new LessonManagerPage(instructorPage);
        await lessons.goto(course.id);

        // Act
        await lessons.addVideoLesson('New Video Lesson', SCRATCH_LESSON.videoUrl, SCRATCH_LESSON.videoDurationSeconds);

        // Assert
        expect(await lessons.getLessonTitlesInOrder()).toEqual(['New Video Lesson']);
    });

    test('an instructor can add a quiz lesson', async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create();
        const lessons = new LessonManagerPage(instructorPage);
        await lessons.goto(course.id);

        // Act
        await lessons.addQuizLesson('New Quiz Lesson');

        // Assert
        expect(await lessons.getLessonTitlesInOrder()).toEqual(['New Quiz Lesson']);
        expect(await lessons.hasQuizBuilderLink(0)).toBe(true);
    });

    test('a lesson can be moved down and the order persists', async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: THREE_LESSONS });
        const lessons = new LessonManagerPage(instructorPage);
        await lessons.goto(course.id);

        // Act
        await lessons.moveLessonDown(0);
        await lessons.reload();

        // Assert
        expect(await lessons.getLessonTitlesInOrder()).toEqual(['Middle', 'Intro', 'Wrap up']);
    });

    test('the first lesson cannot be moved up', { tag: '@edge-case' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: THREE_LESSONS });
        const lessons = new LessonManagerPage(instructorPage);

        // Act
        await lessons.goto(course.id);

        // Assert
        expect(await lessons.canMoveUp(0)).toBe(false);
    });

    test('a lesson can be deleted after confirmation', async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: THREE_LESSONS });
        const lessons = new LessonManagerPage(instructorPage);
        await lessons.goto(course.id);

        // Act
        await lessons.deleteLesson(1);

        // Assert
        expect(await lessons.getLessonTitlesInOrder()).toEqual(['Intro', 'Wrap up']);
    });
});
