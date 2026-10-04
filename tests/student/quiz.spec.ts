import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/student.fixture';
import { LecturePage } from '../../pages/student/lecture.page';
import { QuizPage } from '../../pages/student/quiz.page';
import { buyCourse, enrollInFreeCourse } from '../../support/flows';
import { QUIZ_COURSE, TIMED_QUIZ_COURSE, quizAnswers } from '../../support/test-data';
import { LONG_SETUP_TEST_TIMEOUT_MS } from '../../support/timeouts';

const answers = quizAnswers(QUIZ_COURSE.quizId);

/**
 * Signs up a fresh student, enrols them in the free quiz course and starts
 * the quiz. Quiz attempts and lecture completion can't be undone from the UI,
 * so every test brings its own throwaway student (§9.1) instead of dirtying a
 * seed account's quiz history.
 */
async function startQuizAsNewStudent(page: Page) {
    const lecture = new LecturePage(page);
    const quiz = new QuizPage(page);
    await enrollInFreeCourse(page, QUIZ_COURSE.slug);
    await lecture.open(QUIZ_COURSE.id, QUIZ_COURSE.quizLectureId);
    await quiz.waitForIntro();
    await quiz.start();
}

test.describe('Quiz', { tag: '@dev-only' }, () => {
    test.describe.configure({ timeout: LONG_SETUP_TEST_TIMEOUT_MS });

    test('answering everything correctly passes the quiz', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const quiz = new QuizPage(page);
        await startQuizAsNewStudent(page);

        // Act
        await quiz.selectAnswers(answers.allCorrect);
        await quiz.submit();

        // Assert
        expect(await quiz.getScorePercentage()).toBe(100);
        expect(await quiz.hasPassed()).toBe(true);
    });

    test('answering everything wrongly fails the quiz', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const quiz = new QuizPage(page);
        await startQuizAsNewStudent(page);

        // Act
        await quiz.selectAnswers(answers.allWrong);
        await quiz.submit();

        // Assert
        expect(await quiz.getScorePercentage()).toBe(0);
        expect(await quiz.hasPassed()).toBe(false);
    });

    test('passing a quiz completes its lecture', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const quiz = new QuizPage(page);
        const lecture = new LecturePage(page);
        await startQuizAsNewStudent(page);

        // Act
        await quiz.selectAnswers(answers.allCorrect);
        await quiz.submit();
        await lecture.waitForComplete();

        // Assert
        expect(await lecture.isMarkedComplete()).toBe(true);
    });

    test('a failed quiz can be retried', async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const quiz = new QuizPage(page);
        await startQuizAsNewStudent(page);
        await quiz.selectAnswers(answers.allWrong);
        await quiz.submit();

        // Act
        await quiz.retry();
        await quiz.selectAnswers(answers.allCorrect);
        await quiz.submit();

        // Assert
        expect(await quiz.hasPassed()).toBe(true);
    });

    test('a student cannot open a quiz before enrolling', { tag: '@rbac' }, async ({ authedPage }) => {
        // Arrange
        const page = await authedPage('studentFresh');
        const lecture = new LecturePage(page);

        // Act
        await lecture.goto(QUIZ_COURSE.id, QUIZ_COURSE.quizLectureId);

        // Assert
        await expect(page).toHaveURL(`/courses/${QUIZ_COURSE.slug}`);
        expect(await lecture.isLoaded()).toBe(false);
    });

    test('a timed quiz submits itself when the clock runs out', { tag: '@edge-case' }, async ({ newStudent }) => {
        // Arrange
        const page = await newStudent();
        const lecture = new LecturePage(page);
        const quiz = new QuizPage(page);
        await buyCourse(page, TIMED_QUIZ_COURSE.slug);
        // Installed only now so the purchase above runs on real time. Time
        // keeps flowing; the jump below is what makes the quiz run out (§11).
        await page.clock.install();
        await lecture.open(TIMED_QUIZ_COURSE.id, TIMED_QUIZ_COURSE.quizLectureId);
        await quiz.waitForIntro();
        await quiz.start();
        await quiz.selectAnswers(quizAnswers(TIMED_QUIZ_COURSE.quizId).firstTwoCorrect);

        // Act
        await page.clock.fastForward((TIMED_QUIZ_COURSE.timeLimitSeconds + 30) * 1000);
        await quiz.waitForResult();

        // Assert
        expect(await quiz.getScorePercentage()).toBe(40);
    });
});
