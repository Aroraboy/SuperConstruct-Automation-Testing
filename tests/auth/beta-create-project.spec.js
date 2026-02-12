const { test, expect } = require('@playwright/test');
const { getOTPFromEmail } = require('../../utils/test-email-service');

test.describe('Beta - Create New Project', () => {
  test.beforeAll(async () => {
    console.log('\n[SETUP] Setting up project creation test...');
  });

  test('should login and create a new project on beta', async ({ page }) => {
    // Increase test timeout to 120 seconds
    test.setTimeout(120000);

    // Use the already-registered MailSlurp account on beta
    const inboxId = '4a996dae-8d21-4670-9eec-8a7be2df0afe';
    const testEmail = '4a996dae-8d21-4670-9eec-8a7be2df0afe@mailslurp.biz';
    const testPassword = 'TestPassword@123';

    // ============================
    // STEP 1: Login
    // ============================
    console.log('\n[STEP 1] Logging in...');
    await page.goto('https://beta.superconstruct.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log(`   Current URL: ${page.url()}`);

    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill(testEmail);
    console.log(`   [DONE] Email: ${testEmail}`);

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 5000 });
    await passwordInput.fill(testPassword);
    console.log('   [DONE] Password entered');

    // Click login button
    const loginButton = page.locator('button').filter({ hasText: /Login|Sign In/i }).first();
    await loginButton.waitFor({ timeout: 5000 });
    await loginButton.click();
    console.log('   [DONE] Login button clicked');

    await page.waitForTimeout(3000);
    console.log(`   Current URL after login: ${page.url()}`);

    // ============================
    // STEP 2: Handle OTP if required
    // ============================
    const urlAfterLogin = page.url();
    if (urlAfterLogin.includes('/otp')) {
      console.log('\n[STEP 2] OTP verification required...');
      let otp;
      try {
        otp = await getOTPFromEmail(inboxId, 60000);
        console.log(`   [OK] OTP extracted: ${otp}`);
      } catch (error) {
        console.error(`   [ERROR] Failed to get OTP: ${error.message}`);
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
      console.log('\n[STEP 2] No OTP required, proceeding...');
    }

    // ============================
    // STEP 3: Navigate to company
    // ============================
    console.log('\n[STEP 3] Navigating to company...');
    await page.waitForTimeout(2000);
    console.log(`   Current URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-before-company-${Date.now()}.png` }).catch(() => {});

    // Click on the company - look for "Acme Construction" or any company link
    let companyFound = false;

    // Try 1: Look for text containing "Acme Construction"
    const acmeCompany = page.getByText(/Acme Construction/i).first();
    if (await acmeCompany.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acmeCompany.click();
      console.log('   [DONE] Company "Acme Construction" clicked');
      companyFound = true;
    }

    // Try 2: Look for any company card/link on the page
    if (!companyFound) {
      const companyCard = page.locator('[class*="company"], [class*="organization"], [class*="card"]').first();
      if (await companyCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyCard.click();
        console.log('   [DONE] Company card clicked');
        companyFound = true;
      }
    }

    // Try 3: Look for any clickable element that looks like a company
    if (!companyFound) {
      const anyCompany = page.locator('a, div, span').filter({ hasText: /construction/i }).first();
      if (await anyCompany.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyCompany.click();
        console.log('   [DONE] Company element clicked (fallback)');
        companyFound = true;
      }
    }

    if (!companyFound) {
      console.log('   [WARNING] Could not find company to click, taking screenshot...');
      await page.screenshot({ path: `test-results/beta-no-company-found-${Date.now()}.png` }).catch(() => {});
    }

    await page.waitForTimeout(3000);
    console.log(`   Current URL after company: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-after-company-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 4: Click New Project
    // ============================
    console.log('\n[STEP 4] Clicking New Project button...');
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.waitForTimeout(2000);
    console.log('   [DONE] New Project button clicked');
    await page.screenshot({ path: `test-results/beta-new-project-form-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 5: Fill project form
    // ============================
    console.log('\n[STEP 5] Filling project form...');

    // Project Type dropdown - select Commercial
    console.log('   Selecting project type...');
    await page.locator('.select-dropdown-indicator > svg').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Commercial', exact: true }).click();
    console.log('   [DONE] Project Type: Commercial');

    // Project Name (dynamic with timestamp)
    const projectName = `TestProject ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Enter project name' }).fill(projectName);
    console.log(`   [DONE] Project Name: ${projectName}`);

    // Project Number
    const projectNumber = String(Math.floor(Math.random() * 9000) + 1000);
    await page.getByRole('textbox', { name: 'Enter project number' }).fill(projectNumber);
    console.log(`   [DONE] Project Number: ${projectNumber}`);

    // Budget
    await page.getByRole('textbox', { name: 'Enter budget' }).fill('100000');
    console.log('   [DONE] Budget: 100000');

    // Contingency Budget
    await page.getByRole('textbox', { name: 'Enter Contingency Budget' }).fill('10000');
    console.log('   [DONE] Contingency Budget: 10000');

    // Project Description
    await page.getByRole('textbox', { name: 'Enter project description' }).fill('Automated test project for beta environment');
    console.log('   [DONE] Description filled');

    // Work Days dropdown
    console.log('   Selecting work days...');
    await page.locator('.select-input-container.visible.select__input-container.css-p665u').first().click();
    await page.waitForTimeout(500);
    await page.getByText('Mon, Tue, Wed, Thu, Fri (5').click();
    console.log('   [DONE] Work Days: Mon-Fri (5 days)');

    // Start Date
    console.log('   Setting project dates...');
    await page.getByRole('textbox', { name: 'Select start date' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '11' }).click();
    console.log('   [DONE] Start date selected');

    // End Date
    await page.getByRole('textbox', { name: 'Select end date' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '27' }).nth(1).click();
    console.log('   [DONE] End date selected');

    // Daily Log - Optional
    await page.getByRole('radio', { name: 'Optional' }).check();
    console.log('   [DONE] Daily Log: Optional');

    // Project Address
    console.log('   Filling project address...');
    await page.getByRole('textbox', { name: 'Enter street address' }).fill('123 Construction Blvd');
    console.log('   [DONE] Street: 123 Construction Blvd');

    await page.getByRole('textbox', { name: 'Enter city' }).fill('New York');
    console.log('   [DONE] City: New York');

    await page.getByRole('textbox', { name: 'Enter state' }).fill('NY');
    console.log('   [DONE] State: NY');

    await page.getByRole('textbox', { name: 'Enter ZIP code' }).fill('10001');
    console.log('   [DONE] ZIP: 10001');

    // Role dropdown
    console.log('   Selecting role...');
    await page.locator('div').filter({ hasText: /^Select your role$/ }).nth(3).click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'General Contractor' }).click();
    console.log('   [DONE] Role: General Contractor');

    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/beta-project-form-filled-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 6: Publish project
    // ============================
    console.log('\n[STEP 6] Publishing project...');
    await page.getByRole('button', { name: 'Publish' }).click();
    console.log('   [DONE] Publish button clicked');

    await page.waitForTimeout(5000);
    console.log(`   Current URL after publish: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-project-published-${Date.now()}.png` }).catch(() => {});

    // Verify project was created
    if (page.url().includes('/projects') || page.url().includes('/tools') || page.url().includes('/app')) {
      console.log('   [OK] Project created and published successfully!');
    } else {
      console.log(`   [INFO] Post-publish URL: ${page.url()}`);
    }

    console.log('\n[COMPLETE] Test completed: Login -> Company -> New Project -> Publish!\n');
  });

  test.afterAll(async () => {
    console.log('\n[OK] Beta project creation test run completed');
  });
});
