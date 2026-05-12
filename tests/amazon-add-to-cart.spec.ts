import { test, expect } from '@test-setup/fixtures';
import { AmazonShoppingFlowPage } from '@/pages/amazon/amazon-shopping-flow.page';

/**
 * Amazon | search wireless mouse | add to cart | verify cart quantity 1
 * Covers end-to-end shopping flow: home → search → open product → add to cart → cart verification.
 */

test.describe('Amazon | search wireless mouse | add to cart | verify cart quantity 1', () => {
    /**
     * Validates that a user can search for a wireless mouse, add the selected product to the cart,
     * and verify the cart contains the correct product with quantity 1.
     */
    test('Amazon | search wireless mouse | add to cart | verify cart quantity 1', async ({ page, logger }) => {
        const amazonShoppingFlowPage = new AmazonShoppingFlowPage(page);

        await test.step('Navigate to Amazon home', async () => {
            logger.info('Navigate to Amazon home');
            await amazonShoppingFlowPage.navigateToAmazonHome();
            await expect(page).toHaveURL(/amazon\.com/i);
        });

        await test.step('Search for product: Wireless Mouse', async () => {
            logger.info('Search for product: Wireless Mouse');
            await amazonShoppingFlowPage.searchForProduct('Wireless Mouse');
            await amazonShoppingFlowPage.submitSearch();
        });

        await test.step('Open recorded first product from results', async () => {
            logger.info('Open recorded first product from results');
            await amazonShoppingFlowPage.openRecordedFirstProduct();
        });

        await test.step('Add product to cart', async () => {
            logger.info('Add product to cart (price=REDACTED)');
            await amazonShoppingFlowPage.addToCart();
        });

        await test.step('Open cart', async () => {
            logger.info('Open cart');
            await amazonShoppingFlowPage.openCart();
        });

        await test.step('Verify cart has quantity 1 and correct product', async () => {
            const capturedTitle = amazonShoppingFlowPage.getCapturedProductTitle();
            logger.info(`Verify cart contents (title=${capturedTitle ? 'captured' : 'missing'}, price=REDACTED)`);

            await amazonShoppingFlowPage.verifyCartHasQuantityOneAndProduct();

            // Step 7 explicit assertions (in addition to page-object verification).
            expect(capturedTitle, 'Captured product title should be available for cart verification').toBeTruthy();
            await expect(page.locator("[data-name='Active Items'] .sc-product-title")).toContainText(capturedTitle!, {
                ignoreCase: true,
            });
        });
    });
});
