import { Page } from '@playwright/test';
import { CourseDetailPage } from '../pages/student/course-detail.page';
import { CheckoutPage } from '../pages/student/checkout.page';
import { CheckoutStatusPage } from '../pages/student/checkout-status.page';
import { LecturePage } from '../pages/student/lecture.page';
import { QuizPage } from '../pages/student/quiz.page';
import { quizAnswers, SAMPLE_CLIP_SECONDS } from './test-data';

/**
 * Multi-page UI flows that put a throwaway student into a known state.
 *
 * This suite has no DB access (§9), so "enrolled", "has a pending order" and
 * "finished the course" all have to be reached by driving the real UI. They
 * live here — not inline in each spec — because they are Arrange steps shared
 * by many tests, not the behaviour any of those tests is about. A spec that
 * *is* about one of these flows (enrollment, checkout) drives the page
 * objects directly instead.
 */

/** Enrols in a free course and waits for the first lecture to render. */
export async function enrollInFreeCourse(page: Page, slug: string) {
    const courseDetail = new CourseDetailPage(page);
    await courseDetail.goto(slug);
    await courseDetail.clickCallToAction();
    await new LecturePage(page).waitForLoad();
}

/** Opens checkout for a paid course and records a PENDING order. Returns the order id. */
export async function startPayment(page: Page, slug: string): Promise<string> {
    const courseDetail = new CourseDetailPage(page);
    const checkout = new CheckoutPage(page);
    const status = new CheckoutStatusPage(page);

    await courseDetail.goto(slug);
    await courseDetail.clickCallToAction();
    await checkout.waitForLoad();
    await checkout.payNow();
    await status.waitForLoad();
    return status.getOrderId();
}

/** Buys a paid course through the payment simulator. Returns the order id. */
export async function buyCourse(page: Page, slug: string): Promise<string> {
    const orderId = await startPayment(page, slug);
    await new CheckoutStatusPage(page).simulateSuccess();
    return orderId;
}

/**
 * Completes every lecture of an already-enrolled course, front to back:
 * seeks each video to its end, ticks each reading, and passes the quiz.
 * Walks the lectures with the player's own "next" button (the sidebar is an
 * accordion that only renders the open section).
 */
export async function completeCourse(
    page: Page,
    course: { id: string; quizId: string; firstLectureId: string },
) {
    const lecture = new LecturePage(page);
    const quiz = new QuizPage(page);

    await lecture.open(course.id, course.firstLectureId);

    for (;;) {
        const kind = await lecture.getKind();
        if (kind === 'video') {
            await lecture.watchFraction(1, SAMPLE_CLIP_SECONDS);
            await lecture.waitForComplete();
        } else if (kind === 'reading') {
            await lecture.markReadingComplete();
        } else {
            await quiz.start();
            await quiz.selectAnswers(quizAnswers(course.quizId).allCorrect);
            await quiz.submit();
            await lecture.waitForComplete();
        }

        if (!(await lecture.hasNextLecture())) return;
        await lecture.goToNextLecture();
    }
}
