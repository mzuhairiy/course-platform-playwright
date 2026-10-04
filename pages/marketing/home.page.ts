import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const HOME_PATH = '/';

export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('hero-section');
    }

    private get browseCoursesCta() {
        return this.page.getByTestId('hero-cta-browse');
    }

    async goto() {
        await this.navigate(HOME_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isPrimaryCallToActionVisible(): Promise<boolean> {
        return this.browseCoursesCta.isVisible();
    }
}
