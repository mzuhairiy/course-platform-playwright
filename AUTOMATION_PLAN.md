# CoursePlatform Playwright (POM) — Automation Plan

> **Repo:** `course-platform-playwright` (terpisah dari SUT `course-platform`)
> **Framework:** Playwright Test murni + Page Object Model — **tanpa BDD/Gherkin**
> **SUT:** Next.js 14 App Router — sama persis dengan yang dipakai `course-platform-bdd`
> **Testability hook:** `data-testid`
> **Differentiator:** multi-level environment (development / staging / production) +
> credential profile per role, dua-duanya di-resolve dari `config/`

---

## Status Implementasi (2026-10-02)

Fondasi dan seluruh rencana test (§10) sudah jalan end-to-end. Yang tersisa
hanya CI.

| Layer | Status |
|---|---|
| Multi-level environment config (`config/environments.ts`) | ✅ selesai |
| Credential profile 5 role (`config/credentials.ts`) | ✅ selesai |
| `.env` loading order (`config/load-env.ts`) | ✅ selesai |
| `loginAs(role)` fixture | ✅ selesai |
| Page object: student, instructor, admin, shared, marketing | ✅ selesai |
| Test case | ✅ **86 test** (rencana §10: 83 + 3 tambahan, lihat bawah) |
| Tag (`@smoke`/`@rbac`) + script (`test:smoke`, `test:rbac`, …) | ✅ selesai |
| `support/test-data.ts` (seed constants env-agnostic) | ✅ selesai |
| `storageState` caching per role | ✅ selesai |
| Fixture `newStudent` / `scratch` (state via UI, cleanup otomatis) | ✅ selesai |
| CI (GitHub Actions) | ⬜ belum |

Rincian per area: smoke 9 · auth 8 · rbac 10 · student 40 · instructor 12 ·
admin 7. Tiga test di luar rencana awal ditambahkan karena murah dan menutup
guard penting: ringkasan order di checkout, nomor sertifikat berformat salah
ditolak sebelum lookup, dan hapus course tertahan sampai judul diketik ulang.

**Dua temuan SUT** waktu menulis fase 5–6 (detail di §11): promosi role tidak
berlaku di sesi yang sedang terbuka (hanya pencabutan yang berlaku — sisa
BUG-002), dan nomor sertifikat hanya ada di dalam PDF-nya.

Dari 86 test itu, 7 yang paling awal bukan coverage — itu **proof of chain**:
membuktikan environment → credential profile → login nyata → dashboard per
role nyambung semua. Kalau bagian itu gagal, yang salah hampir pasti config,
bukan SUT.

---

## 1. Kenapa Repo Ini Ada (Bukan Duplikat `course-platform-bdd`)

Dua repo, satu SUT, beda tujuan. Jangan port test bolak-balik — pilih repo
berdasarkan pertanyaan yang mau dijawab.

| | `course-platform-bdd` | `course-platform-playwright` (ini) |
|---|---|---|
| Pertanyaan yang dijawab | "Jelaskan behaviour ini ke orang non-teknis" | "Jalankan ini di staging sebagai instructor" |
| Layer | Gherkin + playwright-bdd | Playwright Test murni |
| Artefak utama | `.feature` file (business readable) | `.spec.ts` (developer readable) |
| Environment | localhost saja | development / staging / production |
| Credential | konstanta di `test-data.ts` | profile per role, resolve per environment |
| Akses DB | ✅ Prisma + psql untuk setup, assert & cleanup | ⚠️ **hanya cleanup** (hapus data milik test) — lihat §9.2 |
| Cocok untuk | coverage fungsional lengkap, dokumentasi behaviour | smoke/regression lintas environment, deployment gate |

**Aturan pembagian:** kalau sebuah test butuh state yang cuma bisa dibikin
lewat DB, test itu milik repo BDD. Kalau test-nya bisa berdiri sendiri lewat
UI/API saja, dia boleh hidup di sini dan jadi portable ke staging.

Batas "cuma bisa lewat DB" ternyata lebih sempit dari dugaan awal. "Course
100% selesai" untuk certificate dulu dianggap milik BDD; nyatanya course
seed terkecil (3 section, 10 lecture) bisa ditamatkan lewat UI dalam ±5 detik
dengan seek video dan mengerjakan quiz, jadi seluruh test certificate hidup
di sini (`support/flows.ts` → `completeCourse`). Cek dulu lewat UI sebelum
melempar sebuah test ke repo BDD.

---

## 2. Tech Stack

| Layer | Choice | Catatan |
|---|---|---|
| Test runner | `@playwright/test` | tanpa layer BDD |
| Language | TypeScript (strict) | |
| Pattern | Page Object Model | locator `private`, tidak pernah bocor ke spec |
| Config | `config/` custom (base + override) | bukan `projects[]` per environment — lihat §4 |
| Secrets | `dotenv` + `.env.<TEST_ENV>` | gitignored, `.env.example` sebagai template |
| Assertion | `expect` bawaan Playwright | |
| Reporting | Playwright HTML + list | metadata berisi nama environment |
| CI | GitHub Actions (nanti) | matrix per environment |

### Kenapa bukan `projects[]` per environment

Playwright punya `projects[]`, dan environment bisa saja ditaruh di sana.
Sengaja tidak: `projects[]` sudah dipakai untuk **browser** (chromium /
firefox / webkit). Kalau environment ditumpuk di dimensi yang sama, jumlah
project jadi 3 × 3 = 9 dan tiap run mesti pakai `--project` yang panjang.
Environment dipisah ke `TEST_ENV` supaya dua dimensi itu tetap ortogonal:
satu run = satu environment × semua browser.

---

## 3. Struktur Folder

```
course-platform-playwright/
├── config/
│   ├── load-env.ts            ✅ side-effect: muat .env.<TEST_ENV> lalu .env
│   ├── environments.ts        ✅ BASE_CONFIG + override per environment
│   ├── credentials.ts         ✅ profile per role, per environment
│   ├── storage-state.ts       ✅ path helper .auth/<env>-<role>.json (§5)
│   ├── global-setup.ts        ✅ login 5 role sekali, isi .auth/ (§5)
│   ├── global-teardown.ts     ✅ sapu data milik test setelah run (§9.2)
│   ├── database.ts            ✅ URL DB per environment (production ditolak)
│   └── index.ts               ✅ barrel export
├── fixtures/
│   ├── roles.fixture.ts       ✅ loginAs(role) — via UI, real login
│   ├── storage.fixture.ts     ✅ authedPage(role) — via storageState cache (§5)
│   ├── student.fixture.ts     ✅ newStudent() / newStudentAccount() — sign-up sekali-pakai (§9.1)
│   └── instructor.fixture.ts  ✅ instructorPage + scratch.create()/track() — course sekali-pakai + cleanup (§9)
├── pages/
│   ├── base.page.ts           ✅ navigate() relative, helper bersama (§7)
│   ├── marketing/
│   │   ├── home.page.ts       ✅ landing page, testid `hero-cta-browse`
│   │   └── verify.page.ts     ✅ /verify — verifikasi nomor sertifikat (publik)
│   ├── auth/
│   │   ├── sign-in.page.ts    ✅
│   │   └── sign-up.page.ts    ✅
│   ├── shared/
│   │   ├── navbar.page.ts     ✅ marketing navbar (student) — sign out
│   │   ├── workspace-shell.page.ts ⬜ instructor/admin pakai shell beda,
│   │   │                             testid `workspace-user-menu-trigger` /
│   │   │                             `workspace-menu-sign-out` — bikin kalau
│   │   │                             ada test yang butuh
│   │   ├── forbidden.page.ts  ✅
│   │   └── not-found.page.ts  ✅
│   ├── student/
│   │   ├── dashboard.page.ts  ✅
│   │   ├── courses.page.ts    ✅
│   │   ├── course-detail.page.ts ✅ + kurikulum & review
│   │   ├── lecture.page.ts    ✅ player: video / reading / quiz
│   │   ├── quiz.page.ts       ✅
│   │   ├── checkout.page.ts   ✅
│   │   ├── checkout-status.page.ts ✅ payment simulator
│   │   ├── purchase-history.page.ts ✅
│   │   └── certificate.page.ts ✅
│   ├── instructor/
│   │   ├── dashboard.page.ts  ✅
│   │   ├── courses.page.ts    ✅ daftar "My Courses"
│   │   ├── course-form.page.ts ✅ buat course, return id dari URL
│   │   ├── course-edit.page.ts ✅ status, publish/unpublish, hapus
│   │   └── lesson-manager.page.ts ✅
│   └── admin/
│       ├── dashboard.page.ts  ✅
│       ├── courses.page.ts    ✅ moderasi (archive/unarchive)
│       └── users.page.ts      ✅ direktori + role control
├── tests/                     ✅ mencerminkan pages/
│   ├── smoke/                 ✅ aman di semua environment
│   ├── auth/                  ✅
│   ├── rbac/                  ✅ role-gate + ownership
│   ├── student/               ✅
│   ├── instructor/            ✅
│   └── admin/                 ✅
├── support/
│   ├── test-data.ts           ✅ konstanta course/slug/quiz env-agnostic (§9)
│   ├── unique.ts              ✅ uniqueEmail() / uniqueName() untuk @mutating (§9.1)
│   ├── flows.ts               ✅ enrollInFreeCourse / startPayment / buyCourse / completeCourse
│   ├── timeouts.ts            ✅ budget waktu untuk test dengan Arrange panjang
│   ├── db.ts                  ✅ cleanupTestData() — hanya DELETE milik test (§9.2)
│   └── pdf.ts                 ✅ baca nomor sertifikat dari PDF (§11)
├── playwright.config.ts       ✅
├── .env.example               ✅
└── README.md                  ✅
```

Aturannya: **struktur `tests/` mencerminkan struktur `pages/`**, dan keduanya
dipecah per *area* (peran + domain), bukan per jenis test. Tidak ada folder
`tests/regression/` atau `tests/negative/` — itu urusan tag, bukan folder
(§6.6).

---

## 4. Environment Strategy — Inti Repo Ini

### Dua layer, bukan tiga salinan

```ts
BASE_CONFIG                      // default yang dipakai semua environment
  ← ENVIRONMENTS[name]           // hanya field yang berbeda
  = getEnvironment(name)         // hasil merge
```

`development` entry-nya **kosong** — dia memang basis-nya. Nambah environment
keempat (`qa`) = tambah nama ke `EnvironmentName` + satu entry berisi yang
beda saja.

| Field | development | staging | production |
|---|---|---|---|
| `baseURL` | `http://localhost:3002` | `STAGING_BASE_URL` | `PRODUCTION_BASE_URL` |
| `retries` | 0 | 1 | 2 |
| `trace` | retain-on-failure | ← | ← |
| kredensial | hardcoded (seed lokal) | `.env.staging` | `.env.production` |

`retries: 0` di development disengaja: retry yang bikin failure asli jadi
hijau itu menyembunyikan bug. Staging/production naik karena di sana ada
flakiness jaringan nyata yang dev server lokal tidak punya.

### Tiga cara switch (urut dari paling sementara)

```bash
npm run test:staging              # 1. sekali jalan  → TEST_ENV=staging
TEST_ENV=staging npx playwright test   # 2. shell/CI
# 3. permanen: ubah default di ACTIVE_ENVIRONMENT (config/environments.ts)
```

`TEST_ENV` dari shell selalu menang atas default di file — itu yang bikin
npm script dan CI bisa override tanpa nyentuh source.

### Environment-safety tier (⚠️ wajib dipatuhi)

Framework **tidak** mencegah test merusak data production. Yang mencegah
adalah disiplin tag. Setiap test wajib masuk salah satu tier:

| Tier | Tag | Boleh jalan di | Definisi |
|---|---|---|---|
| Read-only | `@smoke` | dev, staging, **prod** | tidak menulis apa pun. Login + baca halaman. |
| Mutating | `@mutating` | dev, staging | bikin/ubah data, tapi bersih-bersih sendiri lewat UI |
| Seed-dependent | `@dev-only` | dev | butuh course/user hasil seed spesifik |

Default kalau ragu: `@dev-only`. Menaikkan tier itu keputusan sadar, bukan
kelalaian.

```bash
npm run test:prod -- --grep @smoke        # satu-satunya bentuk run prod yang benar
npx playwright test --grep-invert @dev-only   # yang portable ke staging
```

---

## 5. Credential Profile Strategy

Profile = **persona bisnis yang punya nama**, bukan pasangan email/password
yang kebetulan diketahui sebuah test.

| Role | Dipakai kapan |
|---|---|
| `admin` | akses penuh, moderation, user management |
| `student` | butuh state yang sudah ada (enrollment, progress) |
| `studentFresh` | butuh slate bersih — belum enroll apa pun |
| `instructor` | pemilik beberapa course |
| `instructorOther` | pemilik course berbeda — khusus test ownership/RBAC |

Resolusi per environment: development hardcoded (mirror seed Prisma
`course-platform`, aman di-commit karena cuma nunjuk DB lokal throwaway);
staging/production dari env var. `getCredential()` **melempar error** kalau
profile kosong — biar gagalnya jelas di titik login, bukan jadi "wrong
password" misterius tiga langkah kemudian.

```ts
await loginAs('instructorOther');       // via fixture
const { email } = getCredential('admin');  // baca langsung
```

### `storageState` caching

`config/global-setup.ts` login sekali per role (sebelum test apa pun jalan),
simpan session ke `.auth/<env>-<role>.json` (`config/storage-state.ts` yang
punya nama filenya, dipakai kedua sisi). Test yang cuma butuh "sudah login
sebagai X" sebagai precondition pakai `fixtures/storage.fixture.ts`:

```ts
import { test, expect } from '../../fixtures/storage.fixture';

test('a student opening the instructor area sees the forbidden page', async ({ authedPage }) => {
    const page = await authedPage('student');   // sudah login, tanpa UI
    await page.goto('/instructor');
    // ...
});
```

Catatan penting: file cache **wajib** di-namespace per environment (sudah
begitu — nama file literal berisi `ACTIVE_ENVIRONMENT`). Session staging
dipakai untuk run development = test lolos tapi tidak menguji apa pun; kalau
`TEST_ENV` beda, nama filenya otomatis beda (atau hilang → error `ENOENT`
yang jelas), jadi invalidation-nya otomatis lewat penamaan, bukan logic aktif
yang menghapus file lama.

**Kapan JANGAN pakai `authedPage`** — kalau proses login (atau redirect yang
dihasilkannya) itu sendiri yang sedang dibuktikan test, bukan cuma
precondition menuju perilaku lain:

- `tests/auth/*.spec.ts` — login itu SUT-nya.
- `tests/smoke/role-dashboards.spec.ts` — proof-of-chain env → credential →
  **login nyata** → dashboard; storageState akan melewati langkah yang justru
  mau dibuktikan.
- `tests/rbac/role-landing.spec.ts` — judulnya sendiri "lands on its own home
  **after signing in**".

Ketiganya tetap pakai `fixtures/roles.fixture.ts` (`loginAs`, UI beneran).
`tests/rbac/forbidden-areas.spec.ts` adalah contoh yang benar pakai
`authedPage` — login di situ cuma jalan masuk menuju pengecekan forbidden
page, bukan yang diuji.

---

## 6. Konvensi Penamaan

### 6.1 File spec

```
tests/<area>/<domain>.spec.ts        kebab-case, domain-focused

tests/student/video-progress.spec.ts     ✅
tests/student/testVideoProgress.spec.ts  ❌ camelCase
tests/student/test1.spec.ts              ❌ tidak deskriptif
tests/negative/quiz.spec.ts              ❌ folder by jenis test → pakai tag
```

### 6.2 Judul test — konvensi yang dipakai repo ini

**Deklaratif, aktor di depan, huruf kecil, tanpa titik.** Judul menjawab
"apa yang benar", bukan "apa yang dilakukan test".

```ts
test('a student lands on the student dashboard', ...)
test('signing in with the wrong password shows an error and stays put', ...)
test('an instructor cannot open another instructor\'s course editor', ...)
test('paying twice for the same order creates only one transaction', ...)
```

Aturannya:

- **Aktor dulu** kalau perilakunya beda per-role (`a student …`, `an admin …`)
- **Sertakan kondisi pembeda** — `with the wrong password`, `before enrolling`
- **Sebutkan hasil yang bisa diamati** — `shows an error`, `stays put`, bukan `works`
- **Satu kalimat, ≤ 12 kata**, tanpa nama testid/CSS/HTTP status
- **Jangan tulis "test"/"should"/"verify"** di awal — runner sudah bilang itu test
- **Judul + `describe` harus terbaca utuh**: `Sign in › signing in with the wrong password shows an error`

Anti-pattern:

```ts
test('test login', ...)                         ❌ tidak deskriptif
test('should work correctly', ...)              ❌ "work" bukan hasil
test('TC-014', ...)                             ❌ ID tanpa makna di report
test('click sign-in-submit then assert url', ...) ❌ langkah, bukan perilaku
test('quiz', ...)                               ❌ topik, bukan klaim
```

### 6.3 Konvensi alternatif (kalau tim pilih gaya lain)

Semua sah — yang tidak sah adalah **campur aduk dalam satu repo**. Pilih
satu, tulis di sini, konsisten.

| Gaya | Bentuk | Contoh | Cocok untuk |
|---|---|---|---|
| **Deklaratif** ⭐ | `<aktor> <perilaku>` | `a student cannot open a quiz before enrolling` | E2E, report dibaca non-developer |
| **Should** | `should <perilaku> when <kondisi>` | `should reject the quiz when the student is not enrolled` | tim dari unit testing; `describe` sebagai subjek |
| **It** | `it <verb>s <objek>` | `it prevents quiz access before enrollment` | gaya RSpec/Jest |
| **Given-When-Then** | `given <state>, when <aksi>, then <hasil>` | `given no enrollment, when opening a quiz, then access is denied` | acceptance test, tapi judul jadi panjang |
| **Sistem/spec** | `the system <perilaku>` | `the system auto-submits a quiz when the timer expires` | audit/compliance, terasa impersonal |
| **Problem-solution** | `<cegah/tangani> <masalah>` | `prevent a duplicate transaction on double submit` | edge case & regression bug |
| **ID-prefixed** | `[<ID>] <perilaku>` | `[QUIZ-07] a timed quiz auto-submits at zero` | wajib traceable ke Jira/TestRail |

Kalau pakai gaya **should**, taruh subjeknya di `describe` supaya tidak
menggantung:

```ts
test.describe('Quiz access', () => {
    test('should deny access when the student is not enrolled', ...);
    test('should allow access once enrolment exists', ...);
});
// terbaca: "Quiz access should deny access when the student is not enrolled"
```

Kalau butuh traceability ke test-management tool, **jangan** ganti judul jadi
ID — gabung keduanya lewat annotation supaya judul tetap terbaca:

```ts
test('a timed quiz auto-submits at zero', {
    annotation: { type: 'issue', description: 'QUIZ-07' },
}, async ({ page }) => { /* ... */ });
```

### 6.4 `describe` block

Kata benda, judul area/fitur, Title Case. Satu level saja — nesting lebih
dari dua bikin judul di report jadi panjang dan susah di-grep.

```ts
test.describe('Sign in', ...)              ✅
test.describe('Quiz access', ...)          ✅
test.describe('tests for sign in', ...)    ❌
```

### 6.5 Page object

```ts
class QuizPage extends BasePage          // PascalCase + suffix "Page"

private get startButton()                // locator: private get, nama elemen
private get quizResult()                 //   tanpa prefix "get"/"locator"

async startQuiz()                        // aksi user, bukan mekanika klik
async submitQuiz()
async getScore(): Promise<number>        // getter data → prefix get
async isMarkedComplete(): Promise<boolean>   // predikat → is/has/can
async waitForResult()                    // tunggu eksplisit → prefix wait
```

| Prefix | Untuk | Kembalikan |
|---|---|---|
| (verb langsung) | aksi user — `startQuiz`, `clickEnroll` | `void` |
| `get…` | ambil data yang terlihat user | nilai |
| `is…` / `has…` / `can…` | predikat | `boolean` |
| `waitFor…` | sinkronisasi eksplisit | `void` |
| `goto` | navigasi (override `BasePage`) | `void` |

Konstanta path & testid huruf besar di scope modul, bukan string literal
bertaburan:

```ts
const SIGN_IN_PATH = '/sign-in';
const DASHBOARD_PATH = '/admin';
```

### 6.6 Tagging

Tag ditulis lewat opsi `tag` (Playwright ≥ 1.42), bukan ditempel ke judul —
biar judul di report tetap bersih dan `--grep` tetap jalan.

```ts
test('a student lands on the student dashboard', { tag: ['@smoke', '@rbac'] }, ...);
test.describe('Checkout', { tag: '@mutating' }, () => { /* ... */ });
```

| Tag | Arti |
|---|---|
| `@smoke` | subset minimal, read-only, aman di semua environment (§4) |
| `@mutating` | menulis data — dev/staging saja |
| `@dev-only` | butuh seed data spesifik — dev saja |
| `@critical` | risk 🔴 (quiz, video progress, RBAC) |
| `@high` | risk 🟠 (certificate, enrollment, checkout) |
| `@rbac` | access control |
| `@negative` | negative & validasi |
| `@edge-case` | boundary, idempotency, race |

Script yang perlu ditambah ke `package.json`:

```json
"test:smoke":    "playwright test --grep @smoke",
"test:critical": "playwright test --grep @critical",
"test:rbac":     "playwright test --grep @rbac",
"test:portable": "playwright test --grep-invert @dev-only"
```

### 6.7 Struktur body test — AAA (Arrange, Act, Assert)

Setiap test body wajib dipecah jadi tiga bagian, ditandai komentar
`// Arrange`, `// Act`, `// Assert`, dipisah satu baris kosong. Tujuannya
supaya "apa yang disiapkan", "apa yang diuji", dan "apa yang dibuktikan"
langsung kelihatan tanpa baca ulang seluruh body.

```ts
test('signing in with a valid profile redirects off the sign-in page', async ({ page }) => {
    // Arrange
    const { email, password } = getCredential('student');
    const signIn = new SignInPage(page);

    // Act
    await signIn.loginAs(email, password);

    // Assert
    await expect(page).not.toHaveURL(/\/sign-in/);
});
```

Aturannya:

- **Arrange** — precondition: instansiasi page object, ambil credential/test
  data, navigasi ke state awal *kalau* navigasi itu bukan bagian dari yang
  sedang diuji. Tidak ada `expect()` di sini.
- **Act** — satu perilaku yang sedang diuji. Boleh lebih dari satu baris
  (`goto` + `fill` + `fill` + `click`) selama semuanya bagian dari satu aksi
  yang sama — tapi kalau satu blok Act mulai menguji dua perilaku sekaligus,
  itu tandanya test harus dipecah jadi dua (lihat §13, "satu test satu
  concern").
- **Assert** — hanya `expect()`/`expect.soft()`. Tidak ada aksi baru di sini.
- **Kasus login-sebagai-precondition vs login-sebagai-yang-diuji**: kalau
  judul test tentang login itu sendiri (`tests/auth/sign-in.spec.ts`), login
  masuk **Act**. Kalau login cuma jalan masuk menuju perilaku lain yang
  diuji (misal proof-of-chain di `tests/smoke/role-dashboards.spec.ts`, yang
  memang sengaja membuktikan login → dashboard sebagai satu rantai), login
  tetap masuk **Act** bersama langkah berikutnya — bukan Arrange — karena
  dia bagian dari apa yang dibuktikan test itu. Kalau login sudah lewat
  fixture (`loginAs`) dan bukan itu yang dibuktikan (RBAC di area lain,
  misalnya), boleh masuk **Arrange**.
- Kalau salah satu bagian kosong (jarang terjadi — biasanya Arrange), jangan
  tulis komentarnya tanpa isi. Komentar hanya muncul kalau ada baris di
  bawahnya.
- Tidak perlu komentar `// Arrange` dkk kalau test cuma satu baris total
  (langka di suite ini, karena hampir semua test butuh setup credential/page
  object minimal).

Anti-pattern:

```ts
// ❌ Arrange dan Act bercampur tanpa pemisah — sulit lihat mana setup, mana yang diuji
test('...', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.goto();
    const { email, password } = getCredential('student');
    await signIn.loginAs(email, password);
    await expect(page).not.toHaveURL(/\/sign-in/);
});

// ❌ assert nyempil di tengah Act
test('...', async ({ page }) => {
    // Act
    await signIn.loginAs(email, password);
    expect(page.url()).not.toContain('/sign-in');   // ini Assert, bukan Act
    await someOtherAction();
});
```

---

## 7. Konvensi Page Object

```ts
// pages/student/quiz.page.ts
import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const QUIZ_PATH = (courseSlug: string, lectureId: string) =>
    `/learn/${courseSlug}/${lectureId}`;

export class QuizPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get startButton() { return this.page.getByTestId('start-quiz-button'); }
    private get submitButton() { return this.page.getByTestId('submit-quiz-button'); }
    private get result()      { return this.page.getByTestId('quiz-result'); }

    async goto(courseSlug: string, lectureId: string) {
        await this.navigate(QUIZ_PATH(courseSlug, lectureId));
    }

    async startQuiz() {
        await this.startButton.click();
        await this.page.getByTestId('quiz-question').first().waitFor({ state: 'visible' });
    }

    async submitQuiz() {
        await this.submitButton.click();
        await this.waitForResult();   // Server Action → tunggu DOM, bukan XHR
    }

    async waitForResult() {
        await this.result.waitFor({ state: 'visible' });
    }

    async getScore(): Promise<number> {
        const text = (await this.result.textContent()) ?? '';
        return Number(text.match(/(\d+)\s*%/)?.[1] ?? NaN);
    }
}
```

Aturan keras:

- ❌ `page.locator('.css-class')` → **`getByTestId()` saja**
- ❌ locator `public` atau di-return ke spec → spec tidak boleh tahu testid
- ❌ `waitForTimeout` sebagai pengganti wait → kecuali debounce (§11)
- ❌ `expect()` di dalam page object → assertion tinggal di spec
- ✅ page object **tidak pernah** hardcode origin — selalu path relatif lewat `BasePage.navigate()`

`BasePage` sengaja menamai method-nya `navigate()`, bukan `goto()`: tiap page
object mengekspos `goto(...)`-nya sendiri dengan jumlah argumen yang beda-beda
(`goto()`, `goto(slug)`, `goto(courseId, lectureId)`). Kalau base-nya juga
bernama `goto`, yang dua argumen jadi override dengan signature tak kompatibel
dan ditolak TypeScript.

Poin terakhir itu yang bikin page object yang sama jalan di ketiga
environment tanpa perubahan.

---

## 8. Konvensi Fixture

Fixture untuk hal yang **berulang di banyak spec dan butuh setup/teardown**.
Helper biasa (fungsi murni) tidak perlu jadi fixture.

```ts
// fixtures/roles.fixture.ts    — sudah ada
loginAs(role)        // login page ini sebagai profile tertentu, via UI

// fixtures/storage.fixture.ts  — sudah ada (§5)
authedPage(role)     // page baru yang sudah login via storageState cache

// fixtures/student.fixture.ts   — sudah ada (§9.1)
newStudent()         // sign-up akun sekali-pakai di context sendiri → page
newStudentAccount()  // sama, plus email-nya (untuk test yang dicari admin)

// fixtures/instructor.fixture.ts — sudah ada (§9)
instructorPage       // authedPage('instructor')
scratch.create({ lessons, publish })  // course sekali-pakai lewat UI
scratch.track(course)                 // daftarkan course yang dibuat test sendiri

// rencana
cleanup(fn)          // generik; kebutuhan sekarang sudah ditutup `scratch`
```

`scratch` memegang daftar course **dan** teardown-nya dalam satu fixture karena
tiga spec (instructor ×2, admin) butuh logika yang sama. Cleanup lewat
`afterEach` spec juga valid — hook itu jalan *sebelum* fixture di-teardown, jadi
page-nya masih hidup — dan itulah yang dipakai `tests/student/review.spec.ts`
untuk satu spec saja, dengan satu variabel di level modul. Begitu logika itu
dibutuhkan lebih dari satu spec, pindahkan ke fixture supaya state-nya tetap
per-test, bukan variabel modul yang dipakai bersama.

Spec meng-import `test` dari fixture hanya kalau butuh; kalau tidak, cukup
`@playwright/test` biasa (lihat `tests/auth/sign-in.spec.ts` — dia justru
**tidak boleh** pakai `loginAs`, karena login itu yang sedang diuji).

---

## 9. Test Data & Isolation — DB Hanya untuk Cleanup

Keputusan arsitektural paling besar yang membedakan repo ini dari repo BDD:
**suite ini tidak menyiapkan state dan tidak meng-assert lewat database.** Tidak
ada Prisma, tidak ada `INSERT`/`UPDATE` untuk Arrange. Satu-satunya akses DB
adalah **menghapus data milik test setelah run selesai** (§9.2).

Alasannya bukan estetika — kalau suite ini boleh nulis ke DB, dia selamanya
terikat ke localhost dan tidak akan pernah bisa dipakai di staging, yang
justru jadi alasan repo ini ada. Konsekuensinya:

| Kebutuhan | Cara di repo BDD | Cara di sini |
|---|---|---|
| Setup enrollment | `enrollStudent()` via psql | enroll lewat UI, atau pakai profile yang memang sudah enrolled |
| Butuh state bersih | hapus row lalu jalan | pakai `studentFresh`, atau bikin data baru bernama unik |
| Cleanup | `DELETE` di After hook | undo lewat UI di `test.afterEach`, atau biarkan data bernama unik menumpuk |
| Course 100% selesai | `completeCourse()` | ❌ tidak feasible → test tinggal di repo BDD |

Pola yang dipakai sebagai gantinya:

1. **Unique-by-run naming.** Data yang dibikin test diberi suffix unik supaya
   dua run paralel (atau dua environment) tidak tabrakan:
   ```ts
   const courseTitle = `Automation Course ${Date.now()}-${test.info().workerIndex}`;
   ```
2. **Self-cleaning.** Yang dibikin test, dihapus test itu juga lewat UI di
   `afterEach` — dan `afterEach` tetap jalan meski test gagal.
3. **Read-only lebih disukai.** Untuk apa pun yang mau di-tag `@smoke`,
   pilih assertion yang tidak menulis sama sekali.
4. **Konstanta seed dipisah.** Slug/judul course hasil seed masuk
   `support/test-data.ts` dan hanya boleh dipakai test ber-tag `@dev-only`,
   karena tidak ada jaminan course itu ada di staging.

### 9.1 Identitas sekali-pakai — cleanup untuk state yang tidak bisa di-undo

Sebagian state **tidak punya tombol undo di UI sama sekali**. Enrollment
contohnya: sudah dikonfirmasi lewat grep menyeluruh di source SUT — tidak ada
fitur unenroll di sisi student, tidak ada juga di sisi admin (admin cuma bisa
ganti role user, tidak menyentuh tabel Enrollment). Repo BDD mengatasinya
dengan `DELETE FROM "Enrollment"` via psql — jalan yang sengaja tidak kita
punya.

Akibatnya, kalau test meng-enroll akun seed seperti `studentFresh`, akun itu
**permanen** kotor sampai SUT di-reseed manual: test jadi sekali-pakai, dan
semua test lain yang mengandalkan `studentFresh` sebagai clean-slate ikut
rusak.

Polanya, jadi: **jangan kotori fixture bersama — bikin identitas sendiri yang
sekali-pakai.**

```ts
// support/unique.ts
uniqueEmail()   // playwright-<timestamp>-<workerIndex>@example.com

// tests/student/enrollment.spec.ts
await signUp.signUpAs(THROWAWAY_NAME, uniqueEmail(), THROWAWAY_PASSWORD);
await courseDetail.clickCallToAction();   // "Enroll for Free"
```

Sign-up di SUT ini **auto-login tanpa verifikasi email**, jadi satu langkah
UI sudah menghasilkan student baru yang dijamin belum enroll apa pun. Akun
buangannya menumpuk di DB dev — itu konsekuensi yang memang sudah diterima
(§9 poin 1: "biarkan data bernama unik menumpuk"), dan jauh lebih murah
daripada kehilangan repeatability.

Aturan turunannya:

- Kalau sebuah test `@mutating` butuh aktor yang "bersih", **sign-up sendiri**
  — jangan pakai `studentFresh`.
- `studentFresh` dipakai hanya untuk skenario **read-only** yang butuh akun
  tanpa riwayat (mis. "non-enrolled student tidak bisa buka learn page").
- Kalau sebuah test butuh mengotori course seed tertentu, catat course itu di
  `support/test-data.ts` sebagai "dipakai test X", supaya test lain tidak
  ikut mengandalkannya (lihat catatan di `PAID_COURSE`).

---

### 9.2 Cleanup lewat DB — satu-satunya akses DB

Data yang tidak bisa di-undo lewat UI (akun, order, sertifikat) dulu dibiarkan
menumpuk. Setelah satu hari run: 264 akun, 66 order, 10 sertifikat, dan halaman
admin Users makin lambat. Karena itu ada satu pengecualian yang sempit:

```
config/database.ts        URL DB per environment
support/db.ts             cleanupTestData() — satu-satunya file yang membuka koneksi
config/global-teardown.ts memanggilnya sekali setelah seluruh run
```

| Environment | Perilaku |
|---|---|
| development | otomatis aktif → Postgres lokal `localhost:5434` |
| staging | aktif kalau `STAGING_DATABASE_URL` diisi; kosong = dilewati |
| production | **ditolak** — `getDatabaseUrl('production')` melempar error |

Aturannya:

- **Hanya `DELETE`**, hanya atas data milik test. Filter-nya sempit supaya baris
  seed tidak mungkin cocok: akun berformat `playwright-…@example.com` **dan**
  bernama "Playwright Student", serta course berjudul `Automation Course …`.
- **Tidak pernah dipakai untuk Arrange atau Assert.** Perilaku tetap dibuktikan
  lewat UI; kalau tidak, test itu hanya membuktikan DB, bukan aplikasi.
- Order dan sertifikat dihapus dulu (foreign key-nya tidak cascade dari User);
  enrolment, progress, quiz attempt, dan review ikut terhapus saat akun dihapus.
  Semuanya dalam satu transaksi: gagal berarti tidak ada yang berubah.
- Kegagalan cleanup hanya jadi peringatan, tidak membuat run merah.
- `DB_CLEANUP=off` untuk melewati. Jangan menjalankan dua run bersamaan ke DB
  yang sama: teardown satu run akan menyapu data run lainnya yang sedang jalan.
- Untuk staging, minta ke DevOps user DB yang hanya boleh `DELETE` di tabel
  `User`, `Transaction`, `Certificate`, dan `Course`.

Cleanup *per test* lewat UI (mis. scratch course, review di `review.spec.ts`)
tetap dipertahankan: itu yang menjaga test `@mutating` tetap bersih saat
dijalankan di staging tanpa akses DB.

## 10. Rencana Test Suite

Prioritas mengikuti risk matrix yang sama dengan repo BDD. Kolom **Tier**
menentukan environment mana yang boleh menjalankannya (§4).

### 10.1 Smoke — `tests/smoke/` 🔴

| Test | Tier | Status |
|---|---|---|
| a student lands on the student dashboard | `@smoke` | ✅ |
| a fresh student lands on the student dashboard | `@smoke` | ✅ |
| an instructor lands on the instructor dashboard | `@smoke` | ✅ |
| a second instructor profile also reaches the instructor dashboard | `@smoke` | ✅ |
| an admin lands on the admin dashboard | `@smoke` | ✅ |
| the course catalogue renders for an anonymous visitor | `@smoke` | ✅ |
| the landing page renders its primary call to action | `@smoke` | ✅ |
| a course detail page renders for an anonymous visitor | `@smoke` | ✅ |
| an unknown route renders the not-found page | `@smoke` | ✅ |

### 10.2 Auth — `tests/auth/` 🔴

| Test | Tier | Status |
|---|---|---|
| signing in with a valid profile redirects off the sign-in page | `@smoke` | ✅ |
| signing in with the wrong password shows an error and stays put | `@smoke` | ✅ |
| signing in with an unknown email shows an error | `@smoke` | ✅ |
| signing out returns the visitor to a public page | `@smoke` | ✅ |
| a signed-out visitor hitting a protected page is sent to sign-in | `@smoke` | ✅ |
| the sign-in page rejects an empty submission | `@smoke` | ✅ |
| signing up with a fresh email creates a student account | `@mutating` | ✅ |
| signing up with an existing email is rejected | `@mutating` | ✅ |

### 10.3 RBAC — `tests/rbac/` 🔴

Parametrized lewat `getAllCredentials()` — satu loop, satu test per profile.

| Test | Tier | Status |
|---|---|---|
| each role lands on its own home after signing in *(parametrized)* | `@smoke @rbac` | ✅ |
| a student opening the instructor area sees the forbidden page | `@smoke @rbac` | ✅ |
| a student opening the admin area sees the forbidden page | `@smoke @rbac` | ✅ |
| an instructor opening the admin area sees the forbidden page | `@smoke @rbac` | ✅ |
| an instructor cannot open another instructor's course editor | `@dev-only @rbac` | ✅ `tests/rbac/course-ownership.spec.ts` |
| an admin can open any instructor's course editor | `@dev-only @rbac` | ✅ |
| a signed-out visitor cannot reach the dashboard | `@smoke @rbac` | ✅ *(satu test dengan §10.2, lihat `tests/auth/session-guard.spec.ts`)* |

### 10.4 Student — `tests/student/` 🔴🟠

| Spec | Test | Tier | Status |
|---|---|---|---|
| `browse-courses` | the catalogue lists published courses | `@smoke` | ✅ |
| | filtering by category narrows the catalogue | `@smoke` | ✅ |
| | filtering by level narrows the catalogue | `@smoke` | ✅ |
| | filtering by free price shows only free courses | `@smoke` | ✅ |
| | filter state survives a page reload (deep link) | `@smoke` | ✅ |
| | searching by keyword returns a matching course | `@smoke` | ✅ |
| | a keyword that matches nothing shows the empty state | `@smoke` | ✅ |
| | draft courses never appear in the catalogue | `@dev-only` | ✅ |
| `course-detail` | a course page shows its curriculum | `@smoke` | ✅ |
| | an enrolled student sees continue, not enrol | `@dev-only` | ✅ |
| | a paid course offers checkout, not direct enrolment | `@dev-only` | ✅ |
| `enrollment` | a fresh student can enrol in a free course **and lands on its first lecture** | `@mutating` | ✅ |
| | ~~enrolling lands the student on the first lecture~~ | — | ✅ *(digabung ke test di atas — satu aksi, satu test; lihat §9.1)* |
| | a non-enrolled student cannot open the learn page | `@dev-only` | ✅ |
| `video-progress` | watching under the threshold leaves the lecture incomplete | `@dev-only` | ✅ |
| | watching past the threshold completes the lecture | `@dev-only` | ✅ |
| | lecture completion survives a reload | `@dev-only` | ✅ |
| | completing a lecture raises the course progress | `@dev-only` | ✅ |
| | resuming lands on the first unfinished lecture | `@dev-only` | ✅ |
| `quiz` | answering everything correctly passes the quiz | `@dev-only` | ✅ |
| | answering everything wrongly fails the quiz | `@dev-only` | ✅ |
| | passing a quiz completes its lecture | `@dev-only` | ✅ |
| | a failed quiz can be retried | `@dev-only` | ✅ |
| | a student cannot open a quiz before enrolling | `@dev-only` | ✅ |
| | a timed quiz submits itself when the clock runs out | `@dev-only @edge-case` | ✅ |
| `checkout` | paying with the success simulator enrols the student | `@dev-only` | ✅ |
| | the checkout page summarises the order before any payment is made *(tambahan)* | `@dev-only` | ✅ |
| | cancelling payment leaves the student unenrolled | `@dev-only` | ✅ |
| | an enrolled student cannot check out the same course again | `@dev-only` | ✅ |
| | a student cannot open another user's order | `@dev-only @rbac` | ✅ |
| | submitting payment twice creates only one transaction | `@dev-only @edge-case` | ✅ |
| | a pending payment can be resumed from purchase history | `@dev-only` | ✅ |
| `certificate` | a finished course offers its certificate | `@dev-only` | ✅ |
| | an unfinished course offers no certificate | `@dev-only` | ✅ |
| | a certificate number verifies on the public page | `@dev-only` | ✅ |
| | an unknown certificate number does not verify | `@smoke` | ✅ |
| | a malformed certificate number is rejected before any lookup *(tambahan)* | `@smoke @edge-case` | ✅ |
| `review` | an enrolled student can leave a review | `@mutating` | ✅ |
| | a review can be edited | `@mutating` | ✅ |
| | a review can be deleted | `@mutating` | ✅ |
| | a non-enrolled student sees no review form | `@dev-only` | ✅ |

### 10.5 Instructor — `tests/instructor/` 🟡

| Test | Tier | Status |
|---|---|---|
| an instructor can create a draft course | `@mutating` | ✅ |
| a course without lessons cannot be published | `@mutating` | ✅ |
| a course with at least one lesson can be published | `@mutating` | ✅ |
| a published course can be unpublished | `@mutating` | ✅ |
| a course with an enrolled student cannot be deleted | `@dev-only` | ✅ *(pakai course seed yang punya siswa legacy; ditolak sebelum ada yang berubah)* |
| an empty draft course can be deleted | `@mutating` | ✅ |
| deleting a course stays blocked until its title is typed back *(tambahan)* | `@mutating @edge-case` | ✅ |
| an instructor can add a video lesson | `@mutating` | ✅ |
| an instructor can add a quiz lesson | `@mutating` | ✅ |
| a lesson can be moved down and the order persists | `@mutating` | ✅ |
| the first lesson cannot be moved up | `@mutating @edge-case` | ✅ |
| a lesson can be deleted after confirmation | `@mutating` | ✅ |

### 10.6 Admin — `tests/admin/` 🟡

| Test | Tier | Status |
|---|---|---|
| an admin can list every course | `@smoke` | ✅ |
| an admin can archive a published course | `@mutating` | ✅ *(pada scratch course, bukan course seed)* |
| an admin can unarchive an archived course | `@mutating` | ✅ |
| an admin can list every user | `@smoke` | ✅ |
| an admin can promote a student to instructor | `@mutating` | ✅ |
| an admin cannot change their own role | `@smoke @negative` | ✅ *(read-only: hanya memeriksa dropdown disabled, jadi tier-nya `@smoke`, bukan `@mutating`)* |
| withdrawing a role takes effect without a re-login | `@mutating @rbac` | ✅ *(arah pencabutan saja — lihat §11 "Promosi role")* |

**Total: 86 test** (83 dari rencana + 3 tambahan). Jalankan
`npx playwright test --list --grep-invert @dev-only` untuk hitungan terkini yang
portable ke staging, dan `--grep @smoke` untuk yang aman di production.

---

## 11. Gotchas SUT

SUT-nya sama dengan repo BDD, jadi jebakannya identik. Ditulis ulang di sini
dalam bentuk Playwright murni supaya repo ini bisa dibaca berdiri sendiri.

### 403 = HTTP 200 + halaman forbidden

```ts
// ❌ expect(response.status()).toBe(403)
await expect(page.getByTestId('forbidden-page')).toBeVisible();
```

### Server Action tidak punya XHR untuk di-intercept

```ts
// ❌ await page.waitForResponse('/api/...')
await submitButton.click();
await page.getByTestId('quiz-result').waitFor({ state: 'visible' });
```

### Video progress — pakai dummy video, jangan hitung detik

```ts
await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video) video.currentTime = video.duration * 0.95;
});
await page.getByTestId('lecture-complete-check').waitFor({ state: 'visible' });
```

### Search debounce 300 ms

```ts
await searchInput.fill('next js');
await page.waitForTimeout(400);   // satu-satunya timeout yang dibolehkan
```

### Toast hilang sendiri — assert langsung setelah aksi

```ts
await submitButton.click();
await expect(page.getByTestId('success-toast')).toBeVisible();  // dulu
// baru assertion lain
```

### Quiz timer — geser clock, jangan menunggu beneran

```ts
await page.clock.install();
await quiz.startQuiz();
await page.clock.fastForward('10:00');
await quiz.waitForResult();
```

### Checkout simulator deterministik

```ts
await page.getByTestId('simulate-success-button').click();
await page.getByTestId('status-success').waitFor({ state: 'visible' });

await page.getByTestId('simulate-cancel-button').click();
await page.getByTestId('status-cancelled').waitFor({ state: 'visible' });
```

Status yang reachable cuma `PENDING → SUCCESS | CANCELLED`. Tidak ada
`FAILED`/`EXPIRED`/`REFUNDED` — jangan tulis test untuk state itu.

### Cover course = 3D generatif

Jangan pernah screenshot-compare cover course. Tidak stabil lintas run,
apalagi lintas browser engine.

---

### Promosi role tidak berlaku di sesi yang sedang terbuka

Role dibaca dari DB di sisi server (BUG-002), tapi middleware yang menjaga
`/instructor` dan `/admin` berjalan di edge dan hanya percaya role di JWT. Akibatnya:

- **Pencabutan** role berlaku di request berikutnya — itu yang dites.
- **Pemberian** role baru baru terlihat setelah user sign-in lagi. Siswa yang
  baru dipromosikan tetap dapat forbidden page di sesi lamanya.

Jangan tulis test "promosi langsung berlaku" — itu akan gagal di SUT yang
perilakunya sudah didokumentasikan. Kalau perilaku ini suatu hari diubah, test
yang perlu ditambah ada di `tests/admin/user-management.spec.ts`.

### Nomor sertifikat hanya ada di PDF

UI tidak pernah menampilkan nomornya; ia tercetak di PDF unduhan dan dibaca
repo BDD dari DB. Di sini `support/pdf.ts` membuka stream PDF dengan `zlib`
bawaan Node dan membaca teks heksadesimal font standar (Helvetica) — tanpa
dependency baru. Itu bukan parser PDF umum: kalau SUT pindah ke font yang
di-embed, fungsi ini mengembalikan string kosong dan satu test
(`a certificate number verifies on the public page`) gagal dengan pesan yang
jelas, bukan lolos diam-diam.

### Sidebar player adalah accordion — pindah lecture dengan load penuh

Hanya section yang aktif yang di-render di sidebar, dan accordion mempertahankan
state buka/tutup saat navigasi klien. Setelah pindah ke section berikutnya lewat
klik, entri sidebar lecture aktif tidak ada di DOM, jadi status selesai tidak
terbaca. `LecturePage.goToNextLecture()` karena itu membaca `href` tombol
"next" dan memuat halamannya penuh.

### Jangan bergantung pada metadata video

Test tidak mau tahu apakah engine bisa men-decode klip seed (`/sample-lecture.mp4`)
— itu urusan browser, bukan perilaku yang diuji. `LecturePage.watchFraction()`
karena itu tidak menunggu `loadedmetadata`: ia mengatur `currentTime`,
menembakkan `timeupdate`/`ended`, dan memakai panjang klip seed
(`SAMPLE_CLIP_SECONDS`) kalau `duration` tidak tersedia.

### Dialog menutup sebelum daftar di-refresh

Dialog tambah/hapus lesson menutup begitu Server Action selesai, sedangkan daftar
baru ter-refresh setelahnya. Membaca daftar atau langsung `goto` berikutnya
mengambil data basi atau bertabrakan dengan refresh yang masih jalan (gagal
sesekali di WebKit). Page object menunggu perubahan di DOM yang membuktikan
refresh selesai: lesson baru muncul, atau jumlah lesson berkurang.

### Arrange panjang butuh budget waktu sendiri

Tanpa DB (§9), "course dengan lesson yang sudah publish" atau "siswa yang sudah
membeli course" dibangun dengan menjalankan UI-nya. Firefox menghabiskan ±20 dari
30 detik default hanya untuk itu. `support/timeouts.ts` menyediakan budget yang
dipasang lewat `test.describe.configure({ timeout })`. Jangan menaikkan `retries`
sebagai gantinya (§13).

## 12. Build Prompts

### Prompt 1 — Tag & script foundation *(prasyarat semua fase berikutnya)*

```
Di repo course-platform-playwright:

1. Tambahkan tag ke 7 test yang sudah ada pakai opsi `tag` Playwright
   (bukan ditempel ke judul):
   - tests/smoke/role-dashboards.spec.ts  -> ['@smoke', '@rbac']
   - tests/auth/sign-in.spec.ts           -> ['@smoke']
   Hapus prefix '@smoke ' dari string describe di role-dashboards.spec.ts
   supaya tidak dobel.

2. Tambahkan script ke package.json:
   test:smoke, test:critical, test:rbac, test:portable
   (definisi persis ada di AUTOMATION_PLAN.md §6.6)

3. Buat support/test-data.ts berisi konstanta seed yang env-agnostic:
   slug course gratis, course berbayar, course dengan quiz, keyword search
   yang tidak match. Jangan taruh email/password di sini — itu milik
   config/credentials.ts.

Sebelum lapor selesai:
- npx playwright test --list --grep @smoke  => 7 test terdeteksi
- npm run type-check bersih
```

### Prompt 2 — Shared page object + RBAC

```
1. pages/shared/navbar.page.ts     — user menu, sign out, link per role
2. pages/shared/forbidden.page.ts  — testid 'forbidden-page', method isVisible()
3. pages/shared/not-found.page.ts

4. tests/rbac/role-landing.spec.ts
   Parametrized: loop getAllCredentials(), satu test per profile,
   judul `${profile.role} lands on its own home after signing in`.
   Map role -> expected path di satu konstanta di atas file.

5. tests/rbac/forbidden-areas.spec.ts
   Matrix role x area terlarang. Assert forbidden page, BUKAN status 403.

6. tests/auth/sign-out.spec.ts, tests/auth/session-guard.spec.ts

Semua test di sini read-only => tag @smoke @rbac, kecuali yang butuh
course seed spesifik (ownership) => @dev-only @rbac.

Sebelum lapor selesai: npm test dengan SUT jalan di :3002, semua hijau.
```

### Prompt 3 — Browse & catalogue (read-only, portable ke staging)

```
1. pages/student/courses.page.ts       — filter kategori/level/harga, search,
                                          empty state, list item
2. pages/student/course-detail.page.ts — curriculum, tombol enrol/continue/checkout

3. tests/student/browse-courses.spec.ts  (8 test, §10.4)
4. tests/smoke/public-pages.spec.ts      (4 test, §10.1)

Ingat: search debounce 300ms (§11). Filter test harus assert lewat jumlah
atau isi kartu yang terlihat, bukan lewat URL query saja.

Target: semua test di fase ini lolos `npm run test:portable`.
```

### Prompt 4 — storageState caching

```
Login per test sekarang ~2 detik. Ganti dengan storageState:

1. fixtures/storage.fixture.ts + globalSetup di playwright.config.ts
2. Simpan ke .auth/<environment>-<role>.json  <- WAJIB di-namespace per
   environment, kalau tidak session staging bisa kepakai di run development
   dan test lolos tanpa menguji apa pun.
3. .auth/ masuk .gitignore
4. tests/auth/*.spec.ts TIDAK boleh pakai fixture ini — login itu SUT-nya.
5. Invalidate cache kalau TEST_ENV berubah.

Sebelum lapor selesai: bandingkan durasi `npm run test:smoke` sebelum/sesudah.
```

### Prompt 5 — Mutating flow (enrollment, review, instructor, admin)

```
Semua test di fase ini menulis data. Aturan wajib (§9):
- Nama data unik per worker: `${judul} ${Date.now()}-${test.info().workerIndex}`
- Cleanup lewat UI di test.afterEach, jalan walau test gagal
- TIDAK ADA akses DB. Kalau sebuah test tidak bisa setup state-nya lewat UI,
  test itu milik repo course-platform-bdd — catat di plan, jangan dipaksakan.
- Tag @mutating (atau @dev-only kalau butuh seed spesifik)

Urutan: enrollment -> review -> instructor course lifecycle ->
lesson management -> admin moderation -> admin user management.
```

### Prompt 6 — Deep flow (video, quiz, checkout, certificate)

```
Fase paling rawan flaky. Baca §11 dulu sebelum nulis satu baris pun.
- Video: page.evaluate set currentTime, tunggu lecture-complete-check
- Quiz timer: page.clock.install() + fastForward, jangan menunggu real-time
- Checkout: hanya PENDING -> SUCCESS | CANCELLED
- Certificate: yang butuh course 100% selesai kemungkinan besar TIDAK bisa
  dikerjakan di sini tanpa DB. Cek dulu apakah bisa lewat UI dalam waktu
  wajar; kalau tidak, tandai tetap milik repo BDD di §10.4.
  *(Hasil: bisa. Course seed terkecil ditamatkan ±5 detik lewat UI, dan nomor
  sertifikat dibaca dari PDF — lihat §11. Semua test certificate hidup di sini.)*

Semua @dev-only.
```

### Prompt 7 — CI

```
.github/workflows/e2e.yml:
- job "development": spin up SUT + Postgres, npm test (semua tag)
- job "staging": TEST_ENV=staging, npm run test:portable, secrets dari GH
- job "production": TEST_ENV=production, npm run test:smoke, manual trigger
  saja (workflow_dispatch), jangan on:push
- Upload playwright-report sebagai artifact tiap job
- Matrix browser cuma di job development; staging/prod chromium saja
```

---

## 13. Anti-Pattern

### Spec file
- ❌ locator/testid muncul di spec — itu tugas page object
- ❌ satu test meng-assert banyak concern sekaligus — pecah
- ❌ test bergantung pada urutan eksekusi test lain
- ❌ judul test menyebut mekanika (`click`, `fill`, `waitFor`) — sebut perilaku
- ❌ `test.only` ketinggalan — `forbidOnly` sudah aktif di CI, tapi jangan di-push
- ❌ body test tanpa komentar `// Arrange` / `// Act` / `// Assert` (§6.7)
- ❌ `expect()` nyempil di blok Arrange/Act, atau aksi baru nyempil di blok Assert

### Page object
- ❌ `page.locator('.css')` → `getByTestId()` saja
- ❌ `expect()` di dalam page object → assertion milik spec
- ❌ hardcode origin/baseURL → selalu path relatif via `BasePage`
- ❌ method yang cuma `return locator` → bocorkan perilaku, bukan elemen

### Environment & credential
- ❌ email/password literal di spec → `getCredential(role)`
- ❌ test `@mutating` dijalankan di production
- ❌ `storageState` dipakai lintas environment (§5)
- ❌ `.env.staging` / `.env.production` ter-commit

### Isolation
- ❌ akses DB untuk Arrange/Assert, atau di luar `support/db.ts` (§9.2)
- ❌ data test bernama statis → tabrakan saat paralel
- ❌ cleanup di akhir body test → tidak jalan kalau test gagal; pakai `afterEach`
- ❌ `retries` dinaikkan untuk menutupi flaky → cari akar masalahnya

### Assertion
- ❌ assert HTTP 403 → `forbidden-page` testid
- ❌ `waitForResponse` untuk Server Action → tunggu perubahan DOM
- ❌ screenshot-compare cover course (3D generatif)
- ❌ `waitForTimeout` selain untuk debounce 300 ms

---

## 14. Roadmap

| Fase | Isi | Target |
|---|---|---|
| 0 ✅ | Config, credential, fixture, 7 proof-of-chain test | selesai |
| 1 ✅ | Tag + script + `test-data.ts` (Prompt 1) | fondasi tag |
| 2 ✅ | Shared page object + RBAC (Prompt 2) | 10 test baru (17 total) |
| 3 ✅ | Browse & catalogue read-only (Prompt 3) | 12 test baru (29 total), portable |
| 4 ✅ | `storageState` caching (Prompt 4) | runtime turun (§5) |
| 5 ✅ | Mutating flow (Prompt 5) | enrollment, review, instructor lifecycle + lesson, admin moderation + user |
| 6 ✅ | Deep flow (Prompt 6) | video, quiz (+ timer), checkout, certificate — 86 test total |
| 7 ⬜ | CI 3 environment (Prompt 7) | gate deploy |

Definisi selesai untuk repo ini **bukan** "semua behaviour ter-cover" — itu
tugas `course-platform-bdd`. Selesai = ada suite yang bisa ditodongkan ke
environment mana pun dan hasilnya bisa dipercaya sebagai gate rilis.

### Open items

Satu-satunya fase yang belum dikerjakan adalah **CI (fase 7)**. Dua hal di bawah
ini baru berpengaruh begitu suite diarahkan ke staging/production, jadi paling
masuk akal dikerjakan bersamaan dengan CI. Ditemukan waktu review PR #1.

**1. Test `@smoke` yang bergantung pada data seed**

Tier `@smoke` didefinisikan aman di production (§4), tapi sebagian test-nya
meng-assert konten seed yang tidak ada di katalog production:

- `tests/student/browse-courses.spec.ts` — judul course seed, kategori `design`, level `beginner`, kata kunci `Flutter`
- `tests/student/course-detail.spec.ts` — kurikulum `FREE_COURSE`
- `tests/smoke/public-pages.spec.ts` — `FREE_COURSE` sebagai halaman detail
- `tests/admin/course-moderation.spec.ts` — daftar admin memuat dua course seed dari dua instructor

Akibatnya `npm run test:prod` (hanya `@smoke`) gagal, atau lolos kebetulan, di
production. Pilihan perbaikan: (a) ganti tag jadi `@dev-only` untuk yang jelas
butuh seed, lalu (b) tulis smoke production yang tidak menyebut judul —
misalnya "katalog menampilkan setidaknya satu course", atau baca slug dari
`PRODUCTION_SMOKE_COURSE_SLUG` di `.env.production`. Komentar di
`support/test-data.ts` yang bilang staging "diasumsikan" sama dengan seed juga
perlu diperbarui.

**2. `global-setup` login semua 5 role di setiap run**

`config/global-setup.ts` memanggil `getAllCredentials()` dan login sebagai tiap
profile sebelum test apa pun jalan. Di staging/production, profile yang
env var-nya kosong (`fromEnv` menghasilkan email dan password kosong) membuat
`loginAs('', '')` tidak pernah keluar dari `/sign-in`, `waitForURL` timeout,
dan seluruh run gagal — termasuk test anonim (`public-pages`, `session-guard`)
yang tidak butuh kredensial. Satu run dengan `--grep` kecil pun tetap membayar 5
login berurutan, termasuk akun admin. Pilihan perbaikan: lewati profile tanpa
kredensial, atau buat sesi secara lazy di `authedPage` pada pemakaian pertama
per role (dan cache di `.auth/`), sehingga hanya role yang benar-benar dipakai
yang login.

**Catatan kecil**

- `tests/auth/sign-up.spec.ts` men-tag `signing up with an existing email is rejected` sebagai `@mutating`, padahal tidak membuat data apa pun. Kandidat `@smoke`, tapi mengirim form sign-up ke production dengan email nyata perlu keputusan sadar.
- `fixtures/instructor.fixture.ts` memutuskan "course sudah terhapus" dari `edit.isLoaded()` yang berupa `count()` langsung setelah `goto()`. Aman di run lokal (tidak ada scratch course tersisa), tapi lebih kokoh kalau menunggu salah satu dari halaman edit, not-found, atau forbidden sebelum memutuskan.

---

## 15. Hubungan ke Portfolio

| Project | SUT | Automation | Differentiator |
|---|---|---|---|
| Petpals | Next.js | Playwright (plain) | Foundation |
| CoursePlatform BDD | Next.js | Playwright BDD | Gherkin, 3 persona, state machine kompleks |
| **CoursePlatform POM (ini)** | **Next.js** | **Playwright POM** | **Multi-environment, credential profile, deployment gate** |
| CMS | Strapi | Selenium Java | Java, SUT not-owned |
| Admin Dashboard | Next.js | Katalon | Low-code, data-driven |
| Duitku | RN Expo | Maestro | Mobile, cross-platform |
| Wearway | Flutter | Appium Flutter | Flutter-native locator |

**Yang ditunjukkan repo ini yang tidak ditunjukkan repo BDD:**

- Satu suite, banyak environment — config berlapis, bukan salin-tempel config
- Kredensial sebagai **profile bisnis**, bukan konstanta yang tersebar
- Kesadaran bahwa test yang boleh jalan di production adalah **subset yang
  dipilih sadar**, bukan kebetulan
- Batasan arsitektural yang dipilih sengaja (tanpa DB) supaya suite-nya
  portable — dan kejujuran bahwa batasan itu memindahkan sebagian coverage ke
  repo sebelah
