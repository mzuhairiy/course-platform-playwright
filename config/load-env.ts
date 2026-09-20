/**
 * Side-effect-only module: loads .env files into process.env before anything
 * else in config/ reads them.
 *
 * Deliberately its own file rather than inline in environments.ts or
 * playwright.config.ts: TypeScript/esbuild hoist `import` statements above
 * other top-level code *within a file*, so a plain `dotenv.config()` call
 * sitting next to an `import { getEnvironment } from './environments'` in the
 * same file cannot be relied on to run first — the import would win the race
 * and read process.env before dotenv populated it. Putting the loading here
 * and importing this file *first* in environments.ts/credentials.ts sidesteps
 * the whole problem: a module's own top-level code always finishes running
 * before the file that imported it continues, so this always goes first.
 *
 * Loads .env.<TEST_ENV> (e.g. .env.staging) then a plain .env as a fallback
 * for anything the former doesn't set. Never overrides a variable the shell
 * or CI already exported (dotenv's default behaviour).
 */
import path from 'node:path';
import dotenv from 'dotenv';

const activeEnvName = process.env.TEST_ENV ?? 'development';

dotenv.config({ path: path.resolve(__dirname, '..', `.env.${activeEnvName}`) });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
