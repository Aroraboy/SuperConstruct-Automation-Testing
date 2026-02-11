/**
 * GLOBAL SETUP
 * 
 * Runs ONCE before all tests in the test suite
 * 
 * Purpose:
 * 1. Logs in to the application
 * 2. Reads OTP from Gmail if required
 * 3. Saves authentication state to .auth/user.json
 * 4. All subsequent tests reuse this saved session
 * 
 * Benefit: Tests run faster because login happens only once,
 *          not before every test
 * 
 * Configuration:
 * - Uses testUser from config/test.config.json
 * - Uses gmailAppPassword for OTP reading
 * - Saves auth state to .auth/user.json
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const LoginPage = require('../pages/login.page');
const config = require('../utils/config-manager');

/**
 * Global setup handler
 * Called once before all tests
 * SKIPPED for: registration, auth tests
 */
async function globalSetup() {
  // Skip setup for registration and auth tests
  if (process.env.SKIP_GLOBAL_SETUP || process.argv.some(arg => arg.includes('registration') || arg.includes('auth'))) {
    console.log('\n⏭️  Skipping global authentication setup for auth/registration tests\n');
    return;
  }

  console.log('\n🔐 Running global authentication setup...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const loginPage = new LoginPage(page, config);
    const user = config.getTestUser();
    
    console.log('📍 Navigating to login page...');
    await loginPage.goto();
    
    console.log('🔑 Logging in...');
    await loginPage.loginWithOTPAuto(user.email, user.password, user.gmailAppPassword);
    
    // Wait a bit for login to complete
    await page.waitForTimeout(3000);
    
    // Save authentication state
    const authFile = path.join(__dirname, '../.auth/user.json');
    await context.storageState({ path: authFile });
    
    console.log('✅ Login successful!');
    console.log('💾 Authentication state saved to .auth/user.json');
    console.log('🎯 All subsequent tests will reuse this session\n');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
