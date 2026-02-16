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
  // Skip setup for registration, auth, and GC flow projects
  const skipProjects = ['registration', 'auth', 'gc-register', 'gc-project', 'gc-invite', 'gc-accept', 'gc-add-to-project', 'gc-members-accept-project', 'gc-invite-owner', 'gc-owner-accept'];
  if (
    process.env.SKIP_GLOBAL_SETUP ||
    process.argv.some(arg => skipProjects.some(p => arg.includes(p)))
  ) {
    console.log(`\n⏭️  Skipping global authentication setup for: ${skipProjects.join(', ')}\n`);
    return;
  }

  console.log('\n[LOCK] Running global authentication setup...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const loginPage = new LoginPage(page, config);
    const user = config.getTestUser();
    
    console.log('[PIN] Navigating to login page...');
    await loginPage.goto();
    
    console.log('[KEY] Logging in...');
    await loginPage.loginWithOTPAuto(user.email, user.password, user.gmailAppPassword);
    
    // Wait a bit for login to complete
    await page.waitForTimeout(3000);
    
    // Save authentication state
    const authFile = path.join(__dirname, '../.auth/user.json');
    await context.storageState({ path: authFile });
    
    console.log('[OK] Login successful!');
    console.log('[SAVE] Authentication state saved to .auth/user.json');
    console.log('[TARGET] All subsequent tests will reuse this session\n');
    
  } catch (error) {
    console.error('[ERROR] Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;


