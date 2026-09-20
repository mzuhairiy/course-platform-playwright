# course-platform-playwright

Playwright + Page Object Model automation for **CoursePlatform**. Plain
Playwright Test (no BDD/Gherkin) — a separate suite from `course-platform-bdd`,
same SUT (`course-platform`).

## Why this exists alongside course-platform-bdd

`course-platform-bdd` is the Gherkin/business-readable suite. This one is a
plain POM framework built around two things that suite doesn't need:
switching between **environments** (development/staging/production) and
running the same test as **different roles** via named credential profiles.
Use this when the scenario is "run this against staging as an instructor",
not "explain this behaviour to a non-technical reader".

## Prerequisites

The SUT is `course-platform` — same app, same seed data, nothing SUT-side
changes for this repo. For `development` (the default), it must be running
locally:

```bash
cd ../course-platform
docker compose up -d --wait
npm run db:seed
npm run dev          # must be on :3002
```

## Install

```bash
npm install
npx playwright install   # first time only — downloads the browsers
```

## Project layout

```
config/
  environments.ts   # base + per-environment overrides (baseURL, retries, ...)
  credentials.ts     # role -> {email, password} per environment
  load-env.ts        # loads .env.<TEST_ENV> then .env — see its own comment
  index.ts            # barrel export
pages/                # Page Object Model, one class per page/component
  base.page.ts
  auth/sign-in.page.ts
  student/dashboard.page.ts
  instructor/dashboard.page.ts
  admin/dashboard.page.ts
fixtures/
  roles.fixture.ts    # adds `loginAs(role)` to Playwright's `test`
tests/
  auth/               # plain @playwright/test, no fixture needed
  smoke/              # uses the `loginAs` fixture
playwright.config.ts   # reads config/environments.ts; nothing env-specific here
```

## Switching environments

Three ways, in order of how permanent the change is:

1. **Just for one run** (recommended for staging/production):
   ```bash
   npm run test:staging     # TEST_ENV=staging under the hood
   npm run test:prod
   npm run test:dev         # explicit, same as the default
   ```
2. **Shell/CI variable**, same effect as above:
   ```bash
   TEST_ENV=staging npx playwright test
   ```
3. **Directly in config** (what the task asked for): edit the one line in
   [`config/environments.ts`](config/environments.ts):
   ```ts
   export const ACTIVE_ENVIRONMENT: EnvironmentName =
       (process.env.TEST_ENV as EnvironmentName | undefined) ?? 'development';
   //                                                            ^^^^^^^^^^^^^ change this
   ```
   A `TEST_ENV` from the shell still wins over this default — that's what lets
   the `npm run test:*` scripts and CI override it without touching the file.

Adding a fourth environment (e.g. `qa`): add its name to `EnvironmentName` and
one entry to the `ENVIRONMENTS` map in `config/environments.ts` — only the
fields that differ from `BASE_CONFIG` need to be listed (that's the "multi-
level" part: a shared base layer, plus a thin per-environment override).

### staging / production configuration

`development`'s URL and credentials are hardcoded in `config/` on purpose —
they only ever point at a local, throwaway seed database, the same one
`course-platform-bdd` uses.

`staging` and `production` read from environment variables instead, since
real URLs and credentials don't belong in source control:

```bash
cp .env.example .env.staging      # then fill in the values
cp .env.example .env.production
```

`.env.staging` / `.env.production` are gitignored. Running with `TEST_ENV=staging`
loads `.env.staging` first, then `.env` as a fallback for anything it doesn't set.

### Running against production

Keep production credentials to read-only / smoke accounts. Nothing in this
repo currently guards against a test enrolling, paying, or submitting a quiz
against production — that guard has to be a property of *which tests* you
point at `TEST_ENV=production`, not something the framework enforces for you.
`tests/smoke/` is meant to be the safe subset for that.

## Credential profiles

Defined once in [`config/credentials.ts`](config/credentials.ts), looked up by
role rather than by hardcoding an email/password in a test:

| Role | Who | Notes |
|---|---|---|
| `admin` | Full platform access | |
| `student` | Has existing enrollments/progress | Use when a test wants that. |
| `studentFresh` | Enrolled in nothing, no history | Use when a test needs a clean slate. |
| `instructor` | Owns several courses | |
| `instructorOther` | Owns different courses | For ownership/RBAC checks between two instructors. |

Two ways to use a profile in a test:

```ts
// 1. Via the loginAs fixture (fixtures/roles.fixture.ts) — logs `page` in.
import { test, expect } from '../../fixtures/roles.fixture';

test('admin sees the dashboard', async ({ page, loginAs }) => {
    await loginAs('admin');
    // ...
});

// 2. Read the profile directly (e.g. to assert against its email, or to
//    drive a lower-level flow the fixture doesn't cover).
import { getCredential } from '../../config/credentials';

const { email, password } = getCredential('instructor');
```

Add a role: extend the `Role` union and add one entry to every environment's
map in `config/credentials.ts` (`DEVELOPMENT_PROFILES`, and a `fromEnv(...)`
line for staging/production).

## Running tests

```bash
npm test                 # all tests, active environment
npm run test:headed      # see the browser
npm run test:debug       # Playwright Inspector
npm run test:ui          # Playwright's UI mode
npm run report           # open the last HTML report
```

Target one project (browser) or file the normal Playwright way:

```bash
npx playwright test --project=chromium
npx playwright test tests/smoke/
```

## Adding a new page object / test

1. Page object goes in `pages/<area>/<name>.page.ts`, extending `BasePage`.
   Locators are `private get`s using `getByTestId` — never a raw CSS selector,
   and never exposed outside the class. Methods read as user actions
   (`clickEnroll`, `submitQuiz`), not as clicks on a testid.
2. Test goes in `tests/<area>/<name>.spec.ts`. Import the `loginAs` fixture
   only if the test needs to be signed in as a specific role; otherwise plain
   `@playwright/test` is enough (see `tests/auth/sign-in.spec.ts`).
