import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const SIGN_UP_PATH = '/sign-up';

export class SignUpPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('sign-up-page');
    }

    private get nameInput() {
        return this.page.getByTestId('sign-up-name');
    }

    private get emailInput() {
        return this.page.getByTestId('sign-up-email');
    }

    private get passwordInput() {
        return this.page.getByTestId('sign-up-password');
    }

    private get submitButton() {
        return this.page.getByTestId('sign-up-submit');
    }

    private get formError() {
        return this.page.getByTestId('sign-up-error');
    }

    async goto() {
        await this.navigate(SIGN_UP_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    /** Full flow: navigate, fill, submit, wait for the auto-login redirect. */
    async signUpAs(name: string, email: string, password: string) {
        await this.goto();
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
        await this.page.waitForURL((url) => !url.pathname.startsWith(SIGN_UP_PATH));
    }

    /**
     * Fills and submits without waiting for the auto-login redirect — for the
     * attempts that are *supposed* to be refused and leave the visitor on /sign-up.
     */
    async attemptSignUpAs(name: string, email: string, password: string) {
        await this.goto();
        await this.nameInput.fill(name);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async getFormError(): Promise<string> {
        await this.formError.waitFor({ state: 'visible' });
        return (await this.formError.textContent())?.trim() ?? '';
    }
}
