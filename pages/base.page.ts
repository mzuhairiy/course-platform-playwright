import { Page } from '@playwright/test';

/**
 * Every page object extends this. Navigation goes through `navigate()`
 * (relative paths only — the origin comes from playwright.config.ts's
 * baseURL, which is itself driven by the active environment) so a page
 * object never hardcodes which environment it's talking to.
 *
 * Subclasses expose their own public `goto(...)` that builds the path and
 * calls this. It's deliberately not named `goto` here: a page whose URL
 * needs more than one part (`/learn/{courseId}/{lectureId}`) would otherwise
 * be overriding this method with an incompatible signature.
 */
export abstract class BasePage {
    constructor(protected readonly page: Page) {}

    protected async navigate(path: string) {
        await this.page.goto(path);
    }
}
