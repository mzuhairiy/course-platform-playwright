import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const EDIT_PATH = (courseId: string) => `/instructor/courses/${courseId}/edit`;

/**
 * A course's edit screen: status, publish/unpublish and the danger zone.
 * Owned by the course's instructor (or any admin) — anyone else is bounced to
 * the forbidden page, so `goto()` doesn't wait for the screen to render.
 */
export class CourseEditPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('edit-course');
    }

    private get statusBadge() {
        return this.page.getByTestId('course-status-badge').first();
    }

    private get publishButton() {
        return this.page.getByTestId('publish-button');
    }

    private get unpublishButton() {
        return this.page.getByTestId('unpublish-button');
    }

    private get publishError() {
        return this.page.getByTestId('course-action-error');
    }

    private get deleteCourseButton() {
        return this.page.getByTestId('delete-course-button');
    }

    private get deleteConfirmDialog() {
        return this.page.getByTestId('delete-confirm-dialog');
    }

    private get deleteConfirmInput() {
        return this.page.getByTestId('delete-confirm-input');
    }

    private get deleteConfirmButton() {
        return this.page.getByTestId('delete-confirm-button');
    }

    private get deleteError() {
        return this.page.getByTestId('delete-course-error');
    }

    async goto(courseId: string) {
        await this.navigate(EDIT_PATH(courseId));
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isLoaded(): Promise<boolean> {
        return (await this.pageRoot.count()) > 0;
    }

    async getStatus(): Promise<string> {
        return (await this.statusBadge.textContent())?.trim() ?? '';
    }

    async publish() {
        await this.publishButton.click();
    }

    async unpublish() {
        await this.unpublishButton.click();
    }

    /** The refusal is a toast that clears itself, so read it right after the click (§11). */
    async getPublishError(): Promise<string> {
        await this.publishError.waitFor({ state: 'visible' });
        return (await this.publishError.textContent())?.trim() ?? '';
    }

    async isPublishOffered(): Promise<boolean> {
        return (await this.publishButton.count()) > 0;
    }

    /** After a publish, the toggle flips to "Unpublish" once the refresh lands. */
    async waitForPublishedState() {
        await this.unpublishButton.waitFor({ state: 'visible' });
    }

    async waitForDraftState() {
        await this.publishButton.waitFor({ state: 'visible' });
    }

    async openDeleteDialog() {
        await this.deleteCourseButton.click();
        await this.deleteConfirmDialog.waitFor({ state: 'visible' });
    }

    async isDeleteConfirmEnabled(): Promise<boolean> {
        return this.deleteConfirmButton.isEnabled();
    }

    /** Types the course title back (the guard) and confirms. */
    async confirmDeleteByTypingTitle(title: string) {
        await this.deleteConfirmInput.fill(title);
        await this.deleteConfirmButton.click();
    }

    /** A successful delete redirects to the instructor's course list. */
    async deleteCourse(title: string) {
        await this.openDeleteDialog();
        await this.confirmDeleteByTypingTitle(title);
        await this.page.waitForURL((url) => url.pathname === '/instructor/courses');
    }

    async getDeleteError(): Promise<string> {
        await this.deleteError.waitFor({ state: 'visible' });
        return (await this.deleteError.textContent())?.trim() ?? '';
    }
}
