import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const NEW_COURSE_PATH = '/instructor/courses/new';
const EDIT_PATH_PATTERN = /^\/instructor\/courses\/([^/]+)\/edit$/;

export interface NewCourseDetails {
    title: string;
    description: string;
    /** Visible category name, as the select shows it (not its id). */
    category: string;
}

export class CourseFormPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get form() {
        return this.page.getByTestId('course-form');
    }

    private get titleInput() {
        return this.page.getByTestId('course-form-title');
    }

    private get descriptionInput() {
        return this.page.getByTestId('course-form-description');
    }

    private get categorySelect() {
        return this.page.getByTestId('course-form-category');
    }

    private get submitButton() {
        return this.page.getByTestId('course-form-submit');
    }

    async gotoNew() {
        await this.navigate(NEW_COURSE_PATH);
        await this.form.waitFor({ state: 'visible' });
    }

    /**
     * Fills the form and submits it. A successful create redirects to the new
     * course's edit page — arriving there is the SUT's own confirmation that
     * the Server Action succeeded (§11: no XHR to wait on) — and the course id
     * is read back from that URL, since the UI never shows it.
     */
    async createCourse(details: NewCourseDetails): Promise<string> {
        await this.gotoNew();
        await this.titleInput.fill(details.title);
        await this.descriptionInput.fill(details.description);
        await this.categorySelect.selectOption({ label: details.category });
        await this.submitButton.click();
        await this.page.waitForURL((url) => EDIT_PATH_PATTERN.test(url.pathname));
        return new URL(this.page.url()).pathname.match(EDIT_PATH_PATTERN)![1];
    }
}
