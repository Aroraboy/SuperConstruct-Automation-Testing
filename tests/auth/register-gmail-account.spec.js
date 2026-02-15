/**
 * Register a fresh Gmail +alias account on beta.superconstruct.io
 * 
 * Usage: npm run test:register-gmail
 * 
 * Each run creates a NEW unique account using a +timestamp alias.
 * Credentials are saved to .auth/gmail-account.json so other tests
 * (beta-create-project, member-invite) can read them.
 */

const { test, expect } = require('@playwright/test');
const { generateTestEmail, getOTPFromGmail } = require('../../utils/gmail-otp-reader');
const fs = require('fs');
const path = require('path');

const TEST_PASSWORD = 'TestPassword@123';
const CREDENTIALS_PATH = path.join(__dirname, '..', '..', '.auth', 'gmail-account.json');

test('Register fresh Gmail test account on beta', async ({ page }) => {
  test.setTimeout(180000);

  // Generate a unique +timestamp email each run
  const TEST_EMAIL = generateTestEmail();

  console.log(`\n[REGISTER] Registering: ${TEST_EMAIL}`);
  console.log(`[REGISTER] Password: ${TEST_PASSWORD}\n`);

  // Step 1: Go to registration page
  console.log('[STEP 1] Navigating to registration page...');
  await page.goto('https://beta.superconstruct.io/auth/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log(`   URL: ${page.url()}`);

  // Check if already on login (account might already exist)
  if (page.url().includes('/auth/login')) {
    console.log('   [INFO] Redirected to login - account may already exist. Try logging in.');
    return;
  }

  // Step 2: Fill registration form
  console.log('\n[STEP 2] Filling registration form...');
  
  await page.locator('input[placeholder="First name"]').fill('Test');
  console.log('   First Name: Test');
  
  await page.locator('input[placeholder="Last name"]').fill('User');
  console.log('   Last Name: User');
  
  await page.locator('input[type="email"]').fill(TEST_EMAIL);
  console.log(`   Email: ${TEST_EMAIL}`);
  
  await page.locator('input[placeholder="Phone Number"]').fill('5551234567');
  console.log('   Phone: 5551234567');
  
  await page.locator('input[name="password"]').fill(TEST_PASSWORD);
  console.log('   Password entered');
  
  await page.locator('input[name="confirmPassword"]').fill(TEST_PASSWORD);
  console.log('   Confirm Password entered');

  // Click Register
  const registerButton = page.locator('button').filter({ hasText: /Register|Sign Up|Create Account/i }).first();
  await registerButton.click();
  console.log('   Register button clicked');

  await page.waitForTimeout(3000);
  console.log(`   URL after register: ${page.url()}`);

  // Step 3: OTP verification
  if (page.url().includes('/otp')) {
    console.log('\n[STEP 3] OTP verification required...');
    
    const otp = await getOTPFromGmail(TEST_EMAIL, 60000);
    console.log(`   OTP: ${otp}`);

    const otpInputs = await page.locator('input[type="text"]').all();
    const otpDigits = otp.split('');
    
    if (otpInputs.length >= otpDigits.length) {
      for (let i = 0; i < otpDigits.length; i++) {
        await otpInputs[i].fill(otpDigits[i]);
        await page.waitForTimeout(200);
      }
    } else if (otpInputs.length > 0) {
      await otpInputs[0].fill(otp);
    }
    console.log('   OTP entered');

    await page.waitForTimeout(1000);
    const verifyBtn = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
    if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyBtn.click();
      console.log('   Verify clicked');
    }

    await page.waitForTimeout(3000);
    console.log(`   URL after OTP: ${page.url()}`);
  }

  // Step 4: Onboarding - Introduction
  console.log('\n[STEP 4] Introduction page...');
  await page.waitForTimeout(2000);
  const nextBtn = page.locator('button').filter({ hasText: /Next|Continue|Get Started/i }).first();
  if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextBtn.click();
    console.log('   Next clicked');
  }
  await page.waitForTimeout(2000);

  // Step 5: Profile page
  console.log('\n[STEP 5] Profile page...');
  await page.waitForTimeout(2000);

  // Address fields (try to fill if visible)
  const addressInput = page.locator('input[placeholder*="address"i], input[name*="address"i], input[placeholder*="street"i]').first();
  if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addressInput.fill('123 Test Street');
  }
  const cityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
  if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cityInput.fill('New York');
  }
  const stateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
  if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await stateInput.fill('NY');
  }
  const zipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
  if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipInput.fill('10001');
  }

  // Save
  const profileSaveBtn = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
  if (await profileSaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await profileSaveBtn.click();
    console.log('   Profile saved');
  }
  await page.waitForTimeout(3000);

  // Step 6: Company page
  console.log('\n[STEP 6] Company page...');
  await page.waitForTimeout(2000);

  const companyNameInput = page.locator('input[placeholder*="company"i], input[name*="company"i], input[name*="companyName"i]').first();
  if (await companyNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await companyNameInput.fill(`TestCompany ${Date.now()}`);
    console.log('   Company name filled');
  }

  // Company type dropdown
  const companyTypeDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /type|company type|select/i }).first();
  if (await companyTypeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
    await companyTypeDropdown.click();
    await page.waitForTimeout(500);
    const typeOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
    if (await typeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeOption.click();
      console.log('   Company type selected');
    }
  }

  // Currency dropdown
  const currencyDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /currency|USD|select/i }).first();
  if (await currencyDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
    await currencyDropdown.click();
    await page.waitForTimeout(500);
    const currOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
    if (await currOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currOption.click();
      console.log('   Currency selected');
    }
  }

  // Company address
  const compAddrFields = await page.locator('input[placeholder*="address"i], input[name*="address"i]').all();
  if (compAddrFields.length >= 1) await compAddrFields[0].fill('456 Business Ave');
  if (compAddrFields.length >= 2) await compAddrFields[1].fill('Suite 200');
  
  const compCityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
  if (await compCityInput.isVisible({ timeout: 2000 }).catch(() => false)) await compCityInput.fill('Los Angeles');
  const compStateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
  if (await compStateInput.isVisible({ timeout: 2000 }).catch(() => false)) await compStateInput.fill('CA');
  const compZipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
  if (await compZipInput.isVisible({ timeout: 2000 }).catch(() => false)) await compZipInput.fill('90001');

  // Save company
  const companySaveBtn = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
  if (await companySaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await companySaveBtn.click();
    console.log('   Company saved');
  }
  await page.waitForTimeout(3000);

  // Step 7: Complete page - terms & finish
  console.log('\n[STEP 7] Complete page...');
  await page.waitForTimeout(2000);

  const termsCheckbox = page.locator('input[type="checkbox"]').first();
  if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (!(await termsCheckbox.isChecked())) {
      await termsCheckbox.click();
      console.log('   Terms accepted');
    }
  }

  await page.waitForTimeout(500);
  const completeBtn = page.locator('button').filter({ hasText: /Complete|Finish|Done|Complete Onboarding/i }).first();
  if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await completeBtn.click();
    console.log('   Complete Onboarding clicked');
  }

  await page.waitForTimeout(5000);
  console.log(`\n[DONE] Final URL: ${page.url()}`);
  
  // Save credentials for other tests to use
  const credentials = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    registeredAt: new Date().toISOString(),
    finalUrl: page.url(),
  };

  // Ensure .auth directory exists
  const authDir = path.dirname(CREDENTIALS_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
  console.log(`\n[SAVED] Credentials saved to: ${CREDENTIALS_PATH}`);

  if (page.url().includes('/app')) {
    console.log('[OK] Account registered and onboarded successfully!');
  }
  console.log(`\n   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log('   Other tests will read from .auth/gmail-account.json\n');
});
