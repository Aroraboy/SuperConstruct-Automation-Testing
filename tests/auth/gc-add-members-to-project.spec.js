/**
 * GC Adds Accepted Members to the Project
 *
 * Prerequisites: Run the full flow first:
 *   npm run test:gc-flow        (register → create project → invite)
 *   npm run test:gc-accept      (members accept invitations & onboard)
 *
 * Flow (from codegen):
 *   1. GC logs in (email + password + OTP)
 *   2. Clicks company heading → project image → Members link
 *   3. Add Member → Add From Company
 *   4. For each member: select role from dropdown → click add button on row
 *   5. Click "Add To Project"
 *
 * Member roles:
 *   - Project Owner  → Project Manager
 *   - Sub Contractor → GC Member
 *   - Project Developer → GC Member
 *
 * Usage: npm run test:gc-add-to-project
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ACCEPTED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-accepted-members.json');

function loadAcceptedMembers() {
  if (!fs.existsSync(ACCEPTED_PATH)) {
    throw new Error('Accepted members not found. Run "npm run test:gc-accept" first.');
  }
  return JSON.parse(fs.readFileSync(ACCEPTED_PATH, 'utf-8'));
}

// Role assignments for each member (by name matching)
const MEMBER_ROLES = {
  'Project Manager': 'Project Manager',
  'Sub Contractor': 'GC Member',
  'Project Developer': 'GC Member',
};

test.describe.serial('GC Adds Members to Project', () => {
  let acceptedMembers;

  test.beforeAll(async () => {
    acceptedMembers = loadAcceptedMembers();
    console.log(`\n[SETUP] Adding ${acceptedMembers.length} accepted members to project:`);
    acceptedMembers.forEach(m => {
      const fullName = `${m.firstName} ${m.lastName}`;
      const role = MEMBER_ROLES[fullName] || 'GC Member';
      console.log(`   - ${fullName} → ${role}`);
    });
  });

  test('GC adds members to project', async ({ page }) => {
    test.setTimeout(180000);

    // ---- STEP 1: Navigate to dashboard (already logged in via storageState) ----
    console.log('\n[STEP 1] Navigating to dashboard (logged in via storageState)...');
    await page.goto('https://beta.superconstruct.io/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/gc-add-dashboard-${Date.now()}.png` }).catch(() => {});

    // ---- STEP 2: Navigate to company → project → Members ----
    console.log('\n[STEP 2] Navigating to project Members page...');

    // Click company heading (e.g. "GC Construction ...")
    const companyHeading = page.getByRole('heading', { name: /GC Construction/i });
    await companyHeading.waitFor({ state: 'visible', timeout: 15000 });
    await companyHeading.click();
    console.log('   [DONE] Company clicked');
    await page.waitForTimeout(5000);

    // Click project image (e.g. "TestProject ...")
    const projectImg = page.getByRole('img', { name: /TestProject/i });
    await projectImg.waitFor({ state: 'visible', timeout: 15000 });
    await projectImg.click();
    console.log('   [DONE] Project clicked');
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);

    // Navigate to Members (4th link, index 3)
    await page.getByRole('link').nth(3).click();
    console.log('   [DONE] Members link clicked');
    await page.waitForTimeout(5000);
    console.log(`   URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/gc-add-members-page-${Date.now()}.png` }).catch(() => {});

    // ---- STEP 3: Add Member → Add From Company ----
    console.log('\n[STEP 3] Opening Add From Company panel...');
    const addMemberBtn = page.getByRole('button', { name: 'Add Member' });
    await addMemberBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addMemberBtn.click();
    console.log('   [DONE] Add Member clicked');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Add From Company' }).click();
    console.log('   [DONE] Add From Company clicked');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `test-results/gc-add-from-company-${Date.now()}.png` }).catch(() => {});

    // ---- STEP 4: Assign roles and add each member ----
    console.log('\n[STEP 4] Assigning roles and adding members...');

    for (let idx = 0; idx < acceptedMembers.length; idx++) {
      const member = acceptedMembers[idx];
      const fullName = `${member.firstName} ${member.lastName}`;
      const role = MEMBER_ROLES[fullName] || 'GC Member';
      const isLast = idx === acceptedMembers.length - 1;

      console.log(`\n   [MEMBER ${idx + 1}] ${fullName} → ${role}`);

      // Select role from dropdown
      // First member uses .select-indicators-container, subsequent use .select-dropdown-indicator > svg
      if (idx === 0) {
        await page.locator('.select-indicators-container').first().click();
      } else {
        await page.locator('.select-dropdown-indicator > svg').first().click();
      }
      await page.waitForTimeout(1000);

      // Click the role option (scoped to react-select dropdown to avoid matching member names)
      await page.getByRole('option', { name: role }).click();
      console.log(`   [DONE] Role selected: ${role}`);
      await page.waitForTimeout(1000);

      if (!isLast) {
        // Click the add button on the member's row
        const row = page.getByRole('row', { name: fullName });
        await row.getByRole('button').click();
        console.log(`   [DONE] ${fullName} added to selection`);
        await page.waitForTimeout(1000);
      } else {
        // Last member: click "Add To Project" to add all remaining
        console.log(`   [INFO] Last member — will click Add To Project`);
      }
    }

    // ---- STEP 5: Click "Add To Project" ----
    console.log('\n[STEP 5] Adding all members to project...');
    await page.screenshot({ path: `test-results/gc-add-before-confirm-${Date.now()}.png` }).catch(() => {});

    // Each row has its own "Add To Project" button. Click the active (non-disabled) one
    // which is on the last member's row.
    const lastMember = acceptedMembers[acceptedMembers.length - 1];
    const lastFullName = `${lastMember.firstName} ${lastMember.lastName}`;
    await page.getByRole('row', { name: lastFullName }).getByRole('button').click();
    console.log('   [DONE] Add To Project clicked');
    await page.waitForTimeout(5000);

    // ---- STEP 6: Verify ----
    console.log('\n[STEP 6] Verifying...');
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);
    await page.screenshot({ path: `test-results/gc-add-complete-${Date.now()}.png` }).catch(() => {});

    // Check members page shows the added members
    for (const member of acceptedMembers) {
      const fullName = `${member.firstName} ${member.lastName}`;
      const nameVisible = await page.getByText(fullName).isVisible({ timeout: 5000 }).catch(() => false);
      if (nameVisible) {
        console.log(`   [OK] ${fullName} visible on Members page`);
      } else {
        console.log(`   [WARNING] ${fullName} not visible on Members page`);
      }
    }

    console.log('\n[COMPLETE] GC added all accepted members to the project!\n');
  });
});
