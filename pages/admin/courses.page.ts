import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/admin/courses';

/** The platform-wide course moderation list. */
export class AdminCoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('admin-courses');
    }

    private get courseItems() {
        return this.page.getByTestId('admin-course-item');
    }

    private courseRow(title: string): Locator {
        return this.courseItems.filter({ hasText: title }).first();
    }

    private statusBadge(title: string): Locator {
        return this.courseRow(title).getByTestId('course-status-badge');
    }

    async goto() {
        await this.navigate(COURSES_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isCourseListed(title: string): Promise<boolean> {
        return (await this.courseRow(title).count()) > 0;
    }

    /** Server Action + refresh — waits until the row shows the new status badge. */
    async archiveCourse(title: string) {
        await this.courseRow(title).getByTestId('admin-archive-button').click();
        await this.statusBadge(title).filter({ hasText: 'Archived' }).waitFor({ state: 'visible' });
    }

    async unarchiveCourse(title: string) {
        await this.courseRow(title).getByTestId('admin-unarchive-button').click();
        await this.statusBadge(title).filter({ hasText: /^(Published|Draft)$/ }).waitFor({ state: 'visible' });
    }

    async getCourseStatus(title: string): Promise<string> {
        return (await this.statusBadge(title).textContent())?.trim() ?? '';
    }
}
