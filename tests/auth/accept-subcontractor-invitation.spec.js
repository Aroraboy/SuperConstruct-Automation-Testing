/**
 * Sub Contractor Accepts Invitation — onboards with company creation + accepts project
 *
 * Flow (same as Owner acceptance):
 *   1. Navigate to invite link (/auth/register/otp?token=...)
 *   2. Enter 6-digit OTP into textbox fields
 *   3. Set Password + Confirm Password → "Set Password"
 *   4. Click "Next" (intro page)
 *   5. Profile: Timezone (svg dropdown), Phone, Address (autocomplete),
 *      City, State, Postal Code → "Save"
 *   6. Company: Company name, Company type (svg dropdown), Street address
 *      (autocomplete), City, State → "Save"
 *   7. Terms checkbox → "Complete Onboarding"
 *   8. Click GC company image → project heading → "Accept Invitation"
 *   9. Click Members link (verification)
 *
 * Key differences from regular member accept:
 *   - Has a COMPANY CREATION step (step 6) — same as Owner
 *   - After onboarding, must click "Accept Invitation" on the project page
 *
 * Prerequisites: Run gc-invite-subcontractor first
 * Reads sub contractor data from .auth/gc-invited-subcontractor.json
 * Reads invite link + OTP from Gmail via IMAP
 *
 * Usage: npm run test:gc-subcontractor-accept
 */

const { test, expect } = require('@playwright/test');
const { getInviteDataFromGmail } = require('../../utils/gmail-invite-reader');
const fs = require('fs');
const path = require('path');

const SUBCONTRACTOR_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-subcontractor.json');
const ACCEPTED_SUBCONTRACTOR_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-accepted-subcontractor.json');
const RUN_COUNTER_PATH = path.join(__dirname, '..', '..', '.auth', 'run-counter.json');
const DEFAULT_PASSWORD = 'Test@Password123';

function getRunNumber() {
  if (fs.existsSync(RUN_COUNTER_PATH)) {
    return JSON.parse(fs.readFileSync(RUN_COUNTER_PATH, 'utf-8')).lastRun || 0;
  }
  return 0;
}

function loadSubContractorData() {
  if (!fs.existsSync(SUBCONTRACTOR_PATH)) {
    throw new Error('Invited sub contractor not found. Run "npm run test:gc-invite-subcontractor" first.');
  }
  return JSON.parse(fs.readFileSync(SUBCONTRACTOR_PATH, 'utf-8'));
}

/**
 * Clean up old .auth files from previous runs.
 * Keeps: run-counter.json, sov-counter.json, and files matching the current run number.
 * Only called after the entire GC flow completes successfully.
 */
function cleanupOldAuthFiles(authDir, currentRun) {
  const keepFiles = ['run-counter.json', 'sov-counter.json'];
  const currentRunStr = String(currentRun);
  try {
    const files = fs.readdirSync(authDir);
    let removed = 0;
    for (const file of files) {
      if (keepFiles.includes(file)) continue;
      // Keep files that belong to the current run (contain the run number)
      if (file.includes(currentRunStr)) continue;
      // Keep files without a run number (generic state files created this run)
      const hasRunNumber = /\d{2,}/.test(file);
      if (!hasRunNumber) continue;
      const filePath = path.join(authDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[CLEANUP] Removed ${removed} old .auth files from previous runs (kept run #${currentRun})`);
    }
  } catch (e) {
    console.log(`[CLEANUP] Warning: ${e.message}`);
  }
}

test.describe.serial('Sub Contractor Accepts Invitation', () => {
  let sub;

  test.beforeAll(async () => {
    sub = loadSubContractorData();
    console.log(`\n[SETUP] Sub Contractor: ${sub.email}`);
    console.log(`[SETUP] Name: ${sub.firstName} ${sub.lastName}`);
  });

  test('Sub Contractor accepts invitation and onboards', async ({ browser }) => {
    test.setTimeout(240000); // 4 minutes

    console.log('\n============================================================');
    console.log(`[SUB CONTRACTOR] ${sub.firstName} ${sub.lastName}`);
    console.log(`[EMAIL] ${sub.email}`);
    console.log('============================================================');

    // ---- STEP 1: Fetch invite data from Gmail ----
    console.log('\n[STEP 1] Fetching invite data from Gmail...');
    const inviteData = await getInviteDataFromGmail(sub.email, 90000);
    console.log(`   [OK] Invite link: ${inviteData.link}`);
    console.log(`   [OK] OTP: ${inviteData.otp}`);

    // Create a fresh browser context (no storageState)
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // ---- STEP 2: Navigate to invite link ----
      console.log('\n[STEP 2] Navigating to invite link...');
      await page.goto(inviteData.link, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      console.log(`   URL: ${page.url()}`);

      // ---- STEP 3: Enter OTP ----
      console.log('\n[STEP 3] Entering OTP...');
      const otpDigits = inviteData.otp.split('');
      for (let i = 0; i < otpDigits.length; i++) {
        await page.getByRole('textbox').nth(i).fill(otpDigits[i]);
        await page.waitForTimeout(200);
      }
      console.log(`   [DONE] OTP entered: ${inviteData.otp}`);
      await page.waitForTimeout(3000);

      // ---- STEP 4: Set Password ----
      console.log('\n[STEP 4] Setting password...');
      await page.getByRole('textbox', { name: 'Password*', exact: true }).click();
      await page.getByRole('textbox', { name: 'Password*', exact: true }).fill(DEFAULT_PASSWORD);
      console.log(`   [DONE] Password: ${DEFAULT_PASSWORD}`);

      await page.getByRole('textbox', { name: 'Confirm Password*' }).click();
      await page.getByRole('textbox', { name: 'Confirm Password*' }).fill(DEFAULT_PASSWORD);
      console.log('   [DONE] Confirm Password filled');

      await page.getByRole('button', { name: 'Set Password' }).click();
      console.log('   [DONE] Set Password clicked');
      await page.waitForTimeout(3000);
      console.log(`   URL after password: ${page.url()}`);

      // ---- STEP 5: Onboarding intro — click Next ----
      console.log('\n[STEP 5] Onboarding intro — clicking Next...');
      await page.getByRole('button', { name: 'Next' }).click();
      console.log('   [DONE] Next clicked');
      await page.waitForTimeout(2000);

      // ---- STEP 6: Profile page ----
      console.log('\n[STEP 6] Filling profile...');

      // Timezone (svg dropdown — 2nd svg)
      await page.locator('svg').nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByRole('option', { name: 'America/New_York' }).click();
      console.log('   [DONE] Timezone: America/New_York');

      // Phone Number
      await page.getByRole('textbox', { name: 'Phone Number' }).click();
      await page.getByRole('textbox', { name: 'Phone Number' }).fill('5559876543');
      console.log('   [DONE] Phone: 5559876543');

      // Address with autocomplete
      await page.getByRole('textbox', { name: 'Address' }).click();
      await page.getByRole('textbox', { name: 'Address' }).fill('texas');
      await page.waitForTimeout(2000);
      await page.getByText('USA', { exact: true }).click();
      console.log('   [DONE] Address: Texas (autocomplete selected)');
      await page.waitForTimeout(1000);

      // City
      await page.getByRole('textbox', { name: 'City' }).click();
      await page.getByRole('textbox', { name: 'City' }).fill('Houston');
      console.log('   [DONE] City: Houston');

      // State
      await page.getByRole('textbox', { name: 'State' }).click();
      await page.getByRole('textbox', { name: 'State' }).fill('TX');
      console.log('   [DONE] State: TX');

      // Postal Code
      await page.getByRole('textbox', { name: 'Postal Code' }).click();
      await page.getByRole('textbox', { name: 'Postal Code' }).fill('77001');
      console.log('   [DONE] Postal Code: 77001');

      // Save profile
      await page.getByRole('button', { name: 'Save' }).click();
      console.log('   [DONE] Save clicked');
      await page.waitForTimeout(3000);

      // ---- STEP 7: Company page (Sub Contractor creates company — same as Owner) ----
      console.log('\n[STEP 7] Filling company details (Sub Contractor step)...');

      // Company name
      const runNumber = getRunNumber();
      const companyName = `SC Contractors ${runNumber}`;
      await page.getByRole('textbox', { name: 'Enter company name' }).click();
      await page.getByRole('textbox', { name: 'Enter company name' }).fill(companyName);
      console.log(`   [DONE] Company Name: ${companyName}`);

      // Company type dropdown (3rd svg)
      await page.locator('svg').nth(2).click();
      await page.waitForTimeout(1000);
      await page.getByRole('option', { name: 'Corporation' }).click();
      console.log('   [DONE] Company Type: Corporation');

      // Street address with autocomplete
      await page.getByRole('textbox', { name: 'Enter street address' }).click();
      await page.getByRole('textbox', { name: 'Enter street address' }).fill('12');
      await page.waitForTimeout(2000);
      await page.getByText('Conch StreetPort St. Joe, FL, USA').click();
      console.log('   [DONE] Street Address: 12 Conch Street (autocomplete)');
      await page.waitForTimeout(1000);

      // City
      await page.getByRole('textbox', { name: 'Enter city' }).click();
      await page.getByRole('textbox', { name: 'Enter city' }).fill('Port St. Joe');
      console.log('   [DONE] City: Port St. Joe');

      // State
      await page.getByRole('textbox', { name: 'Enter state or province' }).click();
      await page.getByRole('textbox', { name: 'Enter state or province' }).fill('FL');
      console.log('   [DONE] State: FL');

      // Save company
      await page.getByRole('button', { name: 'Save' }).click();
      console.log('   [DONE] Company Save clicked');
      await page.waitForTimeout(3000);

      // ---- STEP 8: Terms & Complete Onboarding ----
      console.log('\n[STEP 8] Accepting terms and completing onboarding...');
      await page.getByRole('checkbox', { name: 'I agree to the Terms and' }).check();
      console.log('   [DONE] Terms checkbox checked');

      await page.getByRole('button', { name: 'Complete Onboarding' }).click();
      console.log('   [DONE] Complete Onboarding clicked');
      await page.waitForTimeout(5000);
      console.log(`   URL after onboarding: ${page.url()}`);

      // ---- STEP 9: Accept project invitation ----
      console.log('\n[STEP 9] Accepting project invitation...');

      // Click GC company image
      const companyImg = page.getByRole('img', { name: /GC Construction/i });
      await companyImg.waitFor({ state: 'visible', timeout: 15000 });
      await companyImg.click();
      console.log('   [DONE] GC Company clicked');
      await page.waitForTimeout(3000);

      // Click project heading
      const projectHeading = page.getByRole('heading', { name: /TestProject/i });
      await projectHeading.waitFor({ state: 'visible', timeout: 15000 });
      await projectHeading.click();
      console.log('   [DONE] Project clicked');
      await page.waitForTimeout(3000);

      // Click Accept Invitation
      const acceptBtn = page.getByRole('button', { name: 'Accept Invitation' });
      await acceptBtn.waitFor({ state: 'visible', timeout: 15000 });
      await acceptBtn.click();
      console.log('   [DONE] Accept Invitation clicked');
      await page.waitForTimeout(5000);

      // Click Members link to verify
      await page.getByRole('link').nth(3).click();
      console.log('   [DONE] Members link clicked');
      await page.waitForTimeout(3000);

      console.log(`   Final URL: ${page.url()}`);
      await page.screenshot({ path: `test-results/subcontractor-accepted-${Date.now()}.png` }).catch(() => {});

      console.log('\n[OK] Sub Contractor accepted invitation and joined the project!');

      // ---- Save sub contractor storageState for later reuse ----
      const subStoragePath = path.join(__dirname, '..', '..', '.auth', 'subcontractor-storage-state.json');
      await context.storageState({ path: subStoragePath });
      console.log(`\n[SAVED] Sub Contractor StorageState -> .auth/subcontractor-storage-state.json`);

      // ---- Save accepted sub contractor data ----
      const acceptedSub = {
        ...sub,
        status: 'accepted',
        password: DEFAULT_PASSWORD,
        storagePath: '.auth/subcontractor-storage-state.json',
        acceptedAt: new Date().toISOString(),
      };

      const authDir = path.dirname(ACCEPTED_SUBCONTRACTOR_PATH);
      if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
      fs.writeFileSync(ACCEPTED_SUBCONTRACTOR_PATH, JSON.stringify(acceptedSub, null, 2));
      console.log(`\n[SAVED] Accepted sub contractor -> .auth/gc-accepted-subcontractor.json`);

      // ---- Cleanup old .auth files from previous runs (only on successful completion) ----
      cleanupOldAuthFiles(path.dirname(ACCEPTED_SUBCONTRACTOR_PATH), sub.runNumber);

      console.log('\n[COMPLETE] Sub Contractor onboarded + accepted project invitation!\n');

    } finally {
      await context.close();
    }
  });
});
