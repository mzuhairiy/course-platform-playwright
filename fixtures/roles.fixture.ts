import { test as base } from '@playwright/test';
import { SignInPage } from '../pages/auth/sign-in.page';
import { getCredential, Role } from '../config/credentials';

type RoleFixtures = {
    /**
     * Logs the current `page` in as the named credential profile
     * (admin / student / studentFresh / instructor / instructorOther),
     * resolved for whichever environment the run is targeting.
     *
     *   test('admin sees the dashboard', async ({ page, loginAs }) => {
     *     await loginAs('admin');
     *     await new AdminDashboardPage(page).goto();
     *   });
     */
    loginAs: (role: Role) => Promise<void>;
};

export const test = base.extend<RoleFixtures>({
    loginAs: async ({ page }, use) => {
        await use(async (role: Role) => {
            const credential = getCredential(role);
            await new SignInPage(page).loginAs(credential.email, credential.password);
        });
    },
});

export { expect } from '@playwright/test';
