/**
 * Per-test time budgets for tests whose *Arrange* is a long UI flow.
 *
 * The suite has no DB access (§9), so state that the BDD suite inserts with
 * SQL — a course with lessons, a finished curriculum — is built here by
 * driving the real UI. That is several page loads and Server Actions before
 * the behaviour under test even starts, and Firefox (the slowest of the three
 * projects) already spends ~20 s of the 30 s default on it. Raising the budget
 * for exactly those tests is the honest fix; raising `retries` would hide a
 * real failure instead (§13).
 */

/**
 * A scratch course built through the form + lesson manager, a throwaway
 * student signed up and taken through a purchase, or several users signing in
 * and out across contexts (instructor, admin and student flow tests).
 */
export const LONG_SETUP_TEST_TIMEOUT_MS = 90_000;

/** A student walking an entire course to 100% (certificate tests). */
export const FINISH_COURSE_TEST_TIMEOUT_MS = 120_000;
