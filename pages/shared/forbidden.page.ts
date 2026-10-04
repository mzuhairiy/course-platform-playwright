import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * The SUT rewrites a blocked route to this content in-place — the browser
 * URL stays whatever was requested (e.g. still `/instructor`), it never
 * becomes `/forbidden`. Assert on this testid, never on the URL or a 403.
 */
export class ForbiddenPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('forbidden-page');
    }

    async isVisible(): Promise<boolean> {
        return (await this.pageRoot.count()) > 0;
    }
}
