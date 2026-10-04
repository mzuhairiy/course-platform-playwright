/**
 * Seed data that's identical in every environment (mirrors the Prisma seed
 * `course-platform` and `course-platform-bdd` both use), so it's safe to
 * reference by slug/title without touching the DB.
 *
 * Development's seed is assumed to also exist on staging, so most of these
 * are usable from @smoke tests. Use @dev-only only when a test needs a fact
 * that isn't just "this course exists" (e.g. DRAFT_COURSE below — a course
 * that must stay absent from the catalogue). Email/password profiles belong
 * to config/credentials.ts, not here (§9).
 */

/** Length of the one clip every seeded VIDEO lecture reuses (/sample-lecture.mp4). */
export const SAMPLE_CLIP_SECONDS = 10;

/** `id` and `firstLectureId` are only needed for /learn/{courseId}/{lectureId}. */
export const FREE_COURSE = {
    id: 'course_dataviz',
    slug: 'dasar-data-visualization',
    title: 'Dasar Data Visualization',
    firstLectureId: 'lec_dasar-data-visualization_0_0',
    secondLectureId: 'lec_dasar-data-visualization_0_1',
};

/**
 * Also doubles as "a course no *seed* account ever enrols in" — the
 * non-enrolled negative tests (run as `studentFresh`) rely on that. Checkout
 * tests do buy it, but only ever as a throwaway sign-up (§9.1), so no seed
 * account's state changes. Never buy it as a seed profile.
 */
export const PAID_COURSE = {
    id: 'course_digital_marketing',
    slug: 'digital-marketing-umkm',
    title: 'Digital Marketing untuk UMKM',
    price: 179000,
    firstLectureId: 'lec_digital-marketing-umkm_0_0',
};

/**
 * Free, untimed 5-question quiz — a throwaway student can enrol in it
 * without a checkout. Also the seed's "legacy" enrolment for the `student`
 * profile (see ENROLLED_SEED_COURSE), so read-only "already enrolled" checks
 * can use it without any setup.
 */
export const QUIZ_COURSE = {
    id: 'course_nextjs_pemula',
    slug: 'next-js-14-untuk-pemula',
    title: 'Next.js 14 untuk Pemula',
    quizId: 'quiz_next-js-14-untuk-pemula',
    quizLectureId: 'lec_next-js-14-untuk-pemula_3_quiz',
};

/**
 * The seed's one quiz with a real time limit (120 s). Paid, so a throwaway
 * student has to buy it through the checkout simulator before they can open
 * the quiz.
 */
export const TIMED_QUIZ_COURSE = {
    id: 'course_api_testing',
    slug: 'api-testing-postman',
    title: 'Belajar API Testing dengan Postman dari Nol',
    price: 249000,
    quizId: 'quiz_api-testing-postman',
    quizLectureId: 'lec_api-testing-postman_2_quiz',
    timeLimitSeconds: 120,
};

/**
 * `student` is enrolled here by the seed (a "legacy" enrolment) — the only
 * course a read-only test may rely on as "already owned".
 */
export const ENROLLED_SEED_COURSE = {
    id: 'course_nextjs_pemula',
    slug: 'next-js-14-untuk-pemula',
};

/**
 * Free course with the smallest curriculum in the seed (3 sections: 8 video
 * lectures, 1 reading, 1 quiz) — the cheapest course to finish end-to-end
 * through the UI, which the certificate tests have to do (§9: no DB access to
 * fast-forward progress).
 */
export const CERTIFICATE_COURSE = {
    id: 'course_vibe_coding',
    slug: 'vibe-coding-produktif-dengan-ai',
    title: 'Vibe Coding: Produktif dengan AI Coding Tools',
    quizId: 'quiz_vibe-coding-produktif-dengan-ai',
    firstLectureId: 'lec_vibe-coding-produktif-dengan-ai_0_0',
};

/** Free course with seed reviews — review tests add and remove their own. */
export const REVIEW_COURSE = {
    id: 'course_ml_fundamentals',
    slug: 'machine-learning-fundamentals',
    title: 'Machine Learning Fundamentals',
};

/** `instructor` owns this seed course; `instructorOther` does not. */
export const INSTRUCTOR_OWNED_COURSE = {
    id: 'course_nextjs_pemula',
    slug: 'next-js-14-untuk-pemula',
    title: 'Next.js 14 untuk Pemula',
};

/**
 * Seed quizzes are generated deterministically: 5 questions, option ids shaped
 * `<quizId>_q<n>_<a|b|c|d|true|false>`. Q2 is the multi-answer question
 * (a + b correct); Q3 and Q5 are true/false.
 */
export function quizAnswers(quizId: string) {
    const option = (question: number, choice: string) => `${quizId}_q${question}_${choice}`;
    return {
        allCorrect: [
            option(1, 'a'),
            option(2, 'a'),
            option(2, 'b'),
            option(3, 'true'),
            option(4, 'a'),
            option(5, 'false'),
        ],
        allWrong: [
            option(1, 'b'),
            option(2, 'c'),
            option(3, 'false'),
            option(4, 'b'),
            option(5, 'true'),
        ],
        /** First two questions only — the other three stay blank (2 of 5 right = 40%). */
        firstTwoCorrect: [option(1, 'a'), option(2, 'a'), option(2, 'b')],
    };
}

/** Matches exactly one course by title — for single-result search tests. */
export const SEARCHABLE_COURSE = {
    slug: 'flutter-aplikasi-mobile-pertama',
    title: 'Flutter: Bangun Aplikasi Mobile Pertamamu',
    keyword: 'Flutter',
};

/** The only DRAFT-status course in the seed — must never appear publicly. */
export const DRAFT_COURSE = {
    slug: 'design-system-dari-nol',
    title: 'Design System dari Nol',
};

/** Guaranteed to match nothing in the catalogue — for empty-state tests. */
export const UNMATCHED_SEARCH_KEYWORD = 'zzzznothing';

/** Well-formed (`CERT-YYYY-XXXXX`) but never issued — verifies as "not found". */
export const UNKNOWN_CERTIFICATE_NUMBER = 'CERT-2026-ZZZZZ';

/** Does not match the `CERT-YYYY-XXXXX` shape — rejected before any lookup. */
export const MALFORMED_CERTIFICATE_NUMBER = 'not-a-real-format';

/** Details every scratch course (created by an instructor test) is submitted with. */
export const SCRATCH_COURSE = {
    category: 'Programming',
    description:
        'Scratch course created by the automated Playwright suite. Safe to delete at any time.',
};

/** A lesson body/video the lesson manager accepts. The clip is the same one the seed uses. */
export const SCRATCH_LESSON = {
    readingBody: 'Scratch reading lesson created by the automated Playwright suite.',
    videoUrl: '/sample-lecture.mp4',
    videoDurationSeconds: 10,
};

/** Seed courses owned by two different instructors — the admin list must show both. */
export const COURSE_OF_INSTRUCTOR = { title: 'Next.js 14 untuk Pemula' };
export const COURSE_OF_OTHER_INSTRUCTOR = { title: 'UI Design Fundamentals: dari Wireframe ke High-Fidelity' };
