import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const DASHBOARD_PATH = '/instructor';

export class InstructorDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('instructor-dashboard');
    }

    async goto() {
        await this.navigate(DASHBOARD_PATH);
        await this.waitForLoad();
    }

    /**
     * Navigates without waiting for the dashboard: someone without the role is
     * shown the forbidden page here instead, and a test about that must be able
     * to land on it without timing out on a dashboard that never renders.
     */
    async visit() {
        await this.navigate(DASHBOARD_PATH);
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isLoaded() {
        return (await this.pageRoot.count()) > 0;
    }
}
