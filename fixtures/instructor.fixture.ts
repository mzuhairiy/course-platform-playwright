import { Page } from '@playwright/test';
import { test as base } from './student.fixture';
import { CourseEditPage } from '../pages/instructor/course-edit.page';
import { CourseFormPage } from '../pages/instructor/course-form.page';
import { LessonManagerPage } from '../pages/instructor/lesson-manager.page';
import { SCRATCH_COURSE, SCRATCH_LESSON } from '../support/test-data';
import { uniqueName } from '../support/unique';

export interface ScratchCourse {
    id: string;
    title: string;
}

export interface ScratchCourseOptions {
    /** Reading lessons to add, in order. Default: none (an empty draft). */
    lessons?: string[];
    /** Publish after adding the lessons. Needs at least one lesson. */
    publish?: boolean;
}

export interface ScratchCourses {
    /** Builds a uniquely-named course owned by `instructor` through the real UI. */
    create(options?: ScratchCourseOptions): Promise<ScratchCourse>;
    /** Registers a course the *test itself* created (e.g. the create-course test) for cleanup. */
    track(course: ScratchCourse): void;
}

type InstructorFixtures = {
    /** A page signed in as the seed `instructor`, from the cached session. */
    instructorPage: Page;

    /**
     * Scratch courses for @mutating instructor/admin tests. The suite has no
     * DB access (§9), so they are built — and deleted again when the test
     * ends, pass or fail — through the UI. Cleanup lives in this fixture
     * (not a spec-level `afterEach`) so it always runs *before*
     * `instructorPage`'s context is closed. A course that can't be deleted (a
     * student enrolled) is left behind; its unique name keeps it harmless.
     */
    scratch: ScratchCourses;
};

export const test = base.extend<InstructorFixtures>({
    instructorPage: async ({ authedPage }, use) => {
        await use(await authedPage('instructor'));
    },

    scratch: async ({ instructorPage }, use) => {
        const courses: ScratchCourse[] = [];

        await use({
            track: (course) => {
                courses.push(course);
            },

            create: async (options = {}) => {
                const title = uniqueName('Automation Course');
                const id = await new CourseFormPage(instructorPage).createCourse({
                    title,
                    description: SCRATCH_COURSE.description,
                    category: SCRATCH_COURSE.category,
                });
                const course = { id, title };
                courses.push(course);

                const lessons = options.lessons ?? [];
                if (lessons.length > 0) {
                    const lessonManager = new LessonManagerPage(instructorPage);
                    await lessonManager.goto(id);
                    for (const lesson of lessons) {
                        await lessonManager.addReadingLesson(lesson, SCRATCH_LESSON.readingBody);
                    }
                }

                if (options.publish) {
                    const edit = new CourseEditPage(instructorPage);
                    await edit.goto(id);
                    await edit.waitForLoad();
                    await edit.publish();
                    await edit.waitForPublishedState();
                }

                return course;
            },
        });

        const edit = new CourseEditPage(instructorPage);
        for (const course of courses) {
            await edit.goto(course.id);
            // Already gone (the test deleted it) → nothing to clean up.
            if (!(await edit.isLoaded())) continue;
            try {
                await edit.deleteCourse(course.title);
            } catch {
                // Not deletable (e.g. enrolled students) — leave it.
            }
        }
    },
});

export { expect } from '@playwright/test';
