import { test, expect } from '@test-setup/fixtures';
import { FabindiaShoppingFlowPage } from '@/pages/fabindia/fabindia-shopping-flow.page';

/**
 * FabIndia | Western Wear | filter Shirts | open product
 * Covers browsing flow up to opening a product details page (steps 1–7).
 */
test.describe('FabIndia | Western Wear | filter Shirts | open product', () => {
    /**
     * Navigates FabIndia New Arrivals → Western Wear, filters Category=Shirts, and opens the recorded product.
     * Remaining checkout/login/payment steps require additional recorded locators and are intentionally not implemented here.
     */
    test('FabIndia | New Arrivals → Western Wear | filter Shirts | open product details', async ({ page, logger }) => {
        const fabindiaShoppingFlowPage = new FabindiaShoppingFlowPage(page);

        await test.step('Navigate to FabIndia home', async () => {
            logger.info('Navigate to FabIndia home');
            await fabindiaShoppingFlowPage.navigateToFabIndiaHome();
            await expect(page).toHaveURL(/fabindia\.com/i);
        });

        await test.step('Hover New Arrivals', async () => {
            logger.info('Hover over New Arrivals');
            await fabindiaShoppingFlowPage.hoverNewArrivals();
        });

        await test.step('Open Western Wear', async () => {
            logger.info('Click Western Wear');
            await fabindiaShoppingFlowPage.openWesternWearFromNewArrivals();
            // Safe assertion without guessing selectors: URL typically changes to western-wear listing.
            await expect(page).toHaveURL(/western-wear/i);
        });

        await test.step('Expand Category filter', async () => {
            logger.info('Expand Category filter');
            await fabindiaShoppingFlowPage.expandCategoryFilter();
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('Select Category: Shirts', async () => {
            logger.info('Select Shirts category');
            await fabindiaShoppingFlowPage.selectCategoryShirts();
            await page.waitForLoadState('networkidle');
        });

        await test.step('Hover recorded first product', async () => {
            logger.info('Hover recorded first product');
            await fabindiaShoppingFlowPage.hoverRecordedFirstProduct();
        });

        await test.step('Open recorded product details (recording fidelity)', async () => {
            logger.info('Open recorded product details');
            await fabindiaShoppingFlowPage.openRecordedProductDetails();
            await fabindiaShoppingFlowPage.openRecordedProductDetailsAgain();
            await page.waitForLoadState('domcontentloaded');
        });

        /**
         * NOTE/TODO:
         * Steps 8–14 (size selection, add to cart, cart, proceed to checkout, login, address, payment)
         * require additional recorded steps/locators. Do not implement without selectors.
         */
        const email = process.env.FABINDIA_EMAIL;
        const password = process.env.FABINDIA_PASSWORD;
        logger.info(`Credentials placeholders present? email=${email ? '***' : 'MISSING'} password=${password ? '***' : 'MISSING'}`);
    });
});
