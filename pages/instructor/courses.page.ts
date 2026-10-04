import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/instructor/courses';

export class InstructorCoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('instructor-courses');
    }

    private get courseItems() {
        return this.page.getByTestId('instructor-course-item');
    }

    private statusFilter(status: string) {
        return this.page.getByTestId(`course-filter-${status}`);
    }

    private courseRow(title: string) {
        return this.courseItems.filter({ hasText: title });
    }

    async goto() {
        await this.navigate(COURSES_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async filterByStatus(status: string) {
        await this.statusFilter(status).click();
        await this.page.waitForURL((url) => url.searchParams.get('status') === status);
        await this.waitForLoad();
    }

    async isCourseListed(title: string): Promise<boolean> {
        return (await this.courseRow(title).count()) > 0;
    }
}
