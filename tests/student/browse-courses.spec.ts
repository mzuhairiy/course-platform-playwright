import { test, expect } from '@playwright/test';
import { CoursesPage } from '../../pages/student/courses.page';
import {
    FREE_COURSE,
    SEARCHABLE_COURSE,
    DRAFT_COURSE,
    UNMATCHED_SEARCH_KEYWORD,
} from '../../support/test-data';

const CATEGORY = 'design';
const LEVEL = 'beginner';

test.describe('Browse courses', () => {
    test('the catalogue lists published courses', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.goto();

        // Assert
        expect(await courses.isCourseOffered(FREE_COURSE.title)).toBe(true);
    });

    test('filtering by category narrows the catalogue', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);
        await courses.goto();
        const totalCount = await courses.getResultCount();

        // Act
        await courses.applyFilter('category', CATEGORY);

        // Assert
        const filteredCount = await courses.getResultCount();
        expect(filteredCount).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThan(totalCount);
    });

    test('filtering by level narrows the catalogue', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);
        await courses.goto();
        const totalCount = await courses.getResultCount();

        // Act
        await courses.applyFilter('level', LEVEL);

        // Assert
        const filteredCount = await courses.getResultCount();
        expect(filteredCount).toBeGreaterThan(0);
        expect(filteredCount).toBeLessThan(totalCount);
    });

    test('filtering by free price shows only free courses', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.goto();
        await courses.applyFilter('price', 'free');

        // Assert
        expect(await courses.getVisibleCourseCount()).toBeGreaterThan(0);
        expect(await courses.areAllVisibleCoursesFree()).toBe(true);
    });

    test('filter state survives a page reload (deep link)', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);
        await courses.goto();

        // Act
        await courses.applyFilter('price', 'free');
        await courses.reload();

        // Assert
        expect(await courses.isFilterChecked('price', 'free')).toBe(true);
        expect(await courses.areAllVisibleCoursesFree()).toBe(true);
    });

    test('searching by keyword returns a matching course', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.search(SEARCHABLE_COURSE.keyword);

        // Assert
        expect(await courses.isCourseOffered(SEARCHABLE_COURSE.title)).toBe(true);
    });

    test('a keyword that matches nothing shows the empty state', { tag: '@smoke' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.search(UNMATCHED_SEARCH_KEYWORD);

        // Assert
        expect(await courses.isEmptyStateShown()).toBe(true);
    });

    test('draft courses never appear in the catalogue', { tag: '@dev-only' }, async ({ page }) => {
        // Arrange
        const courses = new CoursesPage(page);

        // Act
        await courses.search(DRAFT_COURSE.title);

        // Assert
        expect(await courses.isCourseOffered(DRAFT_COURSE.title)).toBe(false);
    });
});
