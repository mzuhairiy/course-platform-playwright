import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const VERIFY_PATH = '/verify';

/**
 * The public certificate-verification page. The search lives in the URL
 * (`?number=`), so submitting is a plain GET and works with no session —
 * which is the whole point of the page.
 */
export class VerifyPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get form() {
        return this.page.getByTestId('verify-form');
    }

    private get numberInput() {
        return this.page.getByTestId('verify-number-input');
    }

    private get submitButton() {
        return this.page.getByTestId('verify-submit');
    }

    private get result() {
        return this.page.getByTestId('verify-result');
    }

    private get notFound() {
        return this.page.getByTestId('verify-not-found');
    }

    private get formatError() {
        return this.page.getByTestId('verify-error');
    }

    private get studentName() {
        return this.page.getByTestId('verify-student-name');
    }

    private get courseName() {
        return this.page.getByTestId('verify-course-name');
    }

    async goto() {
        await this.navigate(VERIFY_PATH);
        await this.form.waitFor({ state: 'visible' });
    }

    /** Submits, then waits until the page has rendered *some* verdict. */
    async verify(certificateNumber: string) {
        await this.numberInput.fill(certificateNumber);
        await this.submitButton.click();
        await this.result.or(this.notFound).or(this.formatError).first().waitFor({ state: 'visible' });
    }

    async isValid(): Promise<boolean> {
        return (await this.result.count()) > 0;
    }

    async isNotFound(): Promise<boolean> {
        return (await this.notFound.count()) > 0;
    }

    async isFormatRejected(): Promise<boolean> {
        return (await this.formatError.count()) > 0;
    }

    async getStudentName(): Promise<string> {
        return (await this.studentName.textContent())?.trim() ?? '';
    }

    async getCourseName(): Promise<string> {
        return (await this.courseName.textContent())?.trim() ?? '';
    }
}
