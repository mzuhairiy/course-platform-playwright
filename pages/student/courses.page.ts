import { Page } from '@playwright/test';
import { BasePage } from '../base.page';

const COURSES_PATH = '/courses';

/**
 * The catalogue has no search box of its own — search is a global navbar
 * feature that lands here via `?q=`. Filters (category/level/price) are
 * URL-backed and commit on click with no debounce; the 300ms debounce
 * (§11) belongs to the navbar's live-search input, not this page.
 */
export class CoursesPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    private get results() {
        return this.page.getByTestId('course-results');
    }

    private get resultCount() {
        return this.page.getByTestId('course-count');
    }

    private get cards() {
        return this.page.getByTestId('course-card');
    }

    private get emptyState() {
        return this.page.getByTestId('course-empty');
    }

    private filterControl(criterion: string, value: string) {
        return this.page.getByTestId(`filter-${criterion}-${value.toLowerCase()}`);
    }

    async goto() {
        await this.navigate(COURSES_PATH);
        await this.waitForLoad();
    }

    async waitForLoad() {
        await this.results.waitFor({ state: 'visible' });
    }

    async search(term: string) {
        await this.navigate(`${COURSES_PATH}?q=${encodeURIComponent(term)}`);
        await this.waitForLoad();
    }

    async applyFilter(criterion: string, value: string) {
        await this.filterControl(criterion, value).click();
        await this.page.waitForURL(
            (url) => url.searchParams.get(criterion)?.toLowerCase() === value.toLowerCase(),
        );
        await this.waitForLoad();
    }

    async isFilterChecked(criterion: string, value: string): Promise<boolean> {
        return this.filterControl(criterion, value).isChecked();
    }

    async reload() {
        await this.page.reload();
        await this.waitForLoad();
    }

    async getResultCount(): Promise<number> {
        const text = (await this.resultCount.textContent()) ?? '';
        return Number(text.replace(/[^\d]/g, ''));
    }

    async getVisibleCourseCount(): Promise<number> {
        return this.cards.count();
    }

    async isCourseOffered(title: string): Promise<boolean> {
        return (await this.cards.filter({ hasText: title }).count()) > 0;
    }

    async isEmptyStateShown(): Promise<boolean> {
        return (await this.emptyState.count()) > 0;
    }

    async areAllVisibleCoursesFree(): Promise<boolean> {
        const count = await this.cards.count();
        if (count === 0) return false;

        for (let i = 0; i < count; i++) {
            const price = (await this.cards.nth(i).getByTestId('course-price').textContent())?.trim();
            if (price !== 'Free') return false;
        }
        return true;
    }
}
