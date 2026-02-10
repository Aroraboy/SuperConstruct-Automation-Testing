const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');
const path = require('path');

test.describe('Authentication Tests', () => {
  let loginPage;
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page, config);
    dashboardPage = new DashboardPage(page, config);
  });

  // Run login test first - this will require OTP entry
  test('01 - should successfully login with valid credentials', async ({ page, context }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('Enter credentials and login (with OTP handling)', async () => {
      const user = config.getTestUser();
      await loginPage.loginWithOTPAuto(user.email, user.password, user.gmailAppPassword);
    });

    await test.step('Verify successful login', async () => {
      const isLoggedIn = await loginPage.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();
    });

    await test.step('Verify dashboard is accessible', async () => {
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    });

    // Save authentication state for subsequent tests
    await test.step('Save auth state', async () => {
      await context.storageState({ path: path.join(__dirname, '../../.auth/user.json') });
      console.log('✅ Authentication state saved - subsequent tests will skip OTP');
    });
  });

  // This test reuses the authenticated session
  test('02 - should successfully logout', async ({ page, context }) => {
    // Load saved auth state
    const authFile = path.join(__dirname, '../../.auth/user.json');
    const fs = require('fs');
    
    if (fs.existsSync(authFile)) {
      const authState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
      await context.addCookies(authState.cookies);
      console.log('✅ Reusing saved authentication state');
    } else {
      // Fallback: login if no saved state
      await loginPage.goto();
      const user = config.getTestUser();
      await loginPage.loginWithOTPAuto(user.email, user.password, user.gmailAppPassword);
    }

    await test.step('Navigate to dashboard', async () => {
      await dashboardPage.goto();
    });

    await test.step('Logout', async () => {
      await dashboardPage.logout();
    });

    await test.step('Verify redirected to login page', async () => {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|signin|auth/i);
    });
  });

  // This test must start fresh (testing invalid credentials)
  test('03 - should show error for invalid credentials', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('Enter invalid credentials', async () => {
      await loginPage.login('invalid@email.com', 'wrongpassword123');
    });

    await test.step('Verify error message or stay on login page', async () => {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const errorMessage = await loginPage.getErrorMessage();
      
      // Either shows error or stays on login page
      const hasError = errorMessage !== null || currentUrl.includes('/login');
      expect(hasError).toBeTruthy();
    });
  });
});
