import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const CHECKOUT_PATH = (courseId: string) => `/checkout/${courseId}`;

/**
 * Order form for a paid course. Reachable only for a paid course the student
 * doesn't own yet — the SUT redirects to the course page otherwise, so
 * `goto()` deliberately doesn't wait for the form; negative tests need to
 * land on the redirect without timing out on a form that never renders.
 */
export class CheckoutPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('checkout-page');
    }

    private get orderTitle() {
        return this.page.getByTestId('order-title');
    }

    private get orderTotal() {
        return this.page.getByTestId('order-total');
    }

    private get payNowButton() {
        return this.page.getByTestId('pay-now-button');
    }

    private paymentMethod(method: string) {
        return this.page.getByTestId(`payment-method-${method}`);
    }

    async goto(courseId: string) {
        await this.navigate(CHECKOUT_PATH(courseId));
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async isLoaded(): Promise<boolean> {
        return (await this.pageRoot.count()) > 0;
    }

    async getOrderTitle(): Promise<string> {
        return (await this.orderTitle.textContent())?.trim() ?? '';
    }

    async getOrderTotal(): Promise<number> {
        const text = (await this.orderTotal.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async selectPaymentMethod(method: string) {
        await this.paymentMethod(method).click();
    }

    /** Records a PENDING transaction and lands on the status page. */
    async payNow() {
        await this.payNowButton.click();
        await this.page.waitForURL((url) => url.pathname === '/checkout/status');
    }
}
