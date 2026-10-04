import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

export class NotFoundPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('not-found');
    }

    async isVisible(): Promise<boolean> {
        return (await this.pageRoot.count()) > 0;
    }
}
