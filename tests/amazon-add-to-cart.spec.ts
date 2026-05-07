import { test, expect } from '@test-setup/fixtures';
import { AmazonShoppingFlowPage } from '@/pages/amazon/amazon-shopping-flow.page';

test.describe('Amazon | Add to cart', () => {
    test('Amazon | search wireless mouse | add to cart | verify cart quantity 1',
        /**
         * Test Case: Amazon add-to-cart flow
         * Steps:
         * 1. Navigate to https://www.amazon.com and verify homepage loads.
         * 2. Search for "Wireless Mouse".
         * 3. Select the first non-sponsored product from results (fallback to recorded product link).
         * 4. Add the product to cart.
         * 5. Open cart.
         * 6. Verify cart quantity is 1.
         * 7. Verify cart product title matches the selected product.
         */
        async ({ page, logger }) => {
            const amazonShoppingFlowPage = new AmazonShoppingFlowPage(page);

            logger?.info('Step 1: Navigate to Amazon home');
            await amazonShoppingFlowPage.navigateToAmazonHome();

            logger?.info('Step 2: Enter search term "Wireless Mouse"');
            await amazonShoppingFlowPage.searchForProduct('Wireless Mouse');

            logger?.info('Step 3: Submit search');
            await amazonShoppingFlowPage.submitSearch();

            logger?.info('Step 4: Select first non-sponsored product (fallback to recorded product if needed)');
            try {
                await amazonShoppingFlowPage.selectFirstNonSponsoredProduct();
            } catch (e) {
                logger?.info(
                    `Non-sponsored selection failed; falling back to recorded product link. Reason: ${(e as Error).message}`
                );
                await amazonShoppingFlowPage.openRecordedFirstProduct();
            }

            logger?.info('Step 5: Add to cart (price values are dynamic and intentionally not logged)');
            await amazonShoppingFlowPage.addToCart();

            logger?.info('Step 6: Open cart');
            await amazonShoppingFlowPage.openCart();

            logger?.info('Step 7: Verify cart has quantity 1 and expected product title');
            await amazonShoppingFlowPage.verifyCartHasQuantityOneAndProduct();

            // Additional explicit assertion to ensure step 7 is enforced at spec level.
            const cartItemQuantity = page
                .locator('[data-itemtype="active"], .sc-list-item, [data-asin]')
                .first()
                .locator('select[name="quantity"], input[name="quantity"]')
                .first();
            await expect(cartItemQuantity).toHaveValue('1');
        }
    );
});
