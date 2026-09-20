// Must come before ./environments too — see load-env.ts for why. (Harmless if
// environments.ts already triggered it: dotenv.config() is a no-op on an
// already-loaded module, and Node caches the module either way.)
import './load-env';

import { ACTIVE_ENVIRONMENT, EnvironmentName } from './environments';

/**
 * Credential profiles, one per role the SUT recognizes. Add a role here (and
 * to every environment's map below) rather than passing raw emails/passwords
 * around test files — a profile is a name a test reads like a business
 * persona ("log in as an admin"), not a secret a test happens to know.
 */
export type Role = 'admin' | 'student' | 'studentFresh' | 'instructor' | 'instructorOther';

export interface CredentialProfile {
    role: Role;
    email: string;
    password: string;
    /** For readability in test output / reports; not used for login. */
    displayName?: string;
}

type ProfilesByRole = Record<Role, CredentialProfile>;

/**
 * development mirrors course-platform's own Prisma seed exactly (same
 * accounts the course-platform-bdd suite uses) — fixed, well-known, and safe
 * to commit because it only ever points at a local throwaway database.
 */
const DEVELOPMENT_PROFILES: ProfilesByRole = {
    admin: {
        role: 'admin',
        email: 'admin@example.com',
        password: 'Password123!',
        displayName: 'Admin',
    },
    student: {
        role: 'student',
        email: 'student@example.com',
        password: 'Password123!',
        displayName: 'John Student',
    },
    // Enrolled in nothing, no history — the profile to reach for whenever a
    // test needs to start from a clean slate rather than the seed's
    // already-in-progress student.
    studentFresh: {
        role: 'studentFresh',
        email: 'student2@example.com',
        password: 'Password123!',
        displayName: 'Sari Belajar',
    },
    instructor: {
        role: 'instructor',
        email: 'instructor@example.com',
        password: 'Password123!',
        displayName: 'Budi Santoso',
    },
    // A second instructor account, owning different courses — needed for
    // ownership/RBAC tests ("instructor A cannot touch instructor B's
    // course"), not for anything the "instructor" profile above can't reach
    // on its own.
    instructorOther: {
        role: 'instructorOther',
        email: 'instructor2@example.com',
        password: 'Password123!',
        displayName: 'Instructor Two',
    },
};

/**
 * Real credentials for a real environment never belong in source control.
 * Staging/production profiles are assembled from environment variables (see
 * .env.example) and are deliberately empty until those are set — see
 * getCredential()'s guard below, which fails loudly rather than silently
 * trying to log in with an empty password.
 */
function fromEnv(role: Role, prefix: string): CredentialProfile {
    return {
        role,
        email: process.env[`${prefix}_EMAIL`] ?? '',
        password: process.env[`${prefix}_PASSWORD`] ?? '',
    };
}

const STAGING_PROFILES: ProfilesByRole = {
    admin: fromEnv('admin', 'STAGING_ADMIN'),
    student: fromEnv('student', 'STAGING_STUDENT'),
    studentFresh: fromEnv('studentFresh', 'STAGING_STUDENT_FRESH'),
    instructor: fromEnv('instructor', 'STAGING_INSTRUCTOR'),
    instructorOther: fromEnv('instructorOther', 'STAGING_INSTRUCTOR_OTHER'),
};

const PRODUCTION_PROFILES: ProfilesByRole = {
    admin: fromEnv('admin', 'PRODUCTION_ADMIN'),
    student: fromEnv('student', 'PRODUCTION_STUDENT'),
    studentFresh: fromEnv('studentFresh', 'PRODUCTION_STUDENT_FRESH'),
    instructor: fromEnv('instructor', 'PRODUCTION_INSTRUCTOR'),
    instructorOther: fromEnv('instructorOther', 'PRODUCTION_INSTRUCTOR_OTHER'),
};

const CREDENTIAL_PROFILES: Record<EnvironmentName, ProfilesByRole> = {
    development: DEVELOPMENT_PROFILES,
    staging: STAGING_PROFILES,
    production: PRODUCTION_PROFILES,
};

/**
 * Looks up one role's credentials for an environment (defaults to whichever
 * environment the run is targeting). Throws instead of returning an empty
 * profile, so a missing .env.staging entry fails the test with a clear
 * message at login time rather than a confusing "wrong password" from the
 * SUT three steps later.
 */
export function getCredential(role: Role, env: EnvironmentName = ACTIVE_ENVIRONMENT): CredentialProfile {
    const profile = CREDENTIAL_PROFILES[env][role];
    if (!profile.email || !profile.password) {
        throw new Error(
            `No credentials configured for role "${role}" in environment "${env}". ` +
                (env === 'development'
                    ? 'This should never happen for development — check config/credentials.ts.'
                    : `Set ${env.toUpperCase()}_${String(role).toUpperCase()}_EMAIL / _PASSWORD in .env.${env} (see .env.example).`),
        );
    }
    return profile;
}

/** All profiles for one environment — handy for parametrized "for every role" tests. */
export function getAllCredentials(env: EnvironmentName = ACTIVE_ENVIRONMENT): CredentialProfile[] {
    return Object.values(CREDENTIAL_PROFILES[env]);
}
