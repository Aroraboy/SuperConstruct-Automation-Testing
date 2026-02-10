const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('Submittal Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test.skip('should create a new Submittal', async ({ page }) => {
    const submittalData = config.getTestData('submittal');
    const timestamp = Date.now();

    await test.step('Navigate to Submittal section', async () => {
      await dashboardPage.navigateToModule('Submittals');
    });

    await test.step('Click create submittal button', async () => {
      await dashboardPage.clickCreateButton('submittal');
    });

    await test.step('Fill Submittal form', async () => {
      const createPage = new CreateModulePage(page, config, 'Submittal');
      
      await createPage.fillBasicFields({
        title: `${submittalData.title} ${timestamp}`,
        description: 'Automated smoke test submittal',
        type: submittalData.type
      });

      await createPage.submit();
    });

    await test.step('Verify Submittal creation', async () => {
      const createPage = new CreateModulePage(page, config, 'Submittal');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});
