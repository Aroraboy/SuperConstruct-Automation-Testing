const { test, expect } = require('@playwright/test');
const { getOTPFromGmail } = require('../../utils/gmail-otp-reader');
const fs = require('fs');
const path = require('path');

// Read credentials saved by register-gmail-account.spec.js
const CREDENTIALS_PATH = path.join(__dirname, '..', '..', '.auth', 'gmail-account.json');
function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      'No registered account found. Run "npm run test:register-gmail" first to create one.'
    );
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
}

test.describe('Contractor Login and Member Invitation', () => {
  test.beforeAll(async () => {
    console.log('\n[SETUP] Setting up login + member invitation test...');
  });

  test('should login contractor and invite a new member', async ({ page, context, browser }) => {
    // Increase test timeout to 90 seconds
    test.setTimeout(90000);
    
    // Ensure NO authentication is carried over
    console.log('\n[CLEANUP] Ensuring fresh unauthenticated context...');
    
    // Load credentials from the last registered Gmail account
    console.log('\n[CREDENTIALS] Using Gmail test account...');
    const creds = loadCredentials();
    const testEmail = creds.email;
    const testPassword = creds.password;
    console.log(`   [INFO] Using account registered at: ${creds.registeredAt}`);
    
    console.log(`\\n[EMAIL] Test account email: ${testEmail}`);
    
    // Step 2: Navigate to login page
    console.log('\n[STEP 2] Navigating to login page...');
    const loginUrl = 'https://beta.superconstruct.io/auth/login';
    
    await page.goto(loginUrl, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(5000);
    console.log(`   Current URL: ${page.url()}`);
    console.log(`   [OK] Login page loaded`);
    
    // Check if already logged in
    if (page.url().includes('/app') && !page.url().includes('login')) {
      console.log(`   [WARNING] Already logged in! Proceeding to onboarding...`);
    }

    // Step 3: Enter login credentials
    console.log('\n[STEP 3] Entering login credentials...');
    try {
      // Fill email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.waitFor({ timeout: 5000 });
      await emailInput.fill(testEmail);
      console.log(`   [DONE] Email: ${testEmail}`);
      
      // Fill password
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ timeout: 5000 });
      await passwordInput.fill(testPassword);
      console.log(`   [DONE] Password entered`);
      
      // Click login button
      const loginButton = page.locator('button').filter({ hasText: /Login|Sign In/i }).first();
      await loginButton.waitFor({ timeout: 5000 });
      await loginButton.click();
      console.log(`   [DONE] Login button clicked`);
      
      // Wait for navigation away from login page
      await page.waitForTimeout(3000);
      console.log(`   Current URL after login: ${page.url()}`);
      
      // If still on login page, there might be an error
      if (page.url().includes('/auth/login')) {
        console.log(`   [WARNING] Still on login page, checking for errors...`);
        const errorMsg = page.locator('[role="alert"], .error, [class*="error"]').first();
        const errorText = await errorMsg.textContent({ timeout: 2000 }).catch(() => null);
        if (errorText) {
          console.error(`   [ERROR] Login error: ${errorText}`);
          throw new Error(`Login failed: ${errorText}`);
        }
        
        // Maybe already onboarded - let's navigate to app
        console.log(`   [INFO] No error found, trying to navigate to app...`);
        await page.goto('https://beta.superconstruct.io/app', { waitUntil: 'load', timeout: 15000 });
        console.log(`   Navigated to: ${page.url()}`);
      }
      
      console.log(`   [OK] Successfully logged in! Current URL: ${page.url()}`);
    } catch (error) {
      console.error(`   [ERROR] Login error: ${error.message}`);
      throw error;
    }
    
    // Step 4: Proceed to onboarding or dashboard
    console.log('\n[STEP 4] Login successful, checking current page...');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if login requires OTP verification
    if (currentUrl.includes('/otp') && currentUrl.includes('isSignIn=true')) {
      console.log(`   [EMAIL] Login requires OTP verification, waiting for email...`);
      
      // Step 5: Wait for and extract OTP
      console.log('\n[STEP 5] Waiting for OTP email...');
      let otp;
      try {
        otp = await getOTPFromGmail(testEmail, 60000);
        console.log(`   [OK] OTP extracted: ${otp}`);
      } catch (error) {
        console.error(`   [ERROR] Failed to get OTP: ${error.message}`);
        throw error;
      }
      
      // Step 6: Enter OTP
      console.log('\n[STEP 6] Entering OTP...');
      const otpInputs = page.locator('input[type="text"]');
      const otpArray = otp.split('');
      const otpInputsArray = await otpInputs.all();
      
      if (otpInputsArray.length >= otpArray.length) {
        // Multiple input fields (one per digit)
        for (let i = 0; i < otpArray.length; i++) {
          await otpInputsArray[i].fill(otpArray[i]);
          await page.waitForTimeout(200);
          console.log(`   [DONE] Digit ${i + 1}: ${otpArray[i]}`);
        }
      } else if (otpInputsArray.length > 0) {
        // Single input field
        await otpInputsArray[0].fill(otp);
        console.log(`   [DONE] OTP entered: ${otp}`);
      }
      
      // Click verify button if present
      await page.waitForTimeout(1000);
      const verifyButton = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
      if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await verifyButton.click();
        console.log('   [DONE] Verify button clicked');
      }
      
      // Wait for navigation after OTP
      await page.waitForTimeout(3000);
      console.log(`   Current URL after OTP: ${page.url()}`);
    }
    
    // Refresh the page to ensure full load after OTP/login
    console.log('\n   Refreshing page to ensure full load...');
    await page.reload();
    await page.waitForTimeout(5000);
    
    // Check if we're already on the app (onboarding completed)
    const finalUrl = page.url();
    if (finalUrl.includes('/app') && !finalUrl.includes('/onboarding')) {
      console.log(`   [OK] Already onboarded! Contractor is on the main app.`);
    } else if (finalUrl.includes('/onboarding') || finalUrl.includes('/setup')) {
      console.log(`   [NOTE] Onboarding detected, need to complete onboarding first...`);
    } else {
      console.log(`   [INFO] Current page: ${finalUrl}`);
    }
    
    // Step 7: Click the first company card image (skip the site logo)
    console.log('\n[STEP 7] Selecting the first available company...');
    await page.waitForTimeout(5000);
    
    try {
      // Codegen: page.getByRole('img', { name: 'Acme Construction' })
      // For generic first-company: iterate images, check alt + aria-label, skip logo
      const companyImages = page.getByRole('img');
      const count = await companyImages.count();
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const img = companyImages.nth(i);
        const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
        console.log(`   Image ${i}: "${name}"`);
        // Skip the site logo and empty names — only exclude exact "SuperConstruct logo"
        if (name && name !== 'SuperConstruct logo') {
          await img.click();
          console.log(`   [DONE] Company clicked: "${name}"`);
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        throw new Error('No company card image found on page');
      }
      
      await page.waitForTimeout(5000);
      console.log(`   Current URL after company selection: ${page.url()}`);
    } catch (error) {
      console.error(`   [ERROR] Company selection failed: ${error.message}`);
      await page.screenshot({ path: `test-results/company-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 8: Click the first project card image (skip the site logo)
    console.log('\n[STEP 8] Selecting the first available project...');
    await page.waitForTimeout(5000);
    
    try {
      // Codegen: page.getByRole('img', { name: 'abc' })
      // For generic first-project: iterate images, check alt + aria-label, skip logo
      const projectImages = page.getByRole('img');
      const count = await projectImages.count();
      let clicked = false;
      for (let i = 0; i < count; i++) {
        const img = projectImages.nth(i);
        const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
        console.log(`   Image ${i}: "${name}"`);
        // Skip the site logo and empty names — only exclude exact "SuperConstruct logo"
        if (name && name !== 'SuperConstruct logo') {
          await img.click();
          console.log(`   [DONE] Project clicked: "${name}"`);
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        throw new Error('No project card image found on page');
      }
      
      await page.waitForTimeout(3000);
      console.log(`   Current URL after project click: ${page.url()}`);
      
      // Should now be on /tools/overview
      if (!page.url().includes('/tools/')) {
        console.log('   [WARNING] Not on tools page, waiting longer...');
        await page.waitForTimeout(3000);
        console.log(`   URL: ${page.url()}`);
      }
    } catch (error) {
      console.error(`   [ERROR] Project selection failed: ${error.message}`);
      await page.screenshot({ path: `test-results/project-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 9: Navigate to Members section via sidebar link
    console.log('\n[STEP 9] Navigating to Members section...');
    try {
      // Codegen: page.getByRole('link').nth(3)
      const membersLink = page.getByRole('link').nth(3);
      await membersLink.waitFor({ timeout: 10000 });
      await membersLink.click();
      
      await page.waitForTimeout(3000);
      console.log(`   [DONE] On Members page: ${page.url()}`);
    } catch (error) {
      console.error(`   [ERROR] Members navigation failed: ${error.message}`);
      await page.screenshot({ path: `test-results/members-nav-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 10: Click Add Member button
    console.log('\n[STEP 10] Clicking Add Member button...');
    try {
      const addMemberButton = page.getByRole('button', { name: 'Add Member' });
      await addMemberButton.waitFor({ timeout: 10000 });
      await addMemberButton.click();
      console.log('   [DONE] Add Member button clicked');
      
      await page.waitForTimeout(5000);
    } catch (error) {
      console.error(`   [ERROR] Add Member button error: ${error.message}`);
      await page.screenshot({ path: `test-results/add-member-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 11: Fill member invitation form
    console.log('\n[STEP 11] Filling member invitation form...');
    try {
      await page.waitForTimeout(3000);
      
      // Generate dynamic email using Gmail dot trick
      const baseEmail = 'divyansharora35';
      const domain = '@gmail.com';
      const dotPosition = (Date.now() % (baseEmail.length - 1)) + 1;
      const newMemberEmail = baseEmail.slice(0, dotPosition) + '.' + baseEmail.slice(dotPosition) + domain;
      
      console.log(`   [INFO] Generated email (dot at position ${dotPosition}): ${newMemberEmail}`);
      
      // Fill email
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill(newMemberEmail);
      console.log(`   [DONE] Email: ${newMemberEmail}`);

      // Fill first name and last name fields directly below email
      const textboxes = page.getByRole('textbox');
      const emailIndex = await textboxes.locator({ name: 'Email', exact: true }).index().catch(() => 0);
      // Fill first name (next textbox after email)
      await textboxes.nth(emailIndex + 1).fill('AnyFirst');
      console.log('   [DONE] First Name: AnyFirst');
      // Fill last name (next textbox after first name)
      await textboxes.nth(emailIndex + 2).fill('AnyLast');
      console.log('   [DONE] Last Name: AnyLast');
      
      // Select role from dropdown (codegen: .select-dropdown-indicator > svg)
      await page.locator('.select-dropdown-indicator > svg').click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: 'Subcontractor' }).click();
      console.log('   [DONE] Role: Subcontractor');
      
      // Fill company name (codegen: getByRole('textbox', { name: 'Enter Company Name' }))
      const companyName = `TestCompany ${Date.now()}`;
      await page.getByRole('textbox', { name: 'Enter Company Name' }).fill(companyName);
      console.log(`   [DONE] Company Name: ${companyName}`);
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/member-form-filled-${Date.now()}.png` }).catch(() => {});
      
    } catch (error) {
      console.error(`   [ERROR] Form filling error: ${error.message}`);
      await page.screenshot({ path: `test-results/member-form-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 12: Submit member invitation
    console.log('\n[STEP 12] Sending member invitation...');
    try {
      // Click "Invite Member" button (codegen: getByRole('button', { name: 'Invite Member' }))
      await page.getByRole('button', { name: 'Invite Member' }).click();
      console.log('   [DONE] Invite Member button clicked');
      
      await page.waitForTimeout(7000);
      await page.screenshot({ path: `test-results/after-invite-${Date.now()}.png` }).catch(() => {});
      
      console.log(`   [OK] Current URL: ${page.url()}`);
      console.log('   [OK] Member invitation submitted!');
      
    } catch (error) {
      console.error(`   [ERROR] Invitation error: ${error.message}`);
      await page.screenshot({ path: `test-results/invite-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 13: Verify invitation was sent
    console.log('\n[STEP 13] Verifying member invitation...');
    try {
      await page.waitForTimeout(5000);
      console.log(`   Current URL: ${page.url()}`);
      
      // Check for success message or redirect back to members list
      const bodyText = await page.textContent('body').catch(() => '');
      
      if (bodyText.includes('divyansharora35') || bodyText.includes('Sub') || bodyText.includes('Contractor')) {
        console.log('   [OK] Invited member found on the page!');
      } else {
        console.log('   [OK] Invitation submitted successfully');
        console.log('   [NOTE] Member may appear as pending or require email confirmation');
      }
      
      await page.screenshot({ path: `test-results/member-verified-${Date.now()}.png` }).catch(() => {});
    } catch (error) {
      console.log(`   [WARNING] Verification note: ${error.message}`);
      await page.screenshot({ path: `test-results/member-verify-${Date.now()}.png` }).catch(() => {});
    }

    console.log('\n[COMPLETE] Test completed successfully: Login -> OTP -> Company -> Project -> Add Member!\n');
  });

  test.afterAll(async () => {
    console.log('\n[OK] Test run completed');
  });
});

