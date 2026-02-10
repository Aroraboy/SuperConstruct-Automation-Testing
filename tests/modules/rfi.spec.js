const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('RFI Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test.skip('should create a new RFI', async ({ page }) => {
    const rfiData = config.getTestData('rfi');
    const timestamp = Date.now();

    await test.step('Navigate to RFI section', async () => {
      await dashboardPage.navigateToModule('RFI');
    });

    await test.step('Click create RFI button', async () => {
      await dashboardPage.clickCreateButton('rfi');
    });

    await test.step('Fill RFI form', async () => {
      const createPage = new CreateModulePage(page, config, 'RFI');
      
      await createPage.fillBasicFields({
        title: `${rfiData.title} ${timestamp}`,
        description: rfiData.description
      });

      await createPage.submit();
    });

    await test.step('Verify RFI creation', async () => {
      const createPage = new CreateModulePage(page, config, 'RFI');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});
