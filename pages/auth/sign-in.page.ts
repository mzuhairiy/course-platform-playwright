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

    private get emailFieldError() {
        return this.page.getByTestId('sign-in-email-error');
    }

    private get passwordFieldError() {
        return this.page.getByTestId('sign-in-password-error');
    }

    async goto() {
        await this.navigate(SIGN_IN_PATH);
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

    /**
     * Fills and submits without waiting for a redirect — for the attempts that
     * are *supposed* to be refused and leave the visitor on /sign-in.
     */
    async attemptLoginAs(email: string, password: string) {
        await this.goto();
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async submitEmpty() {
        await this.goto();
        await this.submitButton.click();
    }

    /** Client-side validation messages, shown under each field of an empty submit. */
    async getFieldErrors(): Promise<{ email: string; password: string }> {
        await this.emailFieldError.waitFor({ state: 'visible' });
        await this.passwordFieldError.waitFor({ state: 'visible' });
        return {
            email: (await this.emailFieldError.textContent())?.trim() ?? '',
            password: (await this.passwordFieldError.textContent())?.trim() ?? '',
        };
    }

    async getErrorMessage() {
        await this.errorMessage.waitFor({ state: 'visible' });
        return (await this.errorMessage.textContent())?.trim() ?? '';
    }
}
