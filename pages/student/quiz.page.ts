import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * The student-facing quiz. It has no route of its own — it lives inside a
 * QUIZ lecture and moves through intro → in progress → result, so navigating
 * to the lecture is `LecturePage`'s job and this page object only drives what
 * is on screen once the lecture has loaded.
 */
export class QuizPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get intro() {
        return this.page.getByTestId('quiz-intro');
    }

    private get startButton() {
        return this.page.getByTestId('start-quiz-button');
    }

    private get inProgress() {
        return this.page.getByTestId('quiz-in-progress');
    }

    private get submitButton() {
        return this.page.getByTestId('submit-quiz-button');
    }

    private get result() {
        return this.page.getByTestId('quiz-result');
    }

    private get score() {
        return this.page.getByTestId('quiz-score');
    }

    /** Renders for both outcomes; the verdict is its `data-passed` attribute. */
    private get passedBadge() {
        return this.page.getByTestId('quiz-passed-badge');
    }

    private get reviewItems() {
        return this.page.getByTestId('quiz-review-item');
    }

    private get retryButton() {
        return this.page.getByTestId('retry-quiz-button');
    }

    private get timer() {
        return this.page.getByTestId('quiz-timer');
    }

    /**
     * Every answer shares the `quiz-option` testid, so the option's own
     * `data-option-id` is the only deterministic handle — answer text would
     * break on a copy edit and can't tell two true/false questions apart.
     */
    private answerOption(optionId: string) {
        return this.page.locator(`[data-testid="quiz-option"][data-option-id="${optionId}"]`);
    }

    async waitForIntro() {
        await this.intro.waitFor({ state: 'visible' });
    }

    async start() {
        await this.startButton.click();
        await this.inProgress.waitFor({ state: 'visible' });
    }

    async selectAnswers(optionIds: readonly string[]) {
        for (const optionId of optionIds) {
            await this.answerOption(optionId).click();
        }
    }

    /** Server Action — wait for the result view, not a response (§11). */
    async submit() {
        await this.submitButton.click();
        await this.result.waitFor({ state: 'visible' });
    }

    /** For the timer's own auto-submit: nothing is clicked. */
    async waitForResult() {
        await this.result.waitFor({ state: 'visible' });
    }

    async retry() {
        await this.retryButton.click();
        await this.inProgress.waitFor({ state: 'visible' });
    }

    async isTimerVisible(): Promise<boolean> {
        return this.timer.isVisible();
    }

    async getScorePercentage(): Promise<number> {
        const text = (await this.score.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async hasPassed(): Promise<boolean> {
        return (await this.passedBadge.getAttribute('data-passed')) === 'true';
    }

    async isRetryOffered(): Promise<boolean> {
        return (await this.retryButton.count()) > 0;
    }

    async getReviewItemCount(): Promise<number> {
        return this.reviewItems.count();
    }
}
