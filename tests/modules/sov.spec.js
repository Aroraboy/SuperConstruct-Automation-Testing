const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('Schedule of Values Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test.skip('should create a new Schedule of Values', async ({ page }) => {
    const sovData = config.getTestData('scheduleOfValues');
    const timestamp = Date.now();

    await test.step('Navigate to Schedule of Values', async () => {
      await dashboardPage.navigateToModule('Schedule of Values');
    });

    await test.step('Click create SOV button', async () => {
      await dashboardPage.clickCreateButton('sov');
    });

    await test.step('Fill SOV form', async () => {
      const createPage = new CreateModulePage(page, config, 'SOV');
      
      await createPage.fillBasicFields({
        title: `${sovData.name} ${timestamp}`,
        description: 'Automated smoke test for Schedule of Values'
      });

      // Add line items if the form supports it
      try {
        const addLineItemButton = await createPage.ai.findElement([
          'button:has-text("Add Line Item")',
          'button:has-text("Add Item")',
          '[data-testid="add-line-item"]'
        ], { timeout: 3000 });

        for (let i = 0; i < sovData.lineItems; i++) {
          await addLineItemButton.click();
          await page.waitForTimeout(500);
          
          // Fill line item details
          await createPage.ai.smartFill(
            [`input[name="lineItem[${i}].description"]`, `input[name="description"]`],
            `Line Item ${i + 1}`
          ).catch(() => {});
        }
      } catch {
        console.log('Line item addition not available or different structure');
      }

      await createPage.submit();
    });

    await test.step('Verify SOV creation', async () => {
      const createPage = new CreateModulePage(page, config, 'SOV');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});
