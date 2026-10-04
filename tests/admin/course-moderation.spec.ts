import { test, expect } from '../../fixtures/instructor.fixture';
import { AdminCoursesPage } from '../../pages/admin/courses.page';
import { COURSE_OF_INSTRUCTOR, COURSE_OF_OTHER_INSTRUCTOR } from '../../support/test-data';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

/**
 * Archive/unarchive act on a scratch course an instructor test builds and the
 * `scratch` fixture removes again — never on a seed course. The three browser
 * projects run in parallel against the same database, so sharing one seed
 * course would have them archive and restore it under each other's feet.
 */
test.describe('Admin course moderation', () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('an admin can list every course', { tag: '@smoke' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('admin');
        const courses = new AdminCoursesPage(page);

        // Act
        await courses.goto();

        // Assert — courses owned by two different instructors, in one list.
        expect(await courses.isCourseListed(COURSE_OF_INSTRUCTOR.title)).toBe(true);
        expect(await courses.isCourseListed(COURSE_OF_OTHER_INSTRUCTOR.title)).toBe(true);
    });

    test('an admin can archive a published course', { tag: '@mutating' }, async ({ authedPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: ['Lesson 1'], publish: true });
        const courses = new AdminCoursesPage(await authedPage('admin'));
        await courses.goto();

        // Act
        await courses.archiveCourse(course.title);

        // Assert
        expect(await courses.getCourseStatus(course.title)).toBe('Archived');
    });

    test('an admin can unarchive an archived course', { tag: '@mutating' }, async ({ authedPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: ['Lesson 1'], publish: true });
        const courses = new AdminCoursesPage(await authedPage('admin'));
        await courses.goto();
        await courses.archiveCourse(course.title);

        // Act
        await courses.unarchiveCourse(course.title);

        // Assert — back to the status it held before it was archived.
        expect(await courses.getCourseStatus(course.title)).toBe('Published');
    });
});
