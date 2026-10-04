import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const DASHBOARD_PATH = '/admin';

export class AdminDashboardPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('admin-dashboard');
    }

    async goto() {
        await this.navigate(DASHBOARD_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isLoaded() {
        return (await this.pageRoot.count()) > 0;
    }
}
