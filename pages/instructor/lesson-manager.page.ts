import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const LESSONS_PATH = (courseId: string) => `/instructor/courses/${courseId}/lessons`;

export class LessonManagerPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('lessons-page');
    }

    private get lessonItems() {
        return this.page.getByTestId('lesson-item');
    }

    private get lessonTitles() {
        return this.page.getByTestId('lesson-title');
    }

    private get addLessonButton() {
        return this.page.getByTestId('add-lesson-button');
    }

    private get formDialog() {
        return this.page.getByTestId('lesson-form-dialog');
    }

    private get titleInput() {
        return this.page.getByTestId('lesson-title-input');
    }

    private get typeSelect() {
        return this.page.getByTestId('lesson-type-select');
    }

    private get videoUrlInput() {
        return this.page.getByTestId('lesson-video-url-input');
    }

    private get durationInput() {
        return this.page.getByTestId('lesson-duration-input');
    }

    private get readingContentInput() {
        return this.page.getByTestId('lesson-reading-content');
    }

    private get formSubmitButton() {
        return this.page.getByTestId('lesson-form-submit');
    }

    private get moveUpButtons() {
        return this.page.getByTestId('move-lesson-up');
    }

    private get moveDownButtons() {
        return this.page.getByTestId('move-lesson-down');
    }

    private get deleteButtons() {
        return this.page.getByTestId('delete-lesson-button');
    }

    private get deleteDialog() {
        return this.page.getByTestId('delete-lesson-dialog');
    }

    private get deleteConfirmButton() {
        return this.page.getByTestId('delete-lesson-confirm');
    }

    async goto(courseId: string) {
        await this.navigate(LESSONS_PATH(courseId));
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    async addVideoLesson(title: string, videoUrl: string, durationSeconds: number) {
        await this.openAddDialog();
        await this.titleInput.fill(title);
        await this.typeSelect.selectOption('VIDEO');
        await this.videoUrlInput.fill(videoUrl);
        await this.durationInput.fill(String(durationSeconds));
        await this.saveLesson(title);
    }

    async addReadingLesson(title: string, body: string) {
        await this.openAddDialog();
        await this.titleInput.fill(title);
        await this.typeSelect.selectOption('READING');
        await this.readingContentInput.fill(body);
        await this.saveLesson(title);
    }

    async addQuizLesson(title: string) {
        await this.openAddDialog();
        await this.titleInput.fill(title);
        await this.typeSelect.selectOption('QUIZ');
        await this.saveLesson(title);
    }

    private async openAddDialog() {
        await this.addLessonButton.click();
        await this.formDialog.waitFor({ state: 'visible' });
    }

    /**
     * The dialog closes before the list refresh lands, so the dialog alone is
     * not enough: a navigation started right after would collide with the
     * refresh still in flight. The new lesson showing up in the list is the
     * signal that the Server Action *and* the refresh are done.
     */
    private async saveLesson(title: string) {
        await this.formSubmitButton.click();
        await this.formDialog.waitFor({ state: 'hidden' });
        await this.lessonItems.filter({ hasText: title }).first().waitFor({ state: 'visible' });
    }

    async getLessonTitlesInOrder(): Promise<string[]> {
        await this.lessonItems.first().waitFor({ state: 'visible' });
        return (await this.lessonTitles.allTextContents()).map((title) => title.trim());
    }

    async hasQuizBuilderLink(position: number): Promise<boolean> {
        return (await this.lessonItems.nth(position).getByTestId('edit-quiz-link').count()) > 0;
    }

    /** Waits until the list actually reorders — the move is a Server Action plus a refresh. */
    async moveLessonDown(position: number) {
        const before = (await this.getLessonTitlesInOrder()).join('|');
        await this.moveDownButtons.nth(position).click();
        await this.page.waitForFunction(
            (previous) =>
                [...document.querySelectorAll('[data-testid="lesson-title"]')]
                    .map((element) => element.textContent?.trim())
                    .join('|') !== previous,
            before,
        );
    }

    async canMoveUp(position: number): Promise<boolean> {
        return !(await this.moveUpButtons.nth(position).isDisabled());
    }

    /**
     * The dialog closes before the list refresh lands, so reading the list right
     * after would still show the deleted lesson. Waits until the list has
     * actually shrunk.
     */
    async deleteLesson(position: number) {
        const countBefore = await this.lessonItems.count();
        await this.deleteButtons.nth(position).click();
        await this.deleteDialog.waitFor({ state: 'visible' });
        await this.deleteConfirmButton.click();
        await this.deleteDialog.waitFor({ state: 'hidden' });
        await this.page.waitForFunction(
            (previous) => document.querySelectorAll('[data-testid="lesson-item"]').length < previous,
            countBefore,
        );
    }
}
