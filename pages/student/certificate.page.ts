import { Download, Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * The certificate panel, which the SUT renders in two shapes: while the
 * course is unfinished it is a `certificate-section` with a locked message
 * and a disabled button; once every lecture is done the course page swaps it
 * for a `course-completed-banner`. The button testid is the same in both, so
 * callers ask about the state ("locked", "offered"), not which container is
 * on screen.
 */
export class CertificatePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get completedBanner() {
        return this.page.getByTestId('course-completed-banner');
    }

    private get panel() {
        return this.page.getByTestId('certificate-section');
    }

    private get lockedMessage() {
        return this.page.getByTestId('certificate-locked-message');
    }

    private get downloadButton() {
        return this.page.getByTestId('download-certificate-button').first();
    }

    /**
     * Either shape of the panel means the page has rendered. Awaited before
     * any state query: the panel is server-rendered after the shell, so a
     * query straight after navigation can run before it exists.
     */
    async waitForLoad() {
        await this.completedBanner.or(this.panel).first().waitFor({ state: 'visible' });
    }

    async isCompletionCelebrated(): Promise<boolean> {
        return (await this.completedBanner.count()) > 0;
    }

    async isLocked(): Promise<boolean> {
        if ((await this.lockedMessage.count()) === 0) return false;
        return !(await this.downloadButton.isEnabled());
    }

    async isOffered(): Promise<boolean> {
        if ((await this.downloadButton.count()) === 0) return false;
        return this.downloadButton.isEnabled();
    }

    /**
     * The button fetches the PDF as a blob and saves it client-side, so the
     * download event is the only signal it landed — no navigation, no DOM
     * change to wait for.
     */
    async download(): Promise<Download> {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.downloadButton.click(),
        ]);
        return download;
    }
}
