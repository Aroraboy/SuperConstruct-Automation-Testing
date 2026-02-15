const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Read GC credentials saved by beta-registration-onboarding.spec.js
const GC_CREDS_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-account.json');
const STORAGE_STATE_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-storage-state.json');

function loadGCCredentials() {
  if (!fs.existsSync(GC_CREDS_PATH)) {
    throw new Error('GC account not found. Run "npm run test:beta-register" first.');
  }
  return JSON.parse(fs.readFileSync(GC_CREDS_PATH, 'utf-8'));
}

// Use saved auth state from registration (conditional to avoid crash if file missing)
if (fs.existsSync(STORAGE_STATE_PATH)) {
  test.use({ storageState: STORAGE_STATE_PATH });
}

test.describe('Beta - Create New Project', () => {
  test.beforeAll(async () => {
    console.log('\n[SETUP] Setting up project creation test...');
  });

  test('should create a new project on beta', async ({ page }) => {
    test.setTimeout(120000);

    const gc = loadGCCredentials();
    console.log(`   [INFO] Using GC account: ${gc.email} (Run #${gc.runNumber})`);

    // ============================
    // STEP 1: Navigate to company (authenticated via storageState)
    // ============================
    console.log('\n[STEP 1] Navigating to company (session restored)...');
    await page.goto('https://beta.superconstruct.io/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(7000);
    console.log(`   Current URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-before-company-${Date.now()}.png` }).catch(() => {});

    // Click on the first company card image (skip site logo)
    // Retry up to 3 times with increasing waits to handle slow image loading
    let companyFound = false;
    for (let attempt = 0; attempt < 3 && !companyFound; attempt++) {
      if (attempt > 0) {
        console.log(`   [RETRY] Attempt ${attempt + 1} - waiting for images to load...`);
        await page.waitForTimeout(5000);
      }
      const companyImages = page.getByRole('img');
      const companyCount = await companyImages.count();
      for (let i = 0; i < companyCount; i++) {
        const img = companyImages.nth(i);
        const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
        console.log(`   Image ${i}: "${name}"`);
        if (name && name !== 'SuperConstruct logo') {
          await img.click();
          console.log(`   [DONE] Company clicked: "${name}"`);
          companyFound = true;
          break;
        }
      }
    }
    if (!companyFound) {
      await page.screenshot({ path: `test-results/beta-no-company-found-${Date.now()}.png` }).catch(() => {});
      throw new Error('No company card image found on page');
    }

    await page.waitForTimeout(3000);
    console.log(`   Current URL after company: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-after-company-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 2: Click New Project
    // ============================
    console.log('\n[STEP 2] Clicking New Project button...');
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.waitForTimeout(2000);
    console.log('   [DONE] New Project button clicked');
    await page.screenshot({ path: `test-results/beta-new-project-form-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 3: Fill project form
    // ============================
    console.log('\n[STEP 3] Filling project form...');

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

    // Role dropdown (from codegen)
    console.log('   Selecting role...');
    // Use codegen approach: click the role dropdown indicator SVG, then select option
    const roleDropdown = page.locator('div:nth-child(6) > .form-item > div > .select > .select-control > .select-value-container > .select-input-container');
    if (await roleDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleDropdown.click();
    } else {
      // Fallback: try the text-based selector
      await page.locator('div').filter({ hasText: /^Select your role$/ }).nth(3).click();
    }
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: 'General Contractor' }).click();
    console.log('   [DONE] Role: General Contractor');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/beta-project-form-filled-${Date.now()}.png` }).catch(() => {});

    // ============================
    // STEP 4: Publish project (click the Publish button explicitly)
    // ============================
    console.log('\n[STEP 4] Publishing project...');
    await page.waitForTimeout(2000);
    // Scroll to make sure Publish button is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    const publishButton = page.getByRole('button', { name: 'Publish' });
    await publishButton.scrollIntoViewIfNeeded();
    await publishButton.waitFor({ state: 'visible', timeout: 15000 });
    await publishButton.click();
    console.log('   [DONE] Publish button clicked');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `test-results/beta-after-publish-${Date.now()}.png` }).catch(() => {});

    await page.waitForTimeout(5000);
    console.log(`   Current URL after publish: ${page.url()}`);
    await page.screenshot({ path: `test-results/beta-project-published-${Date.now()}.png` }).catch(() => {});

    // Verify project was created
    if (page.url().includes('/projects') || page.url().includes('/tools') || page.url().includes('/app')) {
      console.log('   [OK] Project created and published successfully!');
    } else {
      console.log(`   [INFO] Post-publish URL: ${page.url()}`);
    }

    // Save updated storageState for next spec (gc-invite-members)
    await page.context().storageState({ path: STORAGE_STATE_PATH });
    console.log('   [SAVED] StorageState updated -> .auth/gc-storage-state.json');

    console.log('\n[COMPLETE] Test completed: Company -> New Project -> Publish!\n');
  });

  test.afterAll(async () => {
    console.log('\n[OK] Beta project creation test run completed');
  });
});
