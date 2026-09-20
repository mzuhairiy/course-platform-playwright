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
        await super.goto(DASHBOARD_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isLoaded() {
        return (await this.pageRoot.count()) > 0;
    }
}
