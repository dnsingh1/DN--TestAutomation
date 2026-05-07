import { Page, Browser, BrowserContext, expect, Locator } from '@playwright/test';
import { BasePage } from '@/pages/base.page';

/**
 * AmazonShoppingFlowPage encapsulates an end-to-end Amazon shopping flow:
 * navigating to Amazon, searching for a product, selecting a product (recorded or non-sponsored),
 * adding it to cart, opening the cart, and verifying the cart contents.
 */
export class AmazonShoppingFlowPage extends BasePage {
    private expectedProductTitle: string | undefined;

    /**
     * Creates an instance of AmazonShoppingFlowPage.
     *
     * @param page Playwright Page instance.
     * @param context Optional Playwright BrowserContext.
     * @param browser Optional Playwright Browser.
     */
    constructor(page: Page, context?: BrowserContext, browser?: Browser) {
        super(page, context, browser);
    }

    /**
     * Step 1: Navigate to Amazon home page.
     */
    async navigateToAmazonHome(): Promise<void> {
        await this.navigateTo('https://www.amazon.com');
        await expect(this.page).toHaveURL(/amazon\.com/);
    }

    /**
     * Step 2: Fill the Amazon search box with the provided query.
     *
     * Uses the recorded locator: getByRole('searchbox', { name: 'Search Amazon' }).
     *
     * @param query Search query text.
     */
    async searchForProduct(query: string = 'Wireless Mouse'): Promise<void> {
        await this.page.getByRole('searchbox', { name: 'Search Amazon' }).fill(query);
    }

    /**
     * Step 3: Submit the search by clicking the recorded Go button.
     *
     * Uses the recorded locator: getByRole('button', { name: 'Go', exact: true }).
     */
    async submitSearch(): Promise<void> {
        await this.page.getByRole('button', { name: 'Go', exact: true }).click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Step 4 (recorded): Open the recorded first product link from search results.
     *
     * Uses the recorded locator: getByRole('link', { name: '<hard-coded title>', exact: true }).
     * Captures the product title for later cart verification.
     */
    async openRecordedFirstProduct(): Promise<void> {
        const recordedLink = this.page.getByRole('link', {
            name: 'Logitech M185 Wireless Mouse, 2.4GHz with USB Mini Receiver, 12-Month Battery Life, 1000 DPI Optical Tracking, Ambidextrous PC/Mac/Laptop - Swift Grey',
            exact: true
        });

        this.expectedProductTitle = (await recordedLink.innerText()).trim();
        await recordedLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Step 4 (improved): Select the first non-sponsored product from search results.
     *
     * This method is intentionally heuristic-based because the recorded step used a hard-coded title.
     * It attempts to skip results that are labeled as Sponsored.
     *
     * @param options Optional selection options.
     * @param options.maxCandidates Maximum number of results to scan before failing.
     */
    async selectFirstNonSponsoredProduct(options?: { maxCandidates?: number }): Promise<void> {
        const maxCandidates = options?.maxCandidates ?? 20;

        // Amazon search results commonly use data-component-type="s-search-result".
        const results = this.page.locator('[data-component-type="s-search-result"]');
        await results.first().waitFor({ state: 'visible' });

        for (let i = 0; i < maxCandidates; i++) {
            const result = results.nth(i);
            const isVisible = await result.isVisible().catch(() => false);
            if (!isVisible) continue;

            // Heuristic: skip if the result contains a Sponsored label.
            const sponsoredLabel = result.getByText('Sponsored', { exact: true });
            const isSponsored = await sponsoredLabel.isVisible().catch(() => false);
            if (isSponsored) continue;

            // Prefer the main product title link within the result.
            const titleLink = result.locator('h2 a');
            await titleLink.first().waitFor({ state: 'visible' });

            this.expectedProductTitle = (await titleLink.first().innerText()).trim();
            await titleLink.first().click();
            await this.page.waitForLoadState('domcontentloaded');
            return;
        }

        throw new Error(`Unable to find a non-sponsored product within the first ${maxCandidates} search results.`);
    }

    /**
     * Step 5: Click "Add to cart" on the product details page.
     *
     * Uses the recorded locator: getByRole('button', { name: 'Add to cart', exact: true }).
     * Captures the PDP title if not already captured from search results.
     */
    async addToCart(): Promise<void> {
        if (!this.expectedProductTitle) {
            this.expectedProductTitle = await this.captureProductTitleFromPdp();
        }

        await this.page.getByRole('button', { name: 'Add to cart', exact: true }).click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Step 6: Open the cart by clicking the recorded "item in cart" link.
     *
     * Uses the recorded locator: getByRole('link', { name: 'item in cart' }).
     */
    async openCart(): Promise<void> {
        await this.page.getByRole('link', { name: 'item in cart' }).click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Step 7: Verify the cart contains the expected product and quantity is 1.
     *
     * Assertions:
     * - Quantity for the first cart line item is "1".
     * - Product title in cart contains the expected title captured earlier.
     *
     * @param expectedTitle Optional expected title override. If not provided, uses the captured title.
     */
    async verifyCartHasQuantityOneAndProduct(expectedTitle?: string): Promise<void> {
        const titleToAssert = (expectedTitle ?? this.expectedProductTitle)?.trim();
        if (!titleToAssert) {
            throw new Error(
                'Expected product title is not set. Capture it by calling openRecordedFirstProduct() or selectFirstNonSponsoredProduct() before verifying the cart.'
            );
        }

        const cartItem = this.getFirstCartItem();
        await cartItem.waitFor({ state: 'visible' });

        const cartTitle = cartItem.locator('h4 a, .sc-product-title, [data-a-word-break]');
        await expect(cartTitle.first()).toBeVisible();
        await expect(cartTitle.first()).toContainText(titleToAssert, { ignoreCase: true });

        const quantity = this.getCartItemQuantityLocator(cartItem);
        await expect(quantity).toBeVisible();
        await expect(quantity).toHaveValue('1');
    }

    /**
     * Captures the product title from the product details page (PDP).
     *
     * @returns The PDP product title text.
     */
    private async captureProductTitleFromPdp(): Promise<string> {
        const title = this.page.locator('#productTitle');
        await title.waitFor({ state: 'visible' });
        return (await title.innerText()).trim();
    }

    /**
     * Returns a locator for the first cart line item.
     *
     * @returns Locator for the first cart item container.
     */
    private getFirstCartItem(): Locator {
        // Common cart item containers.
        return this.page.locator('[data-itemtype="active"], .sc-list-item, [data-asin]').first();
    }

    /**
     * Returns a locator for the quantity control/value for a given cart line item.
     *
     * @param cartItem Locator for the cart item container.
     * @returns Locator for the quantity input/select.
     */
    private getCartItemQuantityLocator(cartItem: Locator): Locator {
        // Prefer an input/select with name="quantity" within the cart item.
        const quantityInput = cartItem.locator('select[name="quantity"], input[name="quantity"]');
        return quantityInput.first();
    }
}
