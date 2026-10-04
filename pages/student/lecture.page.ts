import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const LECTURE_PATH = (courseId: string, lectureId: string) => `/learn/${courseId}/${lectureId}`;

export type LectureKind = 'video' | 'reading' | 'quiz';

/**
 * The lecture player. Completion is driven by watch time (video), a button
 * (reading) or passing the quiz — never by wall-clock waiting, so the only
 * way to complete a video in a test is to move the dummy clip's playhead and
 * let the SUT's own event handlers fire (§11).
 */
export class LecturePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('lecture-view');
    }

    private get video() {
        return this.page.getByTestId('video-element');
    }

    private get completionStatus() {
        return this.page.getByTestId('video-completion-status');
    }

    private get markCompleteButton() {
        return this.page.getByTestId('mark-complete-button');
    }

    private get quizIntro() {
        return this.page.getByTestId('quiz-intro');
    }

    /** The sidebar entry for the lecture currently on screen — its own `data-completed` is the truth. */
    private get activeSidebarLecture() {
        return this.page.locator('[data-testid="sidebar-lecture"][data-active="true"]');
    }

    private get courseProgress() {
        return this.page.getByTestId('course-progress-percentage').first();
    }

    private get nextLecture() {
        return this.page.getByTestId('next-lecture');
    }

    /**
     * Deliberately does NOT waitForLoad(): a non-enrolled visitor gets
     * redirected to the course page instead, and that's a case tests must be
     * able to land on without timing out on a lecture view that never renders.
     */
    async goto(courseId: string, lectureId: string) {
        await this.navigate(LECTURE_PATH(courseId, lectureId));
    }

    async open(courseId: string, lectureId: string) {
        await this.goto(courseId, lectureId);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    async isLoaded(): Promise<boolean> {
        return (await this.pageRoot.count()) > 0;
    }

    /** Which kind of lecture is on screen. */
    async getKind(): Promise<LectureKind> {
        await this.video.or(this.markCompleteButton).or(this.quizIntro).first().waitFor({ state: 'visible' });
        if ((await this.video.count()) > 0) return 'video';
        if ((await this.markCompleteButton.count()) > 0) return 'reading';
        return 'quiz';
    }

    /**
     * Moves the dummy clip's playhead to `fraction` of its length and fires
     * the events the player listens for. It does not play the clip: playing in
     * real time would mean waiting it out, and some engines (Playwright's
     * Firefox/Chromium builds) can't decode the clip's codec at all — so the
     * duration comes from the page's own number when the media has loaded and
     * from `clipSeconds` (the seed's known clip length) when it hasn't.
     */
    async watchFraction(fraction: number, clipSeconds: number) {
        await this.video.waitFor({ state: 'visible' });
        await this.video.evaluate(
            (element, { target, fallbackSeconds }) => {
                const media = element as HTMLVideoElement;
                const duration = Number.isFinite(media.duration) && media.duration > 0 ? media.duration : fallbackSeconds;
                media.currentTime = Math.max(0, duration * target - 0.1);
                media.dispatchEvent(new Event('timeupdate'));
                if (target >= 1) {
                    media.dispatchEvent(new Event('ended'));
                }
            },
            { target: fraction, fallbackSeconds: clipSeconds },
        );
    }

    /** Waits for the *current* lecture's sidebar entry to flip to completed. */
    async waitForComplete() {
        await this.page
            .locator('[data-testid="sidebar-lecture"][data-active="true"][data-completed="true"]')
            .waitFor({ state: 'visible' });
    }

    async isMarkedComplete(): Promise<boolean> {
        return (await this.activeSidebarLecture.getAttribute('data-completed')) === 'true';
    }

    async getCompletionStatusText(): Promise<string> {
        return (await this.completionStatus.textContent())?.trim() ?? '';
    }

    async getCourseProgressPercentage(): Promise<number> {
        const text = (await this.courseProgress.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    /** Reading lectures complete through an explicit button, not watch time. */
    async markReadingComplete() {
        await this.markCompleteButton.click();
        await this.waitForComplete();
    }

    async hasNextLecture(): Promise<boolean> {
        return this.nextLecture.isEnabled();
    }

    /**
     * Follows the "next" link with a full page load rather than a click. A
     * client-side navigation keeps the sidebar's accordion mounted with its
     * old open/closed state, so a lecture in the next section would have no
     * sidebar entry in the DOM to read completion from; a fresh load always
     * opens the active section.
     */
    async goToNextLecture() {
        const href = await this.nextLecture.getAttribute('href');
        if (!href) throw new Error('There is no next lecture to go to.');
        await this.navigate(href);
        await this.waitForLoad();
    }
}
