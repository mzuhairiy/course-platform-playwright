import { test, expect } from '../../fixtures/student.fixture';
import { VerifyPage } from '../../pages/marketing/verify.page';
import { CertificatePage } from '../../pages/student/certificate.page';
import { CourseDetailPage } from '../../pages/student/course-detail.page';
import { completeCourse, enrollInFreeCourse } from '../../support/flows';
import { extractCertificateNumber } from '../../support/pdf';
import {
    CERTIFICATE_COURSE,
    MALFORMED_CERTIFICATE_NUMBER,
    UNKNOWN_CERTIFICATE_NUMBER,
} from '../../support/test-data';
import { FINISH_COURSE_TEST_TIMEOUT_MS } from '../../support/timeouts';
import { THROWAWAY_NAME } from '../../support/unique';

test.describe('Certificate', () => {
    test('a finished course offers its certificate', { tag: '@dev-only' }, async ({ newStudent }) => {
        // Arrange
        test.setTimeout(FINISH_COURSE_TEST_TIMEOUT_MS);
        const page = await newStudent();
        const courseDetail = new CourseDetailPage(page);
        const certificate = new CertificatePage(page);
        await enrollInFreeCourse(page, CERTIFICATE_COURSE.slug);
        await completeCourse(page, CERTIFICATE_COURSE);

        // Act
        await courseDetail.goto(CERTIFICATE_COURSE.slug);
        await certificate.waitForLoad();

        // Assert
        expect(await certificate.isCompletionCelebrated()).toBe(true);
        expect(await certificate.isOffered()).toBe(true);
    });

    test('an unfinished course offers no certificate', { tag: '@dev-only' }, async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const courseDetail = new CourseDetailPage(page);
        const certificate = new CertificatePage(page);
        await enrollInFreeCourse(page, CERTIFICATE_COURSE.slug);

        // Act
        await courseDetail.goto(CERTIFICATE_COURSE.slug);
        await certificate.waitForLoad();

        // Assert
        expect(await certificate.isLocked()).toBe(true);
        expect(await certificate.isOffered()).toBe(false);
    });

    test('a certificate number verifies on the public page', { tag: '@dev-only' }, async ({ newStudent, page: visitor }, testInfo) => {
        // Arrange
        test.setTimeout(FINISH_COURSE_TEST_TIMEOUT_MS);
        const student = await newStudent();
        const certificate = new CertificatePage(student);
        const verify = new VerifyPage(visitor);
        await enrollInFreeCourse(student, CERTIFICATE_COURSE.slug);
        await completeCourse(student, CERTIFICATE_COURSE);
        await new CourseDetailPage(student).goto(CERTIFICATE_COURSE.slug);
        await certificate.waitForLoad();
        const pdfPath = testInfo.outputPath('certificate.pdf');
        await (await certificate.download()).saveAs(pdfPath);
        const certificateNumber = extractCertificateNumber(pdfPath);
        expect(certificateNumber, 'the downloaded PDF should print a certificate number').not.toBeNull();

        // Act — the anonymous `visitor` page has no session: verification is public.
        await verify.goto();
        await verify.verify(certificateNumber!);

        // Assert
        expect(await verify.isValid()).toBe(true);
        expect(await verify.getStudentName()).toBe(THROWAWAY_NAME);
        expect(await verify.getCourseName()).toBe(CERTIFICATE_COURSE.title);
    });

    test('an unknown certificate number does not verify', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const verify = new VerifyPage(page);
        await verify.goto();

        // Act
        await verify.verify(UNKNOWN_CERTIFICATE_NUMBER);

        // Assert
        expect(await verify.isNotFound()).toBe(true);
        expect(await verify.isValid()).toBe(false);
    });

    test('a malformed certificate number is rejected before any lookup', { tag: ['@smoke', '@edge-case'] }, async ({ page }) => {
        // Arrange
        const verify = new VerifyPage(page);
        await verify.goto();

        // Act
        await verify.verify(MALFORMED_CERTIFICATE_NUMBER);

        // Assert
        expect(await verify.isFormatRejected()).toBe(true);
        expect(await verify.isNotFound()).toBe(false);
    });
});
