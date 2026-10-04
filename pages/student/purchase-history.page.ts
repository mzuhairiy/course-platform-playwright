import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const PURCHASE_HISTORY_PATH = '/purchase-history';

export class PurchaseHistoryPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('purchase-history');
    }

    private get emptyState() {
        return this.page.getByTestId('purchase-history-empty');
    }

    private get transactionRows() {
        return this.page.getByTestId('transaction-row');
    }

    private get continuePaymentLink() {
        return this.page.getByTestId('continue-payment-link');
    }

    async goto() {
        await this.navigate(PURCHASE_HISTORY_PATH);
        // Either the list or the empty state renders; both mean "arrived".
        await this.pageRoot.or(this.emptyState).first().waitFor({ state: 'visible' });
    }

    async getTransactionCount(): Promise<number> {
        return this.transactionRows.count();
    }

    async isContinuePaymentOffered(): Promise<boolean> {
        return (await this.continuePaymentLink.count()) > 0;
    }

    async continuePayment() {
        await this.continuePaymentLink.first().click();
        await this.page.waitForURL((url) => url.pathname === '/checkout/status');
    }
}
