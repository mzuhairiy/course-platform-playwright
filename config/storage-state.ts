import path from 'path';
import { ACTIVE_ENVIRONMENT } from './environments';
import { Role } from './credentials';

/**
 * Shared by global-setup.ts (writes these files once per run) and
 * fixtures/storage.fixture.ts (reads them). The environment is baked into
 * the filename on purpose — that's the whole invalidation strategy: switch
 * TEST_ENV and you automatically get a different (or missing, triggering a
 * clear ENOENT) file instead of silently reusing another environment's
 * session (§5).
 */
export const AUTH_DIR = path.resolve(__dirname, '..', '.auth');

export function storageStatePath(role: Role): string {
    return path.join(AUTH_DIR, `${ACTIVE_ENVIRONMENT}-${role}.json`);
}
