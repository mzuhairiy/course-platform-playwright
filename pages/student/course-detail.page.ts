import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSE_DETAIL_PATH = (slug: string) => `/courses/${slug}`;

export class CourseDetailPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get pageRoot() {
        return this.page.getByTestId('course-detail');
    }

    private get callToAction() {
        return this.page.getByTestId('enroll-button');
    }

    private get curriculumSections() {
        return this.page.getByTestId('curriculum-section');
    }

    private get curriculumLectures() {
        return this.page.getByTestId('curriculum-lecture');
    }

    private get reviewForm() {
        return this.page.getByTestId('review-form');
    }

    private get reviewsSection() {
        return this.page.getByTestId('reviews-section');
    }

    private get reviewItems() {
        return this.page.getByTestId('review-item');
    }

    private get reviewComment() {
        return this.page.getByTestId('review-comment');
    }

    private get reviewSubmit() {
        return this.page.getByTestId('review-submit');
    }

    private get reviewDelete() {
        return this.page.getByTestId('review-delete');
    }

    private get reviewError() {
        return this.page.getByTestId('review-error');
    }

    private get ratingAverage() {
        return this.page.getByTestId('rating-average');
    }

    private ratingStar(stars: number) {
        return this.page.getByTestId(`star-${stars}`);
    }

    async goto(slug: string) {
        await this.navigate(COURSE_DETAIL_PATH(slug));
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.pageRoot.waitFor({ state: 'visible' });
    }

    async getCallToActionLabel(): Promise<string> {
        return (await this.callToAction.textContent())?.trim() ?? '';
    }

    /**
     * One button, four behaviors depending on session/enrolment/price:
     * "Sign in to enroll" and "Buy for …" navigate, "Enroll for Free" fires
     * a Server Action that redirects to the first lecture, and "Continue
     * Learning" jumps straight there. The caller decides what to wait for.
     */
    async clickCallToAction() {
        await this.callToAction.click();
    }

    async getCurriculumSectionCount(): Promise<number> {
        return this.curriculumSections.count();
    }

    async getCurriculumLectureCount(): Promise<number> {
        return this.curriculumLectures.count();
    }

    async isReviewsSectionShown(): Promise<boolean> {
        return this.reviewsSection.isVisible();
    }

    /** Only enrolled students are offered the review form. */
    async isReviewFormOffered(): Promise<boolean> {
        return (await this.reviewForm.count()) > 0;
    }

    /** The same form is reused for editing; the delete button is what says a review already exists. */
    async isReviewOfferedAsEdit(): Promise<boolean> {
        return (await this.reviewDelete.count()) > 0;
    }

    /**
     * Reviews are saved by a Server Action that refreshes the page, and the
     * toast that confirms it clears itself — so every review action waits on
     * the DOM the refresh produces (§11) instead of on the notification.
     */
    async submitReview(stars: number, comment: string) {
        await this.ratingStar(stars).click();
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
        await this.reviewDelete.waitFor({ state: 'visible' });
    }

    async submitReviewWithoutRating(comment: string) {
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
        await this.reviewError.waitFor({ state: 'visible' });
    }

    /** Resubmits the existing review; waits until the list shows the new comment. */
    async editReview(stars: number, comment: string) {
        await this.ratingStar(stars).click();
        await this.reviewComment.fill(comment);
        await this.reviewSubmit.click();
        await this.reviewItems.filter({ hasText: comment }).first().waitFor({ state: 'visible' });
    }

    async deleteReview() {
        await this.reviewDelete.click();
        await this.reviewDelete.waitFor({ state: 'detached' });
    }

    async isReviewShown(comment: string): Promise<boolean> {
        return (await this.reviewItems.filter({ hasText: comment }).count()) > 0;
    }

    async getReviewError(): Promise<string> {
        return (await this.reviewError.textContent())?.trim() ?? '';
    }

    async isRatingSummaryShown(): Promise<boolean> {
        return (await this.ratingAverage.count()) > 0;
    }
}
