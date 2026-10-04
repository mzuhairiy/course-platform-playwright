import { test, expect } from '../../fixtures/instructor.fixture';
import { CourseEditPage } from '../../pages/instructor/course-edit.page';
import { CourseFormPage } from '../../pages/instructor/course-form.page';
import { InstructorCoursesPage } from '../../pages/instructor/courses.page';
import { INSTRUCTOR_OWNED_COURSE, SCRATCH_COURSE } from '../../support/test-data';
import { uniqueName } from '../../support/unique';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

/**
 * Every test works on a uniquely-named scratch course built through the UI
 * and removed again by the `scratch` fixture — never on a seed course (§9).
 * The one exception is the "enrolled student" guard, which needs a course that
 * already has a student and is refused before anything changes.
 */
test.describe('Instructor course lifecycle', () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('an instructor can create a draft course', { tag: '@mutating' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const form = new CourseFormPage(instructorPage);
        const edit = new CourseEditPage(instructorPage);
        const title = uniqueName('Automation Course');

        // Act
        const id = await form.createCourse({
            title,
            description: SCRATCH_COURSE.description,
            category: SCRATCH_COURSE.category,
        });
        scratch.track({ id, title });
        await edit.waitForLoad();

        // Assert
        expect(await edit.getStatus()).toBe('Draft');
    });

    test('a course without lessons cannot be published', { tag: '@mutating' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create();
        const edit = new CourseEditPage(instructorPage);
        await edit.goto(course.id);
        await edit.waitForLoad();

        // Act
        await edit.publish();

        // Assert
        expect(await edit.getPublishError()).not.toBe('');
        expect(await edit.isPublishOffered()).toBe(true);
    });

    test('a course with at least one lesson can be published', { tag: '@mutating' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: ['Lesson 1'] });
        const edit = new CourseEditPage(instructorPage);
        await edit.goto(course.id);
        await edit.waitForLoad();

        // Act
        await edit.publish();
        await edit.waitForPublishedState();

        // Assert
        expect(await edit.getStatus()).toBe('Published');
    });

    test('a published course can be unpublished', { tag: '@mutating' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create({ lessons: ['Lesson 1'], publish: true });
        const edit = new CourseEditPage(instructorPage);
        await edit.goto(course.id);
        await edit.waitForLoad();

        // Act
        await edit.unpublish();
        await edit.waitForDraftState();

        // Assert
        expect(await edit.getStatus()).toBe('Draft');
    });

    test('a course with an enrolled student cannot be deleted', { tag: '@dev-only' }, async ({ instructorPage }) => {
        // Arrange — the seed's "legacy" enrolment gives this course a student.
        const edit = new CourseEditPage(instructorPage);
        await edit.goto(INSTRUCTOR_OWNED_COURSE.id);
        await edit.waitForLoad();

        // Act
        await edit.openDeleteDialog();
        await edit.confirmDeleteByTypingTitle(INSTRUCTOR_OWNED_COURSE.title);

        // Assert
        expect(await edit.getDeleteError()).toBe('Course dengan siswa terdaftar tidak bisa dihapus.');
    });

    test('an empty draft course can be deleted', { tag: '@mutating' }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create();
        const edit = new CourseEditPage(instructorPage);
        const courses = new InstructorCoursesPage(instructorPage);
        await edit.goto(course.id);
        await edit.waitForLoad();

        // Act
        await edit.deleteCourse(course.title);
        await courses.waitForLoad();

        // Assert
        expect(await courses.isCourseListed(course.title)).toBe(false);
    });

    test('deleting a course stays blocked until its title is typed back', { tag: ['@mutating', '@edge-case'] }, async ({ instructorPage, scratch }) => {
        // Arrange
        const course = await scratch.create();
        const edit = new CourseEditPage(instructorPage);
        await edit.goto(course.id);
        await edit.waitForLoad();

        // Act
        await edit.openDeleteDialog();

        // Assert
        expect(await edit.isDeleteConfirmEnabled()).toBe(false);
    });
});
