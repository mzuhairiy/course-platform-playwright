import { test, expect } from '../../fixtures/roles.fixture';
import { getAllCredentials, Role } from '../../config/credentials';

const ROLE_HOME_PATH: Record<Role, string> = {
    admin: '/admin',
    student: '/dashboard',
    studentFresh: '/dashboard',
    instructor: '/instructor',
    instructorOther: '/instructor',
};

test.describe('Role landing', { tag: ['@smoke', '@rbac'] }, () => {
    for (const profile of getAllCredentials()) {
        test(`${profile.role} lands on its own home after signing in`, async ({ page, loginAs }) => {
            // Act
            await loginAs(profile.role);

            // Assert
            await expect(page).toHaveURL(ROLE_HOME_PATH[profile.role]);
        });
    }
});
