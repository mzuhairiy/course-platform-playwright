import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const SIGN_IN_PATH = '/sign-in';

export class SignInPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('sign-in-page');
    }

    private get emailInput() {
        return this.page.getByTestId('sign-in-email');
    }

    private get passwordInput() {
        return this.page.getByTestId('sign-in-password');
    }

    private get submitButton() {
        return this.page.getByTestId('sign-in-submit');
    }

    private get errorMessage() {
        return this.page.getByTestId('sign-in-error');
    }

    async goto() {
        await super.goto(SIGN_IN_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    /** Full flow: navigate, fill, submit, wait for the redirect off /sign-in. */
    async loginAs(email: string, password: string) {
        await this.goto();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        await this.page.waitForURL((url) => !url.pathname.startsWith(SIGN_IN_PATH));
    }

    async getErrorMessage() {
        await this.errorMessage.waitFor({ state: 'visible' });
        return (await this.errorMessage.textContent())?.trim() ?? '';
    }
}
