import { test, expect } from '../../fixtures/student.fixture';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { CheckoutPage } from '../../pages/student/checkout.page';
import { CheckoutStatusPage } from '../../pages/student/checkout-status.page';
import { LecturePage } from '../../pages/student/lecture.page';
import { PurchaseHistoryPage } from '../../pages/student/purchase-history.page';
import { NotFoundPage } from '../../pages/shared/not-found.page';
import { buyCourse, startPayment } from '../../support/flows';
import { PAID_COURSE } from '../../support/test-data';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

/**
 * Every test signs up its own student (`newStudent`) rather than using a seed
 * profile: a paid order can't be undone from the UI, so buying as `student` or
 * `studentFresh` would permanently change an account other tests rely on (§9.1).
 */
test.describe('Checkout', { tag: '@dev-only' }, () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('paying with the success simulator enrols the student', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const courseDetail = new CourseDetailPage(page);
        const checkout = new CheckoutPage(page);
        const status = new CheckoutStatusPage(page);
        const lecture = new LecturePage(page);

        // Act
        await courseDetail.goto(PAID_COURSE.slug);
        await courseDetail.clickCallToAction();
        await checkout.waitForLoad();
        await checkout.selectPaymentMethod('bank_transfer');
        await checkout.payNow();
        await status.waitForLoad();
        await status.simulateSuccess();
        await status.startLearning();
        await lecture.waitForLoad();

        // Assert
        await expect(page).toHaveURL(`/learn/${PAID_COURSE.id}/${PAID_COURSE.firstLectureId}`);
    });

    test('the checkout page summarises the order before any payment is made', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const courseDetail = new CourseDetailPage(page);
        const checkout = new CheckoutPage(page);

        // Act
        await courseDetail.goto(PAID_COURSE.slug);
        await courseDetail.clickCallToAction();
        await checkout.waitForLoad();

        // Assert
        expect(await checkout.getOrderTitle()).toBe(PAID_COURSE.title);
        expect(await checkout.getOrderTotal()).toBe(PAID_COURSE.price);
    });

    test('cancelling payment leaves the student unenrolled', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const status = new CheckoutStatusPage(page);
        const lecture = new LecturePage(page);
        await startPayment(page, PAID_COURSE.slug);

        // Act
        await status.simulateCancel();
        await lecture.goto(PAID_COURSE.id, PAID_COURSE.firstLectureId);

        // Assert
        await expect(page).toHaveURL(`/courses/${PAID_COURSE.slug}`);
        expect(await lecture.isLoaded()).toBe(false);
    });

    test('an enrolled student cannot check out the same course again', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const checkout = new CheckoutPage(page);
        await buyCourse(page, PAID_COURSE.slug);

        // Act
        await checkout.goto(PAID_COURSE.id);

        // Assert
        await expect(page).toHaveURL(`/courses/${PAID_COURSE.slug}`);
        expect(await checkout.isLoaded()).toBe(false);
    });

    test('a student cannot open another user\'s order', { tag: '@rbac' }, async ({ newStudent }) => {
        // Arrange
        const owner = await newStudent();
        const intruder = await newStudent();
        const orderId = await startPayment(owner, PAID_COURSE.slug);
        const notFound = new NotFoundPage(intruder);

        // Act
        await new CheckoutStatusPage(intruder).goto(orderId);

        // Assert
        expect(await notFound.isVisible()).toBe(true);
    });

    test('submitting payment twice creates only one transaction', { tag: '@edge-case' }, async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const checkout = new CheckoutPage(page);
        const history = new PurchaseHistoryPage(page);
        await startPayment(page, PAID_COURSE.slug);

        // Act
        await checkout.goto(PAID_COURSE.id);
        await checkout.waitForLoad();
        await checkout.payNow();
        await history.goto();

        // Assert
        expect(await history.getTransactionCount()).toBe(1);
    });

    test('a pending payment can be resumed from purchase history', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const history = new PurchaseHistoryPage(page);
        const status = new CheckoutStatusPage(page);
        await startPayment(page, PAID_COURSE.slug);

        // Act
        await history.goto();
        await history.continuePayment();
        await status.waitForLoad();

        // Assert
        expect(await status.isPending()).toBe(true);
    });
});
