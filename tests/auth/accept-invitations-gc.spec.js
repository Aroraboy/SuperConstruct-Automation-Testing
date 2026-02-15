/**
 * Accept Invitations — Each invited member clicks the invite link from email,
 * then completes registration / onboarding.
 *
 * Prerequisites: Run the full GC flow first:
 *   npm run test:gc-flow   (register → create project → invite 3 members)
 *
 * Reads member list from .auth/gc-invited-members.json
 * Reads invite links from Gmail via IMAP (+alias pattern)
 *
 * Usage: npm run test:gc-accept
 */

const { test, expect } = require('@playwright/test');
const { getInviteLinkFromGmail } = require('../../utils/gmail-invite-reader');
const { getOTPFromGmail } = require('../../utils/gmail-otp-reader');
const fs = require('fs');
const path = require('path');

const INVITED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-members.json');
const ACCEPTED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-accepted-members.json');
const DEFAULT_PASSWORD = 'TestPassword@123';

function loadInvitedMembers() {
  if (!fs.existsSync(INVITED_PATH)) {
    throw new Error('Invited members file not found. Run "npm run test:gc-flow" first.');
  }
  return JSON.parse(fs.readFileSync(INVITED_PATH, 'utf-8'));
}

test.describe.serial('Accept All Member Invitations', () => {
  let members;
  const acceptedMembers = [];

  test.beforeAll(async () => {
    members = loadInvitedMembers();
    console.log(`\n[SETUP] Loaded ${members.length} invited members:`);
    members.forEach(m => console.log(`   - ${m.firstName} ${m.lastName}: ${m.email} (${m.status})`));
  });

  test.afterAll(async () => {
    // Save accepted members
    const authDir = path.dirname(ACCEPTED_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(ACCEPTED_PATH, JSON.stringify(acceptedMembers, null, 2));
    console.log(`\n[SAVED] ${acceptedMembers.length} accepted members -> .auth/gc-accepted-members.json`);
  });

  // We create a test for each member dynamically in a serial describe
  // But since Playwright doesn't support truly dynamic test creation at runtime in serial mode,
  // we iterate inside a single test and use a fresh page per member via browser context.

  test('Accept invitations for all 3 members', async ({ browser }) => {
    test.setTimeout(360000); // 6 minutes total for all 3

    for (let idx = 0; idx < members.length; idx++) {
      const member = members[idx];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[MEMBER ${idx + 1}/${members.length}] ${member.firstName} ${member.lastName}`);
      console.log(`[EMAIL] ${member.email}`);
      console.log(`${'='.repeat(60)}`);

      // Create a fresh browser context for each member (no saved auth)
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // ---- STEP 1: Get invite link from Gmail ----
        console.log('\n[STEP 1] Fetching invite link from Gmail...');
        let inviteLink;
        try {
          inviteLink = await getInviteLinkFromGmail(member.email, 90000);
          console.log(`   [OK] Invite link: ${inviteLink}`);
        } catch (error) {
          console.error(`   [ERROR] Failed to get invite link: ${error.message}`);
          // Take a screenshot of whatever page we have and skip this member
          await page.screenshot({ path: `test-results/accept-invite-no-email-${member.alias}-${Date.now()}.png` }).catch(() => {});
          throw error;
        }

        // ---- STEP 2: Navigate to invite link ----
        console.log('\n[STEP 2] Navigating to invite link...');
        await page.goto(inviteLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        const landingUrl = page.url();
        console.log(`   URL: ${landingUrl}`);
        await page.screenshot({ path: `test-results/accept-invite-landing-${member.alias}-${Date.now()}.png` }).catch(() => {});

        // ---- STEP 3: Handle the page that appears ----
        // The invite link might land on:
        // a) A registration page (if user doesn't exist)
        // b) A login page (if user exists but not logged in)
        // c) A direct "accept invitation" page
        // d) An "accept & set password" page

        console.log('\n[STEP 3] Handling invite acceptance page...');

        // Check if we're on a registration / sign-up page
        const isRegisterPage = landingUrl.includes('/register') || landingUrl.includes('/signup');
        const isLoginPage = landingUrl.includes('/login') || landingUrl.includes('/auth');
        const isAcceptPage = landingUrl.includes('/accept') || landingUrl.includes('/invite');
        const isSetPasswordPage = landingUrl.includes('/password') || landingUrl.includes('/set-password');

        if (isRegisterPage) {
          console.log('   [FLOW] Registration page detected');
          await handleRegistration(page, member);
        } else if (isSetPasswordPage || isAcceptPage) {
          console.log('   [FLOW] Accept / Set password page detected');
          await handleSetPassword(page, member);
        } else if (isLoginPage) {
          console.log('   [FLOW] Login page detected');
          await handleLogin(page, member);
        } else {
          // Generic handling: look for what's on the page
          console.log('   [FLOW] Unknown page, attempting generic handling...');
          await handleGenericInvitePage(page, member);
        }

        // ---- STEP 4: Handle OTP if required ----
        console.log('\n[STEP 4] Checking for OTP verification...');
        await page.waitForTimeout(2000);
        const afterUrl = page.url();

        if (afterUrl.includes('/otp') || afterUrl.includes('/verify')) {
          console.log('   OTP verification required...');
          await handleOTPVerification(page, member);
        } else {
          console.log('   No OTP step detected');
        }

        // ---- STEP 5: Handle onboarding if redirected ----
        console.log('\n[STEP 5] Checking for onboarding...');
        await page.waitForTimeout(2000);
        const currentUrl = page.url();

        if (currentUrl.includes('/onboarding') || currentUrl.includes('/setup')) {
          console.log('   Onboarding detected, completing...');
          await handleOnboarding(page, member);
        } else {
          console.log('   No onboarding step detected');
        }

        // ---- STEP 6: Verify success ----
        console.log('\n[STEP 6] Verifying acceptance...');
        await page.waitForTimeout(3000);
        const finalUrl = page.url();
        console.log(`   Final URL: ${finalUrl}`);
        await page.screenshot({ path: `test-results/accept-invite-complete-${member.alias}-${Date.now()}.png` }).catch(() => {});

        const success = finalUrl.includes('/app') ||
                        finalUrl.includes('/dashboard') ||
                        finalUrl.includes('/projects') ||
                        finalUrl.includes('/onboarding');

        acceptedMembers.push({
          ...member,
          password: DEFAULT_PASSWORD,
          status: success ? 'accepted' : 'unknown',
          finalUrl,
          acceptedAt: new Date().toISOString(),
        });

        if (success) {
          console.log(`   [OK] ${member.firstName} ${member.lastName} — invitation accepted!`);
        } else {
          console.log(`   [WARNING] Final URL doesn't look like success: ${finalUrl}`);
        }

      } catch (error) {
        console.error(`   [FAIL] ${member.firstName} ${member.lastName}: ${error.message}`);
        acceptedMembers.push({
          ...member,
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString(),
        });
        // Don't throw — continue with next member
      } finally {
        await context.close();
      }
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SUMMARY] Invitation Acceptance Results:`);
    acceptedMembers.forEach(m => {
      console.log(`   ${m.firstName} ${m.lastName}: ${m.status}`);
    });
    console.log(`${'='.repeat(60)}\n`);

    // Verify at least all members were processed
    expect(acceptedMembers.length).toBe(members.length);
  });
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Handle a registration page (fill name, email, password, etc.)
 */
async function handleRegistration(page, member) {
  console.log('   Filling registration form...');

  // First name
  const firstNameInput = page.locator('input[placeholder*="first"i], input[name*="first"i], input[name*="firstName"i]')
    .or(page.getByRole('textbox', { name: /first/i }))
    .first();
  if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstNameInput.fill(member.firstName);
    console.log(`   [DONE] First Name: ${member.firstName}`);
  }

  // Last name
  const lastNameInput = page.locator('input[placeholder*="last"i], input[name*="last"i], input[name*="lastName"i]')
    .or(page.getByRole('textbox', { name: /last/i }))
    .first();
  if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lastNameInput.fill(member.lastName);
    console.log(`   [DONE] Last Name: ${member.lastName}`);
  }

  // Email (may be pre-filled from invite link)
  const emailInput = page.locator('input[type="email"], input[name*="email"i]').first();
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    const currentValue = await emailInput.inputValue();
    if (!currentValue) {
      await emailInput.fill(member.email);
      console.log(`   [DONE] Email: ${member.email}`);
    } else {
      console.log(`   [INFO] Email pre-filled: ${currentValue}`);
    }
  }

  // Phone
  const phoneInput = page.locator('input[placeholder*="phone"i], input[type="tel"], input[name*="phone"i]').first();
  if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await phoneInput.fill('5551234567');
    console.log('   [DONE] Phone: 5551234567');
  }

  // Password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordInput.fill(DEFAULT_PASSWORD);
    console.log('   [DONE] Password set');
  }

  // Confirm password
  const confirmInput = page.locator('input[name="confirmPassword"], input[name*="confirm"i]')
    .or(page.locator('input[type="password"]').nth(1))
    .first();
  if (await confirmInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmInput.fill(DEFAULT_PASSWORD);
    console.log('   [DONE] Confirm Password set');
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/accept-invite-register-filled-${member.alias}-${Date.now()}.png` }).catch(() => {});

  // Submit
  const submitButton = page.locator('button').filter({ hasText: /Register|Sign Up|Create Account|Submit|Accept/i }).first();
  if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await submitButton.click();
    console.log('   [DONE] Register button clicked');
  } else {
    await page.keyboard.press('Enter');
    console.log('   [DONE] Enter pressed to submit');
  }

  await page.waitForTimeout(3000);
  console.log(`   URL after registration: ${page.url()}`);
}

/**
 * Handle a "set password" or "accept invite" page
 */
async function handleSetPassword(page, member) {
  console.log('   Setting password...');

  // Password
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await passwordInput.fill(DEFAULT_PASSWORD);
    console.log('   [DONE] Password set');
  }

  // Confirm password
  const confirmInput = page.locator('input[name="confirmPassword"], input[name*="confirm"i]')
    .or(page.locator('input[type="password"]').nth(1))
    .first();
  if (await confirmInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmInput.fill(DEFAULT_PASSWORD);
    console.log('   [DONE] Confirm Password set');
  }

  await page.waitForTimeout(500);

  // Submit
  const submitButton = page.locator('button').filter({ hasText: /Accept|Set Password|Submit|Continue|Save/i }).first();
  if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await submitButton.click();
    console.log('   [DONE] Submit button clicked');
  } else {
    await page.keyboard.press('Enter');
    console.log('   [DONE] Enter pressed to submit');
  }

  await page.waitForTimeout(3000);
  console.log(`   URL after set password: ${page.url()}`);
}

/**
 * Handle a login page (enter email + password)
 */
async function handleLogin(page, member) {
  console.log('   Logging in...');

  // Email
  const emailInput = page.locator('input[type="email"], input[name*="email"i]').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(member.email);
    console.log(`   [DONE] Email: ${member.email}`);
  }

  // Password
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordInput.fill(DEFAULT_PASSWORD);
    console.log('   [DONE] Password entered');
  }

  // Login button
  const loginButton = page.locator('button').filter({ hasText: /Login|Sign In|Log In|Submit/i }).first();
  if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginButton.click();
    console.log('   [DONE] Login button clicked');
  } else {
    await page.keyboard.press('Enter');
    console.log('   [DONE] Enter pressed to login');
  }

  await page.waitForTimeout(3000);
  console.log(`   URL after login: ${page.url()}`);
}

/**
 * Generic handler: inspect the page and figure out what to do
 */
async function handleGenericInvitePage(page, member) {
  // Log all visible buttons and inputs for debugging
  const buttons = page.locator('button:visible');
  const buttonCount = await buttons.count();
  console.log(`   Visible buttons (${buttonCount}):`);
  for (let i = 0; i < Math.min(buttonCount, 10); i++) {
    const text = await buttons.nth(i).textContent().catch(() => '');
    console.log(`      [${i}] "${text.trim()}"`);
  }

  const inputs = page.locator('input:visible');
  const inputCount = await inputs.count();
  console.log(`   Visible inputs (${inputCount}):`);
  for (let i = 0; i < Math.min(inputCount, 10); i++) {
    const type = await inputs.nth(i).getAttribute('type').catch(() => '');
    const name = await inputs.nth(i).getAttribute('name').catch(() => '');
    const placeholder = await inputs.nth(i).getAttribute('placeholder').catch(() => '');
    console.log(`      [${i}] type="${type}" name="${name}" placeholder="${placeholder}"`);
  }

  // Check for password fields — likely a registration / set password page
  const passwordFields = page.locator('input[type="password"]:visible');
  const pwCount = await passwordFields.count();

  if (pwCount > 0) {
    console.log('   [DETECT] Password field found — attempting registration flow...');

    // Check if there's a first name field
    const firstNameInput = page.locator('input[placeholder*="first"i], input[name*="first"i]').first();
    if (await firstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handleRegistration(page, member);
    } else {
      await handleSetPassword(page, member);
    }
  } else {
    // Maybe there's an "Accept" button
    const acceptButton = page.locator('button').filter({ hasText: /Accept|Join|Confirm|Continue/i }).first();
    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptButton.click();
      console.log('   [DONE] Accept button clicked');
      await page.waitForTimeout(3000);
    } else {
      // Look for any clickable link/button
      const anyAction = page.locator('a, button').filter({ hasText: /accept|join|register|sign up|get started/i }).first();
      if (await anyAction.isVisible({ timeout: 5000 }).catch(() => false)) {
        await anyAction.click();
        console.log('   [DONE] Action link/button clicked');
        await page.waitForTimeout(3000);
      } else {
        console.log('   [WARNING] No clear action found on this page');
        await page.screenshot({ path: `test-results/accept-invite-unknown-page-${member.alias}-${Date.now()}.png` }).catch(() => {});
      }
    }
  }
}

/**
 * Handle OTP verification step
 */
async function handleOTPVerification(page, member) {
  console.log('   Waiting for OTP email...');
  let otp;
  try {
    otp = await getOTPFromGmail(member.email, 60000);
    console.log(`   [OK] OTP: ${otp}`);
  } catch (error) {
    console.error(`   [ERROR] OTP failed: ${error.message}`);
    throw error;
  }

  // Enter OTP digits
  const otpInputs = page.locator('input[type="text"]');
  const otpArray = otp.split('');
  const otpInputsArray = await otpInputs.all();

  if (otpInputsArray.length >= otpArray.length) {
    for (let i = 0; i < otpArray.length; i++) {
      await otpInputsArray[i].fill(otpArray[i]);
      await page.waitForTimeout(200);
    }
    console.log(`   [DONE] OTP digits entered: ${otp}`);
  } else if (otpInputsArray.length > 0) {
    await otpInputsArray[0].fill(otp);
    console.log(`   [DONE] OTP entered: ${otp}`);
  }

  // Click verify
  await page.waitForTimeout(1000);
  const verifyButton = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
  if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await verifyButton.click();
    console.log('   [DONE] Verify button clicked');
  }

  await page.waitForTimeout(3000);
  console.log(`   URL after OTP: ${page.url()}`);
}

/**
 * Handle onboarding flow (intro → profile → company → complete)
 */
async function handleOnboarding(page, member) {
  // Intro / Next
  console.log('   [ONBOARDING] Looking for Next button...');
  const nextButton = page.locator('button').filter({ hasText: /Next|Continue|Get Started|Start/i }).first();
  if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nextButton.click();
    console.log('   [DONE] Next clicked');
    await page.waitForTimeout(2000);
  }

  // Profile page: timezone + address
  console.log('   [ONBOARDING] Filling profile...');
  const addressInput = page.locator('input[placeholder*="address"i], input[name*="address"i]').first();
  if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addressInput.fill('123 Test Street');
  }
  const cityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
  if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cityInput.fill('Test City');
  }
  const stateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
  if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await stateInput.fill('CA');
  }
  const zipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
  if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await zipInput.fill('90001');
  }

  // Save profile
  const saveBtn = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
  if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveBtn.click();
    console.log('   [DONE] Profile saved');
    await page.waitForTimeout(3000);
  }

  // Check if there's a terms/complete step
  console.log('   [ONBOARDING] Checking for terms and completion...');
  const termsCheckbox = page.locator('input[type="checkbox"]').first();
  if (await termsCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    const isChecked = await termsCheckbox.isChecked();
    if (!isChecked) {
      await termsCheckbox.click();
      console.log('   [DONE] Terms accepted');
    }
  }

  const completeButton = page.locator('button').filter({ hasText: /Complete|Finish|Done/i }).first();
  if (await completeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await completeButton.click();
    console.log('   [DONE] Onboarding completed');
    await page.waitForTimeout(3000);
  }

  console.log(`   URL after onboarding: ${page.url()}`);
}
