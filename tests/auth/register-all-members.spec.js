/**
 * Step 1: Register Owner + Create Project
 * 
 * - Registers a fresh Owner account using +owner{serial}@gmail.com
 * - Completes full onboarding (profile, company, terms)
 * - Creates a new project under the Owner's company
 * - Saves Owner credentials + invited member emails to .auth/all-members.json
 * 
 * The serial number auto-increments in .auth/run-counter.json so this
 * can be run infinite times with fresh emails.
 * 
 * Usage: npm run test:register-members
 * Next:  npm run test:owner-invite
 */

const { test, expect } = require('@playwright/test');
const { getOTPFromGmail } = require('../../utils/gmail-otp-reader');
const fs = require('fs');
const path = require('path');

const membersData = require('./members.data.json');
const GMAIL_BASE = 'aroradivyansh995';
const GMAIL_DOMAIN = '@gmail.com';
const RESULTS_PATH = path.join(__dirname, '..', '..', '.auth', 'all-members.json');
const COUNTER_PATH = path.join(__dirname, '..', '..', '.auth', 'run-counter.json');

/**
 * Get the next run serial number (1, 2, 3, ...) and save it
 */
function getNextRunNumber() {
  const authDir = path.dirname(COUNTER_PATH);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  let counter = 0;
  if (fs.existsSync(COUNTER_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(COUNTER_PATH, 'utf-8'));
      counter = data.lastRun || 0;
    } catch { counter = 0; }
  }

  counter++;
  fs.writeFileSync(COUNTER_PATH, JSON.stringify({ lastRun: counter, updatedAt: new Date().toISOString() }, null, 2));
  return counter;
}

test.describe.serial('Register Owner + Create Project', () => {
  const runNumber = getNextRunNumber();
  const ownerData = membersData.members.find(m => m.role === 'Owner');
  const ownerEmail = `${GMAIL_BASE}+${ownerData.alias}${runNumber}${GMAIL_DOMAIN}`;
  const password = membersData.password;

  // Build the full member list with emails (Owner = registered, others = pending-invite)
  const allMembers = membersData.members.map(m => ({
    runNumber,
    alias: `${m.alias}${runNumber}`,
    email: `${GMAIL_BASE}+${m.alias}${runNumber}${GMAIL_DOMAIN}`,
    password,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phone,
    role: m.role,
    companyName: m.companyName,
    status: m.role === 'Owner' ? 'registered' : 'pending-invite',
  }));

  test(`Register Owner: ${ownerData.firstName} ${ownerData.lastName} (${ownerEmail})`, async ({ page }) => {
    test.setTimeout(180000);

    console.log(`\n========================================`);
    console.log(`[RUN #${runNumber}] Registering Owner`);
    console.log(`[EMAIL]  ${ownerEmail}`);
    console.log(`========================================`);

    // ---- Registration form ----
    await page.goto('https://beta.superconstruct.io/auth/register', {
      waitUntil: 'domcontentloaded', timeout: 30000,
    });
    await page.waitForTimeout(2000);

    if (page.url().includes('/auth/login')) {
      throw new Error(`Redirected to login - "${ownerEmail}" may already be registered.`);
    }

    await page.locator('input[placeholder="First name"]').fill(ownerData.firstName);
    await page.locator('input[placeholder="Last name"]').fill(ownerData.lastName);
    await page.locator('input[type="email"]').fill(ownerEmail);
    await page.locator('input[placeholder="Phone Number"]').fill(ownerData.phone);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);

    await page.locator('button').filter({ hasText: /Register|Sign Up|Create Account/i }).first().click();
    console.log('   [DONE] Registration form submitted');
    await page.waitForTimeout(3000);

    // ---- OTP ----
    if (page.url().includes('/otp')) {
      console.log('   [OTP] Verification required...');
      const otp = await getOTPFromGmail(ownerEmail, 60000);
      console.log(`   [OTP] Code: ${otp}`);

      const otpInputs = await page.locator('input[type="text"]').all();
      const digits = otp.split('');
      for (let i = 0; i < digits.length && i < otpInputs.length; i++) {
        await otpInputs[i].fill(digits[i]);
        await page.waitForTimeout(200);
      }
      await page.waitForTimeout(1000);
      const verifyBtn = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
      if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) await verifyBtn.click();
      await page.waitForTimeout(3000);
    }

    // ---- Onboarding: Introduction ----
    console.log('   [ONBOARD] Introduction...');
    await page.waitForTimeout(2000);
    const nextBtn = page.locator('button').filter({ hasText: /Next|Continue|Get Started/i }).first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) await nextBtn.click();
    await page.waitForTimeout(2000);

    // ---- Onboarding: Profile ----
    console.log('   [ONBOARD] Profile...');
    await page.waitForTimeout(2000);
    const addrInput = page.locator('input[placeholder*="address"i], input[name*="address"i], input[placeholder*="street"i]').first();
    if (await addrInput.isVisible({ timeout: 3000 }).catch(() => false)) await addrInput.fill('123 Test St');
    const cityInput = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
    if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) await cityInput.fill('New York');
    const stateInput = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
    if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) await stateInput.fill('NY');
    const zipInput = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
    if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) await zipInput.fill('10001');

    const profileSaveBtn = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
    if (await profileSaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) await profileSaveBtn.click();
    await page.waitForTimeout(3000);

    // ---- Onboarding: Company ----
    console.log('   [ONBOARD] Company...');
    await page.waitForTimeout(2000);
    const compNameInput = page.locator('input[placeholder*="company"i], input[name*="company"i], input[name*="companyName"i]').first();
    if (await compNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await compNameInput.fill(`${ownerData.companyName} ${Date.now()}`);
    }

    const typeDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /type|company type|select/i }).first();
    if (await typeDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeDropdown.click();
      await page.waitForTimeout(500);
      const opt = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
      if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) await opt.click();
    }

    const currDropdown = page.locator('button, div[role="combobox"], [class*="select"]').filter({ hasText: /currency|USD|select/i }).first();
    if (await currDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currDropdown.click();
      await page.waitForTimeout(500);
      const opt = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
      if (await opt.isVisible({ timeout: 2000 }).catch(() => false)) await opt.click();
    }

    const cAddrFields = await page.locator('input[placeholder*="address"i], input[name*="address"i]').all();
    if (cAddrFields.length >= 1) await cAddrFields[0].fill('456 Business Ave');
    if (cAddrFields.length >= 2) await cAddrFields[1].fill('Suite 100');
    const cCity = page.locator('input[placeholder*="city"i], input[name*="city"i]').first();
    if (await cCity.isVisible({ timeout: 2000 }).catch(() => false)) await cCity.fill('Los Angeles');
    const cState = page.locator('input[placeholder*="state"i], input[name*="state"i]').first();
    if (await cState.isVisible({ timeout: 2000 }).catch(() => false)) await cState.fill('CA');
    const cZip = page.locator('input[placeholder*="zip"i], input[name*="zip"i], input[placeholder*="postal"i]').first();
    if (await cZip.isVisible({ timeout: 2000 }).catch(() => false)) await cZip.fill('90001');

    const companySaveBtn = page.locator('button').filter({ hasText: /Save|Next|Continue/i }).first();
    if (await companySaveBtn.isVisible({ timeout: 5000 }).catch(() => false)) await companySaveBtn.click();
    await page.waitForTimeout(3000);

    // ---- Onboarding: Complete ----
    console.log('   [ONBOARD] Complete...');
    await page.waitForTimeout(2000);
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (!(await termsCheckbox.isChecked())) await termsCheckbox.click();
    }
    await page.waitForTimeout(500);
    const completeBtn = page.locator('button').filter({ hasText: /Complete|Finish|Done|Complete Onboarding/i }).first();
    if (await completeBtn.isVisible({ timeout: 5000 }).catch(() => false)) await completeBtn.click();
    await page.waitForTimeout(5000);

    console.log(`   [DONE] Owner registered. URL: ${page.url()}`);

    // ---- Save all member data ----
    allMembers.find(m => m.role === 'Owner').registeredAt = new Date().toISOString();

    const authDir = path.dirname(RESULTS_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(allMembers, null, 2));
    console.log(`   [SAVED] all-members.json with ${allMembers.length} members`);
    console.log(`   Owner: ${ownerEmail} (registered)`);
    allMembers.filter(m => m.role !== 'Owner').forEach(m =>
      console.log(`   ${m.role}: ${m.email} (${m.status})`)
    );

    // ======== CREATE PROJECT (same session, no login needed) ========
    console.log(`\n[PROJECT] Creating project in the same session...`);

    // After onboarding the Owner should land on the company/projects page
    // Select the company if we're on a company-selection screen
    await page.waitForTimeout(3000);
    const companyImages = page.getByRole('img');
    const compCount = await companyImages.count();
    for (let i = 0; i < compCount; i++) {
      const img = companyImages.nth(i);
      const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
      if (name && name !== 'SuperConstruct logo') {
        await img.click();
        console.log(`   [DONE] Company: "${name}"`);
        break;
      }
    }
    await page.waitForURL('**/projects**', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // ---- Create New Project ----
    console.log('   [PROJECT] Creating new project...');
    await page.getByRole('button', { name: 'New Project' }).first().click();
    await page.waitForTimeout(2000);

    // Project Type
    await page.locator('.select-dropdown-indicator > svg').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Commercial', exact: true }).click();

    // Project Name
    const projectName = `Project Run${runNumber} ${Date.now()}`;
    await page.getByRole('textbox', { name: 'Enter project name' }).fill(projectName);
    console.log(`   [DONE] Project Name: ${projectName}`);

    // Project Number
    await page.getByRole('textbox', { name: 'Enter project number' }).fill(String(Math.floor(Math.random() * 9000) + 1000));

    // Budget + Contingency
    await page.getByRole('textbox', { name: 'Enter budget' }).fill('100000');
    await page.getByRole('textbox', { name: 'Enter Contingency Budget' }).fill('10000');

    // Description
    await page.getByRole('textbox', { name: 'Enter project description' }).fill(`Automated test project - Run #${runNumber}`);

    // Work Days
    await page.locator('.select-input-container.visible.select__input-container.css-p665u').first().click();
    await page.waitForTimeout(500);
    await page.getByText('Mon, Tue, Wed, Thu, Fri (5').click();

    // Dates
    await page.getByRole('textbox', { name: 'Select start date' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '11' }).click();
    await page.getByRole('textbox', { name: 'Select end date' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: '27' }).nth(1).click();

    // Daily Log
    await page.getByRole('radio', { name: 'Optional' }).check();

    // Address
    await page.getByRole('textbox', { name: 'Enter street address' }).fill('123 Construction Blvd');
    await page.getByRole('textbox', { name: 'Enter city' }).fill('New York');
    await page.getByRole('textbox', { name: 'Enter state' }).fill('NY');
    await page.getByRole('textbox', { name: 'Enter ZIP code' }).fill('10001');

    // Role
    await page.locator('div').filter({ hasText: /^Select your role$/ }).nth(3).click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'General Contractor' }).click();

    // Publish
    console.log('   [PROJECT] Publishing...');
    await page.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(5000);
    console.log(`   [DONE] Project created. URL: ${page.url()}`);
  });
});
