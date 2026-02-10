const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('Change Request Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test.skip('should create a new Change Request', async ({ page }) => {
    const changeRequestData = config.getTestData('changeRequest');
    const timestamp = Date.now();

    await test.step('Navigate to Change Request section', async () => {
      await dashboardPage.navigateToModule('Change Requests');
    });

    await test.step('Click create change request button', async () => {
      await dashboardPage.clickCreateButton('changeRequest');
    });

    await test.step('Fill Change Request form', async () => {
      const createPage = new CreateModulePage(page, config, 'Change Request');
      
      await createPage.fillBasicFields({
        title: `${changeRequestData.title} ${timestamp}`,
        description: changeRequestData.description
      });

      await createPage.submit();
    });

    await test.step('Verify Change Request creation', async () => {
      const createPage = new CreateModulePage(page, config, 'Change Request');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});
