// Same reason as credentials.ts: environments.ts must load .env first.
import './load-env';

import { getEnvironment, EnvironmentName } from './environments';

/**
 * Database connection per environment, used ONLY by support/db.ts to sweep up
 * the data the suite itself created (§9.2). It is never used to set up or
 * assert behaviour — that still goes through the UI.
 *
 * - development: hardcoded, same reasoning as the credential profiles — it
 *   only ever points at the local throwaway Postgres from course-platform's
 *   docker-compose (host port 5434).
 * - staging: opt-in. Set STAGING_DATABASE_URL (ideally a restricted DB user
 *   that can only DELETE the tables the sweep touches) to turn it on; leave it
 *   unset and the sweep is simply skipped.
 * - production: never. getDatabaseUrl() throws instead of returning a URL, so
 *   a stray PRODUCTION_DATABASE_URL in someone's .env can't be used by accident.
 */
const DEVELOPMENT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/course_platform';

export function getDatabaseUrl(name: EnvironmentName = getEnvironment().name): string | undefined {
    switch (name) {
        case 'development':
            return process.env.DEVELOPMENT_DATABASE_URL || DEVELOPMENT_DATABASE_URL;
        case 'staging':
            return process.env.STAGING_DATABASE_URL || undefined;
        case 'production':
            throw new Error(
                'Refusing to open a database connection for production: this suite must never write to the production database.',
            );
    }
}
