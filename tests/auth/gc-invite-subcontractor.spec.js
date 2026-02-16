/**
 * GC Invites a Sub Contractor to the Project
 *
 * Prerequisites: Run the GC flow first (register → project → invite → accept → add → members accept → invite owner → owner accept)
 *
 * Flow (same as Owner invitation):
 *   1. Navigate to project Members page (via storageState)
 *   2. Click Add Member
 *   3. Fill Email, First Name, Last Name
 *   4. Select "Sub Contractor" role from dropdown
 *   5. Click "Invite Member"
 *
 * Usage: npm run test:gc-invite-subcontractor
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GMAIL_BASE = 'aroradivyansh995';
const GMAIL_DOMAIN = '@gmail.com';
const GC_CREDS_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-account.json');
const SUBCONTRACTOR_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-subcontractor.json');

function loadGCCredentials() {
  if (!fs.existsSync(GC_CREDS_PATH)) {
    throw new Error('GC account not found. Run the GC flow first.');
  }
  return JSON.parse(fs.readFileSync(GC_CREDS_PATH, 'utf-8'));
}

test.describe.serial('GC Invites Sub Contractor to Project', () => {
  let gc;
  let subEmail;
  let runNumber;

  test.beforeAll(async () => {
    gc = loadGCCredentials();
    runNumber = gc.runNumber;
    subEmail = `${GMAIL_BASE}+siteengineer${runNumber}${GMAIL_DOMAIN}`;
    console.log(`\n[SETUP] GC: ${gc.email} (Run #${runNumber})`);
    console.log(`[SETUP] Inviting Sub Contractor: ${subEmail}`);
  });

  test('GC invites sub contractor to project', async ({ page }) => {
    test.setTimeout(120000);

    // ---- STEP 1: Navigate to project Members page ----
    console.log('\n[STEP 1] Navigating to project Members page...');
    await page.goto('https://beta.superconstruct.io/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // Click company image
    const companyImg = page.getByRole('img', { name: /GC Construction/i });
    await companyImg.waitFor({ state: 'visible', timeout: 15000 });
    await companyImg.click();
    console.log('   [DONE] Company clicked');
    await page.waitForTimeout(5000);

    // Click project image
    const projectImg = page.getByRole('img', { name: /TestProject/i });
    await projectImg.waitFor({ state: 'visible', timeout: 15000 });
    await projectImg.click();
    console.log('   [DONE] Project clicked');
    await page.waitForTimeout(5000);

    // Navigate to Members (4th link, index 3)
    await page.getByRole('link').nth(3).click();
    console.log('   [DONE] Members link clicked');
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 2: Click Add Member ----
    console.log('\n[STEP 2] Opening Add Member form...');
    const addMemberBtn = page.getByRole('button', { name: 'Add Member' });
    await addMemberBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addMemberBtn.click();
    console.log('   [DONE] Add Member clicked');
    await page.waitForTimeout(2000);

    // ---- STEP 3: Fill sub contractor details ----
    console.log('\n[STEP 3] Filling sub contractor details...');

    await page.getByRole('textbox', { name: 'Email', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(subEmail);
    console.log(`   [DONE] Email: ${subEmail}`);

    await page.getByRole('textbox', { name: 'First Name' }).click();
    await page.getByRole('textbox', { name: 'First Name' }).fill('Sub');
    console.log('   [DONE] First Name: Sub');

    await page.getByRole('textbox', { name: 'Last Name' }).click();
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Contractor');
    console.log('   [DONE] Last Name: Contractor');

    // ---- STEP 4: Select Subcontractor role ----
    console.log('\n[STEP 4] Selecting Subcontractor role...');
    await page.locator('.select-dropdown-indicator > svg').click();
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: 'Subcontractor' }).click();
    console.log('   [DONE] Role: Subcontractor');
    await page.waitForTimeout(1000);

    // ---- STEP 4b: Fill company name (appears after selecting Subcontractor role) ----
    const subCompanyName = `SC Contractors ${runNumber}`;
    console.log(`\n[STEP 4b] Filling Sub Contractor company name: ${subCompanyName}`);
    const companyInput = page.getByRole('textbox', { name: /company/i });
    await companyInput.waitFor({ state: 'visible', timeout: 10000 });
    await companyInput.click();
    await companyInput.fill(subCompanyName);
    console.log(`   [DONE] Company Name: ${subCompanyName}`);
    await page.waitForTimeout(1000);

    // ---- STEP 5: Submit invitation ----
    console.log('\n[STEP 5] Sending invitation...');
    await page.screenshot({ path: `test-results/gc-invite-subcontractor-before-${Date.now()}.png` }).catch(() => {});

    await page.getByRole('button', { name: 'Invite Member' }).click();
    console.log('   [DONE] Invite Member button clicked');
    await page.waitForTimeout(1000);

    // Press Enter to confirm submission
    await page.keyboard.press('Enter');
    console.log('   [DONE] Enter pressed to submit');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `test-results/gc-invite-subcontractor-after-${Date.now()}.png` }).catch(() => {});
    console.log(`   URL: ${page.url()}`);

    // ---- Save sub contractor data ----
    const subCompany = `SC Contractors ${runNumber}`;
    const subData = {
      email: subEmail,
      companyName: subCompany,
      alias: `siteengineer${runNumber}`,
      firstName: 'Sub',
      lastName: 'Contractor',
      role: 'Sub Contractor',
      status: 'invited',
      runNumber,
      invitedAt: new Date().toISOString(),
    };

    const authDir = path.dirname(SUBCONTRACTOR_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(SUBCONTRACTOR_PATH, JSON.stringify(subData, null, 2));
    console.log(`\n[SAVED] Sub Contractor data -> .auth/gc-invited-subcontractor.json`);
    console.log('\n[COMPLETE] Sub Contractor invited to project!\n');
  });
});
