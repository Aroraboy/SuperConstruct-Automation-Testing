const { test, expect } = require('@playwright/test');
const SignUpPage = require('../../pages/signup.page');
const LoginPage = require('../../pages/login.page');
const config = require('../../utils/config-manager');

test.describe('Sign Up Tests', () => {
  let signUpPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page, config);
    loginPage = new LoginPage(page, config);
  });

  test('should successfully sign up with new user', async ({ page }) => {
    const newUser = config.getNewUser();
    const timestamp = Date.now();
    const uniqueEmail = newUser.email.replace('@', `+${timestamp}@`);

    await test.step('Navigate to sign up page', async () => {
      await signUpPage.goto();
    });

    await test.step('Fill sign up form', async () => {
      await signUpPage.signUp({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: uniqueEmail,
        password: newUser.password
      });
    });

    await test.step('Verify successful registration', async () => {
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      // Should either redirect to dashboard, login, or show success
      const isSuccess = !currentUrl.includes('/signup') || 
                       currentUrl.includes('/dashboard') || 
                       currentUrl.includes('/login');
      expect(isSuccess).toBeTruthy();
    });
  });

  test('should navigate from login to sign up page', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await loginPage.goto();
    });

    await test.step('Click sign up link', async () => {
      await loginPage.clickSignUp();
    });

    await test.step('Verify on sign up page', async () => {
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/signup|register/i);
    });
  });
});
