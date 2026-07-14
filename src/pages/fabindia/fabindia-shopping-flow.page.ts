import { BasePage } from '@/pages/base.page';

/**
 * FabIndia shopping flow page object.
 *
 * Encapsulates navigation and key interactions for browsing New Arrivals → Western Wear,
 * applying Category filters, and opening a recorded product details page.
 */
export class FabindiaShoppingFlowPage extends BasePage {

    /**
     * Navigate to FabIndia home page and wait for the page to be ready.
     * Uses BasePage.navigateTo for consistent logging/reporting.
     */
    async navigateToFabIndiaHome(): Promise<void> {
        this.logStep('Navigate to FabIndia home');
        await this.navigateTo('https://www.fabindia.com');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Hover over the "New Arrivals" link in the top navigation.
     */
    async hoverNewArrivals(): Promise<void> {
        this.logStep("Hover 'New Arrivals' in top navigation");
        const newArrivalsLink = this.page.getByRole('link', { name: 'New Arrivals' });
        await newArrivalsLink.waitFor({ state: 'visible' });
        await newArrivalsLink.hover();
    }

    /**
     * Click the "Western Wear" link after hovering New Arrivals.
     */
    async openWesternWearFromNewArrivals(): Promise<void> {
        this.logStep("Open 'Western Wear' from New Arrivals");
        const westernWearLink = this.page.getByRole('link', { name: 'Western Wear' }).first();
        await westernWearLink.waitFor({ state: 'visible' });
        await westernWearLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Expand the "Category" filter accordion/button in the sidebar.
     */
    async expandCategoryFilter(): Promise<void> {
        this.logStep("Expand 'Category' filter");
        const categoryFilterButton = this.page.getByRole('button', { name: 'Category /uf107' });
        await categoryFilterButton.waitFor({ state: 'visible' });
        await categoryFilterButton.click();
    }

    /**
     * Select the "Shirts (8)" category checkbox.
     */
    async selectCategoryShirts(): Promise<void> {
        this.logStep("Select category 'Shirts (8)'");
        const shirtsCategoryCheckbox = this.page.getByRole('checkbox', { name: 'Shirts (8)' });
        await shirtsCategoryCheckbox.waitFor({ state: 'visible' });
        await shirtsCategoryCheckbox.click();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Hover over the recorded first product link in the grid.
     */
    async hoverRecordedFirstProduct(): Promise<void> {
        this.logStep('Hover recorded first product in grid');
        const whiteCottonLinenShirtLink = this.page.getByRole('link', { name: 'White Cotton Linen Shirt Just' });
        await whiteCottonLinenShirtLink.waitFor({ state: 'visible' });
        await whiteCottonLinenShirtLink.hover();
    }

    /**
     * Click the recorded product link to open product details.
     */
    async openRecordedProductDetails(): Promise<void> {
        this.logStep('Open recorded product details');
        const whiteCottonLinenShirtLink = this.page.getByRole('link', { name: 'White Cotton Linen Shirt Just' });
        await whiteCottonLinenShirtLink.waitFor({ state: 'visible' });
        await whiteCottonLinenShirtLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Click the recorded product link again (kept for recording fidelity).
     */
    async openRecordedProductDetailsAgain(): Promise<void> {
        this.logStep('Open recorded product details again (second click)');
        const whiteCottonLinenShirtLink = this.page.getByRole('link', { name: 'White Cotton Linen Shirt Just' });
        await whiteCottonLinenShirtLink.waitFor({ state: 'visible' });
        await whiteCottonLinenShirtLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }
}
