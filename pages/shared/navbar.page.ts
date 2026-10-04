import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * The marketing-style navbar a signed-in student sees. Instructor/admin
 * render inside a different shell with its own user-menu/sign-out testids
 * (`workspace-user-menu-trigger` / `workspace-menu-sign-out`) — add a
 * WorkspaceShellPage alongside this one if a test needs to drive that.
 */
export class NavbarPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get userMenuTrigger() {
        return this.page.getByTestId('user-menu-trigger');
    }

    private get signOutButton() {
        return this.page.getByTestId('menu-sign-out');
    }

    async signOut() {
        await this.userMenuTrigger.click();
        await this.signOutButton.click();
        await this.page.waitForURL((url) => url.pathname === '/');
    }
}
