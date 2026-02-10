const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('Inspection Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test.skip('should create a new Inspection', async ({ page }) => {
    const inspectionData = config.getTestData('inspection');
    const timestamp = Date.now();

    await test.step('Navigate to Inspection section', async () => {
      await dashboardPage.navigateToModule('Inspections');
    });

    await test.step('Click create inspection button', async () => {
      await dashboardPage.clickCreateButton('inspection');
    });

    await test.step('Fill Inspection form', async () => {
      const createPage = new CreateModulePage(page, config, 'Inspection');
      
      await createPage.fillBasicFields({
        title: `${inspectionData.title} ${timestamp}`,
        description: 'Automated smoke test inspection',
        type: inspectionData.type
      });

      await createPage.submit();
    });

    await test.step('Verify Inspection creation', async () => {
      const createPage = new CreateModulePage(page, config, 'Inspection');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});
