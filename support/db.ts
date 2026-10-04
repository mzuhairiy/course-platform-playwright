import { Client } from 'pg';
import { getEnvironment } from '../config/environments';
import { getDatabaseUrl } from '../config/database';
import { THROWAWAY_NAME } from './unique';

/**
 * Sweeps up the data this suite leaves behind. Direct DB access is limited to
 * this one file and to DELETE-by-test-owned-pattern: it never sets up state or
 * asserts anything (§9.2) — the UI stays the source of truth for behaviour.
 *
 * What counts as "test-owned" is deliberately narrow, so a seed row can never
 * match:
 *   - accounts whose email is `playwright-…@example.com` AND whose name is the
 *     throwaway name (support/unique.ts) — seed emails never look like that;
 *   - courses titled `Automation Course …` (scratch courses left behind by a
 *     killed run).
 *
 * Deleting a user cascades to their enrolments, progress, quiz attempts and
 * reviews (and so also takes their review out of a seed course's rating), but
 * NOT to orders and certificates — those foreign keys don't cascade — so those
 * are removed first.
 */
const THROWAWAY_EMAIL_PATTERN = 'playwright-%@example.com';
const SCRATCH_COURSE_TITLE_PATTERN = 'Automation Course %';

export interface CleanupReport {
    skipped?: string;
    accounts: number;
    transactions: number;
    certificates: number;
    scratchCourses: number;
}

const EMPTY: CleanupReport = { accounts: 0, transactions: 0, certificates: 0, scratchCourses: 0 };

/** `dryRun` only counts what would be removed (needs SELECT); nothing is written. */
export async function cleanupTestData(options: { dryRun?: boolean } = {}): Promise<CleanupReport> {
    if (process.env.DB_CLEANUP === 'off') {
        return { ...EMPTY, skipped: 'DB_CLEANUP=off' };
    }

    const env = getEnvironment();
    const url = getDatabaseUrl(env.name);
    if (!url) {
        return { ...EMPTY, skipped: `no database configured for ${env.name} (set STAGING_DATABASE_URL to enable)` };
    }

    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        const users = `SELECT id FROM "User" WHERE email LIKE $1 AND name = $2`;
        const userParams = [THROWAWAY_EMAIL_PATTERN, THROWAWAY_NAME];

        if (options.dryRun) {
            // Counting needs SELECT. A real run below does not: it reads each
            // DELETE's rowCount, so a DELETE-only database role is enough.
            const count = async (sql: string, params: unknown[]) => Number((await client.query(sql, params)).rows[0].n);
            return {
                accounts: await count(`SELECT count(*) AS n FROM "User" WHERE email LIKE $1 AND name = $2`, userParams),
                transactions: await count(`SELECT count(*) AS n FROM "Transaction" WHERE "userId" IN (${users})`, userParams),
                certificates: await count(`SELECT count(*) AS n FROM "Certificate" WHERE "userId" IN (${users})`, userParams),
                scratchCourses: await count(`SELECT count(*) AS n FROM "Course" WHERE title LIKE $1`, [SCRATCH_COURSE_TITLE_PATTERN]),
            };
        }

        await client.query('BEGIN');
        try {
            const certificates = (await client.query(`DELETE FROM "Certificate" WHERE "userId" IN (${users})`, userParams)).rowCount ?? 0;
            const transactions = (await client.query(`DELETE FROM "Transaction" WHERE "userId" IN (${users})`, userParams)).rowCount ?? 0;
            const accounts = (await client.query(`DELETE FROM "User" WHERE email LIKE $1 AND name = $2`, userParams)).rowCount ?? 0;
            const scratchCourses = (await client.query(`DELETE FROM "Course" WHERE title LIKE $1`, [SCRATCH_COURSE_TITLE_PATTERN])).rowCount ?? 0;
            await client.query('COMMIT');
            return { accounts, transactions, certificates, scratchCourses };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    } finally {
        await client.end();
    }
}
