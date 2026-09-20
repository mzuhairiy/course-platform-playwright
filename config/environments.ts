// Must be the first import in this file — see load-env.ts for why.
import './load-env';

/**
 * Multi-level environment configuration.
 *
 * "Multi-level" means two layers that get merged, not three flat copies of
 * the same shape:
 *   1. BASE_CONFIG   — defaults shared by every environment.
 *   2. ENVIRONMENTS  — a partial override per environment; only what differs
 *                       from the base needs to be listed.
 *
 * getEnvironment() merges the two. To add a fourth environment (e.g. "qa"),
 * add its name to EnvironmentName and one entry to ENVIRONMENTS — everything
 * it doesn't override falls back to BASE_CONFIG automatically.
 */

export type EnvironmentName = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
    /** Which environment this resolved config describes. */
    name: EnvironmentName;
    /** SUT origin. Every page object / test navigates relative to this. */
    baseURL: string;
    /** Playwright per-test timeout, in ms. */
    timeout: number;
    /** Playwright retries. Kept at 0 for development on purpose — see below. */
    retries: number;
    /** Undefined lets Playwright pick a worker count based on CPU cores. */
    workers: number | undefined;
    /** Run browsers headless. Development defaults to headed-friendly (still
     *  headless by default, but this is the one flag you'd flip locally). */
    headless: boolean;
    /** Playwright trace collection mode. */
    trace: 'on' | 'off' | 'retain-on-failure' | 'on-first-retry';
}

const BASE_CONFIG: EnvironmentConfig = {
    name: 'development',
    baseURL: 'http://localhost:3002',
    timeout: 30_000,
    // No retries anywhere by default: a retry that turns a real failure green
    // hides it. Staging/production raise this deliberately below, to absorb
    // real network flakiness that a local dev server doesn't have.
    retries: 0,
    workers: undefined,
    headless: true,
    trace: 'retain-on-failure',
};

/**
 * Only the fields that differ from BASE_CONFIG belong here. `development`
 * needs nothing — it *is* the base — so its entry is empty on purpose.
 *
 * staging/production baseURLs are read from the environment rather than
 * hardcoded: they point at real, deployed infrastructure that doesn't belong
 * in source control, and will differ per person/CI running this suite.
 */
const ENVIRONMENTS: Record<EnvironmentName, Partial<EnvironmentConfig>> = {
    development: {},
    staging: {
        baseURL: process.env.STAGING_BASE_URL ?? 'https://staging.course-platform.example.com',
        retries: 1,
    },
    production: {
        baseURL: process.env.PRODUCTION_BASE_URL ?? 'https://course-platform.example.com',
        retries: 2,
        // Production is read-only / smoke-only territory as a rule — see
        // README "Running against production" before pointing anything
        // mutating (checkout, quiz submission, account changes) at it.
    },
};

/**
 * The one line to edit to change which environment the whole suite targets
 * by default — set directly here, exactly as asked for. `TEST_ENV` (env var)
 * overrides this without touching the file, which is what the npm scripts
 * (`test:dev`, `test:staging`, `test:prod`) and CI use.
 */
export const ACTIVE_ENVIRONMENT: EnvironmentName =
    (process.env.TEST_ENV as EnvironmentName | undefined) ?? 'development';

const VALID_ENVIRONMENTS: readonly EnvironmentName[] = ['development', 'staging', 'production'];

function assertValidEnvironment(name: string): asserts name is EnvironmentName {
    if (!VALID_ENVIRONMENTS.includes(name as EnvironmentName)) {
        throw new Error(
            `Unknown environment "${name}". Valid values: ${VALID_ENVIRONMENTS.join(', ')}.`,
        );
    }
}

/** Resolves one environment's full config (base + its overrides), merged. */
export function getEnvironment(name: EnvironmentName = ACTIVE_ENVIRONMENT): EnvironmentConfig {
    assertValidEnvironment(name);
    return { ...BASE_CONFIG, ...ENVIRONMENTS[name], name };
}
