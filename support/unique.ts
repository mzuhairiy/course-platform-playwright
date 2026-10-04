import { test } from '@playwright/test';

/**
 * Unique-by-run identities for @mutating tests (§9).
 *
 * The SUT has no unenroll/delete-user feature, so a test that dirties a
 * shared seed account dirties it permanently. Instead of cleaning up after
 * the fact, mutating tests manufacture their own throwaway identity: the
 * seed fixtures stay pristine and the test stays repeatable. The accounts
 * left behind are uniquely named, so they never collide across runs or
 * parallel workers.
 */
export const THROWAWAY_NAME = 'Playwright Student';
export const THROWAWAY_PASSWORD = 'Password123!';

let sequence = 0;

/** The sequence number keeps two calls in the same millisecond (same worker) apart. */
function stamp(): string {
    sequence += 1;
    return `${Date.now()}-${test.info().workerIndex}-${sequence}`;
}

export function uniqueEmail(prefix = 'playwright'): string {
    return `${prefix}-${stamp()}@example.com`;
}

/** Unique data name (course titles, review comments) — §9 poin 1. */
export function uniqueName(prefix: string): string {
    return `${prefix} ${stamp()}`;
}
