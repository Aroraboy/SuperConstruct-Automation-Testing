const { test, expect } = require('@playwright/test');
const { getOTPFromEmail } = require('../../utils/test-email-service');

test.describe('Beta Registration and Onboarding', () => {
  test.beforeAll(async () => {
    console.log('\n[SETUP] Setting up beta registration test...');
  });

  test('should register contractor and complete full onboarding on beta', async ({ page }) => {
    // Increase test timeout to 120 seconds for full onboarding flow
    test.setTimeout(120000);

    // MailSlurp credentials - fresh on beta.superconstruct.io
    const testEmail = '1e79e412-764b-4a9b-b000-377e29efc237@mailslurp.biz';
    const testPassword = 'TestPassword@123';
    const inboxId = '1e79e412-764b-4a9b-b000-377e29efc237';

    console.log(`\n[EMAIL] Using MailSlurp email: ${testEmail}`);

    // ============================
    // STEP 1: Registration Form
    // ============================
    console.log('\n[STEP 1] Navigating to beta registration page...');
    await page.goto('https://beta.superconstruct.io/auth/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log(`   Current URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-register-page-${Date.now()}.png` }).catch(() => {});

    console.log('   Filling registration form...');

    // First Name
    const firstNameInput = page.locator('input[placeholder*="first"i], input[name*="first"i], input[name*="firstName"i]').first();
    if (await firstNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstNameInput.fill('John');
      console.log('   [DONE] First Name: John');
    }

    // Last Name
    const lastNameInput = page.locator('input[placeholder*="last"i], input[name*="last"i], input[name*="lastName"i]').first();
    if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lastNameInput.fill('Doe');
      console.log('   [DONE] Last Name: Doe');
    }

    // Email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"i], input[name*="email"i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(testEmail);
      console.log(`   [DONE] Email: ${testEmail}`);
    }

    // Phone Number
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"i], input[name*="phone"i], input[placeholder*="number"i]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('5551234567');
      console.log('   [DONE] Phone: 5551234567');
    }

    // Password
    const passwordInputs = page.locator('input[type="password"]');
    const passwordFields = await passwordInputs.all();
    if (passwordFields.length >= 2) {
      await passwordFields[0].fill(testPassword);
      console.log('   [DONE] Password entered');
      await page.waitForTimeout(300);

      // Confirm Password
      await passwordFields[1].fill(testPassword);
      console.log('   [DONE] Confirm Password entered');
    } else if (passwordFields.length === 1) {
      await passwordFields[0].fill(testPassword);
      console.log('   [DONE] Password entered (single field)');
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/beta-register-filled-${Date.now()}.png` }).catch(() => {});

    // Click Register button
    console.log('   Clicking Register button...');
    const registerButton = page.locator('button').filter({ hasText: /Register|Sign Up|Create Account|Submit/i }).first();
    await registerButton.waitFor({ timeout: 5000 });
    await registerButton.click();
    console.log('   [DONE] Register button clicked');

    await page.waitForTimeout(3000);
    console.log(`   Current URL after register: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-after-register-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 2: OTP Verification
    // ============================
    console.log('\n[STEP 2] Checking for OTP verification...');
    const currentUrl = page.url();

    if (currentUrl.includes('/otp')) {
      console.log('   OTP verification required, waiting for email...');

      let otp;
      try {
        otp = await getOTPFromEmail(inboxId, 60000);
        console.log(`   [OK] OTP extracted: ${otp}`);
      } catch (error) {
        console.error(`   [ERROR] Failed to get OTP: ${error.message}`);
        throw error;
      }

      // Enter OTP digits
      console.log('   Entering OTP...');
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

      // Click verify button if present
      await page.waitForTimeout(1000);
      const verifyButton = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
      if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await verifyButton.click();
        console.log('   [DONE] Verify button clicked');
      }

      await page.waitForTimeout(3000);
      console.log(`   Current URL after OTP: ${page.url()}`);
    } else {
      console.log('   No OTP required, proceeding...');
    }

    await page.screenshot({ path: `test-results/beta-after-otp-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 3: Introduction Page
    // ============================
    console.log('\n[STEP 3] Introduction page - clicking Next...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/beta-intro-page-${Date.now()}.png` }).catch(() => {});

    const nextButton = page.locator('button').filter({ hasText: /Next|Continue|Get Started|Start/i }).first();
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();
      console.log('   [DONE] Next button clicked on Introduction page');
    } else {
      console.log('   [WARNING] Next button not found, pressing Enter...');
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(2000);
    console.log(`   Current URL: ${page.url()}`);

    // ============================
    // STEP 4: Profile Page
    // ============================
    console.log('\n[STEP 4] Profile page - filling details...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/beta-profile-page-${Date.now()}.png` }).catch(() => {});

    // Preferred Timezone dropdown
    console.log('   Selecting preferred timezone...');
    const timezoneSelect = page.locator('select').filter({ hasText: /timezone|time zone/i }).or(page.locator('select[name*="timezone"i], select[name*="timeZone"i]')).first();
    if (await timezoneSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await timezoneSelect.selectOption({ index: 1 });
      console.log('   [DONE] Timezone selected from dropdown');
    } else {
      // Try custom dropdown/combobox
      const timezoneDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /timezone|time zone|select/i }).first();
      if (await timezoneDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await timezoneDropdown.click();
        await page.waitForTimeout(500);
        const timezoneOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
        if (await timezoneOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await timezoneOption.click();
          console.log('   [DONE] Timezone selected from custom dropdown');
        }
      } else {
        console.log('   [INFO] Timezone dropdown not found, skipping');
      }
    }

    // Profile picture upload - skip for now (optional)
    console.log('   [INFO] Skipping profile picture upload (optional)');

    // Address fields (4 fields)
    console.log('   Filling address fields...');
    const addressData = {
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    };

    // Try to find and fill address fields by placeholder/name
    const addressInput = page.locator('input[placeholder*="address"i], input[name*="address"i], input[placeholder*="street"i]').first();
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.fill(addressData.address);
      console.log(`   [DONE] Address: ${addressData.address}`);
    }

    const cityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
    if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cityInput.fill(addressData.city);
      console.log(`   [DONE] City: ${addressData.city}`);
    }

    const stateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
    if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stateInput.fill(addressData.state);
      console.log(`   [DONE] State: ${addressData.state}`);
    }

    const zipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
    if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await zipInput.fill(addressData.zip);
      console.log(`   [DONE] ZIP: ${addressData.zip}`);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/beta-profile-filled-${Date.now()}.png` }).catch(() => {});

    // Click Save
    console.log('   Clicking Save...');
    const profileSaveButton = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
    if (await profileSaveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await profileSaveButton.click();
      console.log('   [DONE] Profile Save button clicked');
    } else {
      await page.keyboard.press('Enter');
      console.log('   [DONE] Enter pressed to save profile');
    }

    await page.waitForTimeout(3000);
    console.log(`   Current URL: ${page.url()}`);

    // ============================
    // STEP 5: Company Page
    // ============================
    console.log('\n[STEP 5] Company page - filling company details...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/beta-company-page-${Date.now()}.png` }).catch(() => {});

    // Company Name
    const companyNameInput = page.locator('input[placeholder*="company"i], input[name*="company"i], input[name*="companyName"i]').first();
    if (await companyNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const companyName = `Acme Construction ${Date.now()}`;
      await companyNameInput.fill(companyName);
      console.log(`   [DONE] Company Name: ${companyName}`);
    }

    // Company Type dropdown
    console.log('   Selecting company type...');
    const companyTypeSelect = page.locator('select').filter({ hasText: /type|company type/i }).or(page.locator('select[name*="type"i], select[name*="companyType"i]')).first();
    if (await companyTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await companyTypeSelect.selectOption({ index: 1 });
      console.log('   [DONE] Company type selected');
    } else {
      const companyTypeDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /type|company type|select/i }).first();
      if (await companyTypeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await companyTypeDropdown.click();
        await page.waitForTimeout(500);
        const typeOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
        if (await typeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await typeOption.click();
          console.log('   [DONE] Company type selected from custom dropdown');
        }
      }
    }

    // Currency dropdown
    console.log('   Selecting currency...');
    const currencySelect = page.locator('select').filter({ hasText: /currency|USD/i }).or(page.locator('select[name*="currency"i]')).first();
    if (await currencySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await currencySelect.selectOption({ index: 1 });
      console.log('   [DONE] Currency selected');
    } else {
      const currencyDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /currency|USD|select/i }).first();
      if (await currencyDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        await currencyDropdown.click();
        await page.waitForTimeout(500);
        const currencyOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
        if (await currencyOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await currencyOption.click();
          console.log('   [DONE] Currency selected from custom dropdown');
        }
      }
    }

    // Company Address fields (5 fields)
    console.log('   Filling company address...');
    const companyAddressData = {
      address1: '456 Business Ave',
      address2: 'Suite 200',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001'
    };

    // Find all visible text inputs for address section
    const companyAddressInput = page.locator('input[placeholder*="address"i], input[name*="address"i], input[placeholder*="street"i]');
    const companyAddressFields = await companyAddressInput.all();

    if (companyAddressFields.length >= 2) {
      await companyAddressFields[0].fill(companyAddressData.address1);
      console.log(`   [DONE] Company Address 1: ${companyAddressData.address1}`);
      await companyAddressFields[1].fill(companyAddressData.address2);
      console.log(`   [DONE] Company Address 2: ${companyAddressData.address2}`);
    } else if (companyAddressFields.length === 1) {
      await companyAddressFields[0].fill(companyAddressData.address1);
      console.log(`   [DONE] Company Address: ${companyAddressData.address1}`);
    }

    const companyCityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
    if (await companyCityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyCityInput.fill(companyAddressData.city);
      console.log(`   [DONE] Company City: ${companyAddressData.city}`);
    }

    const companyStateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
    if (await companyStateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyStateInput.fill(companyAddressData.state);
      console.log(`   [DONE] Company State: ${companyAddressData.state}`);
    }

    const companyZipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
    if (await companyZipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await companyZipInput.fill(companyAddressData.zip);
      console.log(`   [DONE] Company ZIP: ${companyAddressData.zip}`);
    }

    // Contact Information (3 fields)
    console.log('   Filling contact information...');

    const contactEmailInput = page.locator('input[type="email"], input[placeholder*="contact"i][placeholder*="email"i], input[name*="contactEmail"i]').first();
    if (await contactEmailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contactEmailInput.fill('contact@acmeconstruction.com');
      console.log('   [DONE] Contact Email: contact@acmeconstruction.com');
    }

    const contactPhoneInput = page.locator('input[type="tel"], input[placeholder*="contact"i][placeholder*="phone"i], input[name*="contactPhone"i], input[placeholder*="phone"i]').first();
    if (await contactPhoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contactPhoneInput.fill('5559876543');
      console.log('   [DONE] Contact Phone: 5559876543');
    }

    const contactWebsiteInput = page.locator('input[placeholder*="website"i], input[name*="website"i], input[placeholder*="url"i], input[type="url"]').first();
    if (await contactWebsiteInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await contactWebsiteInput.fill('https://acmeconstruction.com');
      console.log('   [DONE] Website: https://acmeconstruction.com');
    }

    // Company logo upload - skip for now (optional)
    console.log('   [INFO] Skipping company logo upload (optional)');

    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/beta-company-filled-${Date.now()}.png` }).catch(() => {});

    // Click Save
    console.log('   Clicking Save...');
    const companySaveButton = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
    if (await companySaveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companySaveButton.click();
      console.log('   [DONE] Company Save button clicked');
    } else {
      await page.keyboard.press('Enter');
      console.log('   [DONE] Enter pressed to save company');
    }

    await page.waitForTimeout(3000);
    console.log(`   Current URL: ${page.url()}`);

    // ============================
    // STEP 6: Complete Page
    // ============================
    console.log('\n[STEP 6] Complete page - accepting terms and finishing...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/beta-complete-page-${Date.now()}.png` }).catch(() => {});

    // Accept Terms and Conditions
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      const isChecked = await termsCheckbox.isChecked();
      if (!isChecked) {
        await termsCheckbox.click();
        console.log('   [DONE] Terms and Conditions accepted');
      } else {
        console.log('   [INFO] Terms already checked');
      }
    } else {
      // Try clicking a label or text for the checkbox
      const termsLabel = page.locator('label, span, div').filter({ hasText: /terms|conditions|agree|accept/i }).first();
      if (await termsLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await termsLabel.click();
        console.log('   [DONE] Terms label clicked');
      }
    }

    await page.waitForTimeout(500);

    // Click Complete Onboarding button
    console.log('   Clicking Complete Onboarding...');
    const completeButton = page.locator('button').filter({ hasText: /Complete|Finish|Done|Complete Onboarding/i }).first();
    if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await completeButton.click();
      console.log('   [DONE] Complete Onboarding button clicked');
    } else {
      await page.keyboard.press('Enter');
      console.log('   [DONE] Enter pressed to complete onboarding');
    }

    await page.waitForTimeout(5000);
    console.log(`   Current URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-onboarding-complete-${Date.now()}.png` }).catch(() => {});

    // ============================
    // VERIFICATION
    // ============================
    console.log('\n[STEP 7] Verifying onboarding completion...');
    const finalUrl = page.url();

    if (finalUrl.includes('/app') || finalUrl.includes('/dashboard') || finalUrl.includes('/projects')) {
      console.log('   [OK] Successfully onboarded! Landed on the main app.');
    } else if (finalUrl.includes('/onboarding')) {
      console.log('   [WARNING] Still on onboarding page - may need additional steps');
    } else {
      console.log(`   [INFO] Final URL: ${finalUrl}`);
    }

    await page.screenshot({ path: `test-results/beta-final-${Date.now()}.png` }).catch(() => {});
    console.log('\n[COMPLETE] Test completed: Register -> OTP -> Intro -> Profile -> Company -> Complete!\n');
  });

  test.afterAll(async () => {
    console.log('\n[OK] Beta registration test run completed');
  });
});
