/**
 * GC Invites an Owner to the Project
 *
 * Prerequisites: Run the GC flow first (register → project → invite → accept → add)
 *
 * Flow (from codegen):
 *   1. Navigate to project Members page (via storageState)
 *   2. Click Add Member
 *   3. Fill Email, First Name, Last Name
 *   4. Select "Owner" role from dropdown
 *   5. Click "Invite Member"
 *
 * This is different from member invites:
 *   - Members: Add Member → Add From Company → Invite Member → Send Invitation
 *   - Owner:   Add Member → fill form directly → select Owner role → Invite Member
 *
 * Usage: npm run test:gc-invite-owner
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GMAIL_BASE = 'aroradivyansh995';
const GMAIL_DOMAIN = '@gmail.com';
const GC_CREDS_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-account.json');
const OWNER_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-owner.json');

function loadGCCredentials() {
  if (!fs.existsSync(GC_CREDS_PATH)) {
    throw new Error('GC account not found. Run the GC flow first.');
  }
  return JSON.parse(fs.readFileSync(GC_CREDS_PATH, 'utf-8'));
}

test.describe.serial('GC Invites Owner to Project', () => {
  let gc;
  let ownerEmail;
  let runNumber;

  test.beforeAll(async () => {
    gc = loadGCCredentials();
    runNumber = gc.runNumber;
    ownerEmail = `${GMAIL_BASE}+owner${runNumber}${GMAIL_DOMAIN}`;
    console.log(`\n[SETUP] GC: ${gc.email} (Run #${runNumber})`);
    console.log(`[SETUP] Inviting Owner: ${ownerEmail}`);
  });

  test('GC invites owner to project', async ({ page }) => {
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

    // ---- STEP 3: Fill owner details ----
    console.log('\n[STEP 3] Filling owner details...');

    await page.getByRole('textbox', { name: 'Email', exact: true }).click();
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(ownerEmail);
    console.log(`   [DONE] Email: ${ownerEmail}`);

    await page.getByRole('textbox', { name: 'First Name' }).click();
    await page.getByRole('textbox', { name: 'First Name' }).fill('Project');
    console.log('   [DONE] First Name: Project');

    await page.getByRole('textbox', { name: 'Last Name' }).click();
    await page.getByRole('textbox', { name: 'Last Name' }).fill('Owner');
    console.log('   [DONE] Last Name: Owner');

    // ---- STEP 4: Select Owner role ----
    console.log('\n[STEP 4] Selecting Owner role...');
    await page.locator('.select-dropdown-indicator > svg').click();
    await page.waitForTimeout(1000);
    await page.getByRole('option', { name: 'Owner' }).click();
    console.log('   [DONE] Role: Owner');
    await page.waitForTimeout(1000);

    // ---- STEP 5: Click Invite Member ----
    console.log('\n[STEP 5] Sending invitation...');
    await page.screenshot({ path: `test-results/gc-invite-owner-before-${Date.now()}.png` }).catch(() => {});

    await page.getByRole('button', { name: 'Invite Member' }).click();
    console.log('   [DONE] Invite Member clicked');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `test-results/gc-invite-owner-after-${Date.now()}.png` }).catch(() => {});
    console.log(`   URL: ${page.url()}`);

    // ---- Save owner data ----
    const ownerData = {
      email: ownerEmail,
      firstName: 'Project',
      lastName: 'Owner',
      role: 'Owner',
      status: 'invited',
      runNumber,
      invitedAt: new Date().toISOString(),
    };

    const authDir = path.dirname(OWNER_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(OWNER_PATH, JSON.stringify(ownerData, null, 2));
    console.log(`\n[SAVED] Owner data -> .auth/gc-invited-owner.json`);
    console.log('\n[COMPLETE] Owner invited to project!\n');
  });
});
