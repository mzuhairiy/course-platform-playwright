import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

const USERS_PATH = '/admin/users';

/** The platform-wide user directory, with the role control per account. */
export class AdminUsersPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('admin-users');
    }

    private get userItems() {
        return this.page.getByTestId('admin-user-item');
    }

    private get confirmButton() {
        return this.page.getByTestId('admin-role-confirm');
    }

    private userRow(email: string): Locator {
        return this.userItems.filter({ hasText: email }).first();
    }

    private roleDropdown(email: string): Locator {
        return this.userRow(email).getByTestId('admin-role-dropdown');
    }

    async goto() {
        await this.navigate(USERS_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    /**
     * Picks a new role and confirms the dialog. The dropdown is controlled by
     * the saved role, so it only reads the new value once the Server Action
     * and the refresh have landed — that is what this waits for.
     */
    async changeRole(email: string, role: string) {
        await this.roleDropdown(email).selectOption(role);
        await this.confirmButton.click();
        await this.page.waitForFunction(
            ({ address, expected }) => {
                const row = [...document.querySelectorAll('[data-testid="admin-user-item"]')].find((item) =>
                    item.textContent?.includes(address),
                );
                const select = row?.querySelector('[data-testid="admin-role-dropdown"]') as HTMLSelectElement | null;
                return select?.value === expected;
            },
            { address: email, expected: role },
        );
    }

    async getRole(email: string): Promise<string> {
        return this.roleDropdown(email).inputValue();
    }

    async isRoleEditable(email: string): Promise<boolean> {
        return this.roleDropdown(email).isEnabled();
    }

    async getListedRoles(): Promise<string[]> {
        const dropdowns = this.userItems.getByTestId('admin-role-dropdown');
        const total = await dropdowns.count();
        const roles: string[] = [];
        for (let index = 0; index < total; index++) {
            roles.push(await dropdowns.nth(index).inputValue());
        }
        return roles;
    }
}
