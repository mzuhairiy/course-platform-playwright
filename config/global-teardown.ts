import { cleanupTestData } from '../support/db';

/**
 * Runs once after the whole suite (pass or fail) and sweeps up the throwaway
 * accounts, orders and scratch courses it left behind (§9.2). A failure here
 * must not turn a green run red — leftover data is untidy, not a test failure —
 * so it is reported and swallowed.
 */
export default async function globalTeardown() {
    try {
        const report = await cleanupTestData();
        if (report.skipped) {
            console.log(`DB cleanup skipped: ${report.skipped}`);
            return;
        }
        console.log(
            `DB cleanup: removed ${report.accounts} throwaway accounts, ` +
                `${report.transactions} orders, ${report.certificates} certificates, ` +
                `${report.scratchCourses} scratch courses`,
        );
    } catch (error) {
        console.warn(`DB cleanup failed (data left in place): ${(error as Error).message}`);
    }
}
