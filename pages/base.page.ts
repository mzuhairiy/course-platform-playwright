import { Page } from '@playwright/test';

/**
 * Every page object extends this. Navigation goes through `goto()` (relative
 * paths only — the origin comes from playwright.config.ts's baseURL, which is
 * itself driven by the active environment) so a page object never hardcodes
 * which environment it's talking to.
 */
export abstract class BasePage {
    constructor(protected readonly page: Page) {}

    protected async goto(path: string) {
        await this.page.goto(path);
    }
}
