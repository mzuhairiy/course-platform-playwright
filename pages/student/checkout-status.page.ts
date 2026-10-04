import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const STATUS_PATH = '/checkout/status';

/**
 * The deterministic payment simulator. PENDING is the only state an order
 * starts in; the two simulate buttons drive it to SUCCESS or CANCELLED — the
 * SUT has no path to FAILED, EXPIRED or REFUNDED (§11).
 */
export class CheckoutStatusPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('checkout-status');
    }

    private get simulateSuccessButton() {
        return this.page.getByTestId('simulate-success-button');
    }

    private get simulateCancelButton() {
        return this.page.getByTestId('simulate-cancel-button');
    }

    private get orderIdDetail() {
        return this.page.getByTestId('detail-order-id');
    }

    private get startLearningButton() {
        return this.page.getByTestId('start-learning-button');
    }

    private get retryPaymentButton() {
        return this.page.getByTestId('retry-payment-button');
    }

    private statusBadge(status: string) {
        return this.page.getByTestId(`status-${status}`);
    }

    /** Doesn't wait for the page: someone else's order renders not-found instead. */
    async goto(orderId: string) {
        await this.navigate(`${STATUS_PATH}?order_id=${encodeURIComponent(orderId)}`);
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async getOrderId(): Promise<string> {
        return (await this.orderIdDetail.textContent())?.trim() ?? '';
    }

    /** Server Action + router refresh — wait on the DOM, not a response (§11). */
    async simulateSuccess() {
        await this.simulateSuccessButton.click();
        await this.statusBadge('success').waitFor({ state: 'visible' });
    }

    async simulateCancel() {
        await this.simulateCancelButton.click();
        await this.statusBadge('cancelled').waitFor({ state: 'visible' });
    }

    async startLearning() {
        await this.startLearningButton.click();
    }

    async isPending(): Promise<boolean> {
        return (await this.statusBadge('pending').count()) > 0;
    }

    async isPaid(): Promise<boolean> {
        return (await this.statusBadge('success').count()) > 0;
    }

    async isCancelled(): Promise<boolean> {
        return (await this.statusBadge('cancelled').count()) > 0;
    }

    async isStartLearningOffered(): Promise<boolean> {
        return (await this.startLearningButton.count()) > 0;
    }

    async isRetryPaymentOffered(): Promise<boolean> {
        return (await this.retryPaymentButton.count()) > 0;
    }
}
