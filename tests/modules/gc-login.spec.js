/**
 * GC Login — Logs in as the General Contractor and saves session
 *
 * Reads credentials from .auth/gc-account.json (saved during registration)
 * Handles email + password + OTP verification via Gmail IMAP
 * Saves storageState to .auth/gc-login-state.json for subsequent tests
 *
 * Usage: npm run test:sov-gc-login
 */

const { test, expect } = require('@playwright/test');
const { getOTPFromGmail } = require('../../utils/gmail-otp-reader');
const fs = require('fs');
const path = require('path');

const GC_ACCOUNT_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-account.json');
const GC_LOGIN_STATE_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-login-state.json');

function loadGCAccount() {
  if (!fs.existsSync(GC_ACCOUNT_PATH)) {
    throw new Error('GC account not found. Run the full GC flow first.');
  }
  return JSON.parse(fs.readFileSync(GC_ACCOUNT_PATH, 'utf-8'));
}

test.describe.serial('GC Login', () => {
  let account;

  test.beforeAll(async () => {
    account = loadGCAccount();
    console.log(`\n[SETUP] GC: ${account.email}`);
  });

  test('GC logs in and saves session', async ({ page, context }) => {
    test.setTimeout(120000);

    console.log('\n[STEP 1] Navigating to login page...');
    await page.goto('https://beta.superconstruct.io/auth/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    console.log('\n[STEP 2] Filling login form...');
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(account.email);
    console.log(`   [DONE] Email: ${account.email}`);

    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
    console.log('   [DONE] Password entered');

    await page.getByRole('button', { name: 'Sign In' }).click();
    console.log('   [DONE] Sign In clicked');
    await page.waitForTimeout(3000);

    const urlAfterLogin = page.url();
    console.log(`   URL after login: ${urlAfterLogin}`);

    // ---- STEP 3: OTP if required ----
    if (urlAfterLogin.includes('/otp') || urlAfterLogin.includes('/verify')) {
      console.log('\n[STEP 3] OTP verification required...');
      const otp = await getOTPFromGmail(account.email, 60000);
      console.log(`   [OK] OTP: ${otp}`);

      const otpDigits = otp.split('');
      const otpInputs = page.getByRole('textbox');
      const inputCount = await otpInputs.count();
      for (let i = 0; i < otpDigits.length && i < inputCount; i++) {
        await otpInputs.nth(i).fill(otpDigits[i]);
      }
      console.log(`   [DONE] OTP entered: ${otp}`);
      await page.waitForTimeout(5000);
    }

    // ---- STEP 4: Verify logged in ----
    await page.waitForURL('**/app**', { timeout: 15000 });
    console.log(`\n[STEP 4] Logged in! URL: ${page.url()}`);

    // ---- Save storageState ----
    const authDir = path.dirname(GC_LOGIN_STATE_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    await context.storageState({ path: GC_LOGIN_STATE_PATH });
    console.log('[SAVED] GC session -> .auth/gc-login-state.json');
    console.log('\n[COMPLETE] GC logged in and session saved!\n');
  });
});
