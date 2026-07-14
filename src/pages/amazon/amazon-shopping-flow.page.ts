import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@/pages/base.page';

/**
 * AmazonShoppingFlowPage encapsulates the core end-to-end shopping flow on Amazon:
 * search for a product, open a result, add it to cart, and verify cart contents.
 */
export class AmazonShoppingFlowPage extends BasePage {
    private expectedProductTitle: string | undefined;

    /**
     * Navigate to Amazon home page using BasePage navigation ownership.
     * @returns Promise<void>
     */
    async navigateToAmazonHome(): Promise<void> {
        this.logStep('Navigate to Amazon home page');
        await this.navigateTo('https://www.amazon.com');

        // Basic homepage readiness check.
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.page).toHaveURL(/amazon\.com/);
    }

    /**
     * Fill the Amazon search box with the provided product name.
     * @param productName Product name to search for.
     * @returns Promise<void>
     */
    async searchForProduct(productName: string = 'Wireless Mouse'): Promise<void> {
        this.logStep(`Enter search term: ${productName}`);
        const searchField = this.page.getByRole('searchbox', { name: 'Search Amazon' });
        await searchField.waitFor({ state: 'visible' });
        await searchField.fill(productName);
    }

    /**
     * Submit the search by clicking the Go button.
     * @returns Promise<void>
     */
    async submitSearch(): Promise<void> {
        this.logStep('Submit search by clicking Go');
        const goButton = this.page.getByRole('button', { name: 'Go', exact: true });
        await goButton.waitFor({ state: 'visible' });
        await Promise.all([this.page.waitForLoadState('domcontentloaded'), goButton.click()]);
    }

    /**
     * Open the recorded first product (hard-coded title) from search results.
     * Also captures the product title for later cart verification.
     * @returns Promise<void>
     */
    async openRecordedFirstProduct(): Promise<void> {
        this.logStep('Open recorded first product from search results');
        const productLink = this.page.getByRole('link', {
            name: 'Logitech M185 Wireless Mouse, 2.4GHz with USB Mini Receiver, 12-Month Battery Life, 1000 DPI Optical Tracking, Ambidextrous PC/Mac/Laptop - Swift Grey',
            exact: true
        });

        await productLink.waitFor({ state: 'visible' });
        this.expectedProductTitle = (await productLink.innerText()).trim();

        await Promise.all([this.page.waitForLoadState('domcontentloaded'), productLink.click()]);
    }

    /**
     * Select the first non-sponsored product from search results.
     *
     * Heuristic: iterate result containers and skip any that contain a "Sponsored" label.
     * Captures the selected product title for later cart verification.
     *
     * @param options Optional selection options.
     * @param options.expectedTitleContains If provided, prefers a non-sponsored result whose title contains this text.
     * @returns Promise<void>
     */
    async selectFirstNonSponsoredProduct(options?: { expectedTitleContains?: string }): Promise<void> {
        this.logStep(
            `Select first non-sponsored product${options?.expectedTitleContains ? ` containing: ${options.expectedTitleContains}` : ''}`
        );

        // Amazon search results are typically under [data-component-type='s-search-result'].
        const results = this.page.locator("[data-component-type='s-search-result']");
        await expect(results.first()).toBeVisible();

        const count = await results.count();
        for (let i = 0; i < count; i++) {
            const result = results.nth(i);

            // Skip sponsored results.
            const sponsored = result.getByText('Sponsored', { exact: true });
            if (await sponsored.count()) {
                continue;
            }

            const titleLink = result.locator('h2 a');
            if (!(await titleLink.count())) {
                continue;
            }

            const title = (await titleLink.first().innerText()).trim();
            if (options?.expectedTitleContains && !title.toLowerCase().includes(options.expectedTitleContains.toLowerCase())) {
                continue;
            }

            this.expectedProductTitle = title;
            await Promise.all([this.page.waitForLoadState('domcontentloaded'), titleLink.first().click()]);
            return;
        }

        throw new Error('No non-sponsored product result found to open.');
    }

    /**
     * Click "Add to cart" on the product details page.
     * Captures the PDP title if not already captured from results.
     * @returns Promise<void>
     */
    async addToCart(): Promise<void> {
        this.logStep('Add product to cart');

        // Capture PDP title for later verification if we don't already have one.
        if (!this.expectedProductTitle) {
            const pdpTitle = this.page.locator('#productTitle');
            if (await pdpTitle.count()) {
                await pdpTitle.waitFor({ state: 'visible' });
                this.expectedProductTitle = (await pdpTitle.innerText()).trim();
            }
        }

        const addToCartButton = this.page.getByRole('button', { name: 'Add to cart', exact: true });
        await addToCartButton.waitFor({ state: 'visible' });
        await addToCartButton.click();

        // Wait for cart/add confirmation UI to settle.
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Open the cart by clicking the "item in cart" link.
     * @returns Promise<void>
     */
    async openCart(): Promise<void> {
        this.logStep('Open cart');
        const cartLink = this.page.getByRole('link', { name: 'item in cart' });
        await cartLink.waitFor({ state: 'visible' });
        await Promise.all([this.page.waitForLoadState('domcontentloaded'), cartLink.click()]);
    }

    /**
     * Verify cart contains the expected product and quantity is exactly 1.
     *
     * Uses explicit cart DOM locators (not part of recorded steps) for robust assertions.
     * @param expectedTitleContains Optional override for expected title substring.
     * @returns Promise<void>
     */
    async verifyCartHasQuantityOneAndProduct(expectedTitleContains?: string): Promise<void> {
        const expectedTitle = expectedTitleContains ?? this.expectedProductTitle;
        this.logStep(`Verify cart has quantity 1 and product title contains: ${expectedTitle ?? '(captured earlier)'}`);

        if (!expectedTitle) {
            throw new Error(
                'Expected product title is not available. Ensure a product was selected before calling verifyCartHasQuantityOneAndProduct().'
            );
        }

        // Cart line items.
        const cartItems = this.page.locator("[data-name='Active Items'] [data-asin]:not([data-asin=''])");
        await expect(cartItems.first()).toBeVisible();

        // Verify at least one cart item title contains expected text.
        const cartItemTitle = this.page.locator("[data-name='Active Items'] .sc-product-title");
        await expect(cartItemTitle.first()).toBeVisible();
        await expect(cartItemTitle).toContainText(expectedTitle, { ignoreCase: true });

        // Verify quantity is 1 for the first cart line item.
        const quantityDropdown = this.page.locator(
            "[data-name='Active Items'] [data-asin]:not([data-asin='']):first-child select[name='quantity']"
        );
        const quantityText = this.page.locator(
            "[data-name='Active Items'] [data-asin]:not([data-asin='']):first-child span.a-dropdown-prompt"
        );

        if (await quantityText.count()) {
            await expect(quantityText).toHaveText('1');
        } else if (await quantityDropdown.count()) {
            await expect(quantityDropdown).toHaveValue('1');
        } else {
            // Fallback: some cart UIs render quantity as plain text.
            const quantityFallback = this.page.locator(
                "[data-name='Active Items'] [data-asin]:not([data-asin='']):first-child [data-a-selector='value']"
            );
            await expect(quantityFallback).toContainText('1');
        }
    }

    /**
     * Expose the last captured product title for debugging or external assertions.
     * @returns Captured product title (if any).
     */
    getCapturedProductTitle(): string | undefined {
        return this.expectedProductTitle;
    }

    /**
     * Helper to build a Locator from a Playwright primarySelector expression.
     * This is used only for internal typing convenience.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private asLocator(_page: Page, _locator: Locator): Locator {
        return _locator;
    }
}
