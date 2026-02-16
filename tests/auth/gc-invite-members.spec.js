/**
 * GC Invites 3 Members via "Add From Company"
 * 
 * Prerequisites: Run "npm run test:beta-register" first (registers the GC).
 * Reads GC credentials from .auth/gc-account.json.
 * 
 * Flow (from codegen):
 *   1. GC logs in + OTP
 *   2. Selects company -> Members page
 *   3. For each member:
 *      - Add Member -> Add From Company -> Add User to Company -> Invite Member
 *      - Fill Email, FirstName, Last Name
 *      - Send Invitation
 * 
 * All 3 invited emails are serialized using the same run number as the GC.
 * 
 * Usage: npm run test:gc-invite
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const GMAIL_BASE = 'aroradivyansh995';
const GMAIL_DOMAIN = '@gmail.com';
const GC_CREDS_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-account.json');
const STORAGE_STATE_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-storage-state.json');
const INVITED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-members.json');

function loadGCCredentials() {
  if (!fs.existsSync(GC_CREDS_PATH)) {
    throw new Error('GC account not found. Run "npm run test:beta-register" first.');
  }
  return JSON.parse(fs.readFileSync(GC_CREDS_PATH, 'utf-8'));
}

// 3 members to invite
const membersToInvite = [
  { alias: 'projectmgr', firstName: 'Project', lastName: 'Manager' },
  { alias: 'siteengineer', firstName: 'Sub', lastName: 'Contractor' },
  { alias: 'safety', firstName: 'Project', lastName: 'Developer' },
];

// Use saved auth state (conditional to avoid crash if file missing)
if (fs.existsSync(STORAGE_STATE_PATH)) {
  test.use({ storageState: STORAGE_STATE_PATH });
}

test.describe.serial('GC Invites 3 Members via Add From Company', () => {
  let gc;
  let runNumber;
  let invitedMembers;

  test.beforeAll(async () => {
    gc = loadGCCredentials();
    runNumber = gc.runNumber;

    invitedMembers = membersToInvite.map(m => ({
      alias: `${m.alias}${runNumber}`,
      email: `${GMAIL_BASE}+${m.alias}${runNumber}${GMAIL_DOMAIN}`,
      firstName: m.firstName,
      lastName: m.lastName,
      status: 'pending-invite',
    }));

    console.log(`\n[SETUP] GC: ${gc.email} (Run #${runNumber})`);
    console.log(`[SETUP] Inviting ${invitedMembers.length} members:`);
    invitedMembers.forEach(m => console.log(`   - ${m.firstName} ${m.lastName}: ${m.email}`));
  });

  test('GC invites 3 members from company', async ({ page }) => {
    test.setTimeout(180000);

    // ---- Navigate (session restored via storageState) ----
    console.log('\n[NAV] Opening app page...');
    await page.goto('https://beta.superconstruct.io/app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(7000);

    // Click first company card (skip logo) with retry
    console.log('[NAV] Selecting company...');
    let companyClicked = false;
    for (let attempt = 0; attempt < 3 && !companyClicked; attempt++) {
      if (attempt > 0) {
        console.log(`   [RETRY] Attempt ${attempt + 1} - waiting for company images...`);
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
          companyClicked = true;
          break;
        }
      }
    }
    if (!companyClicked) throw new Error('No company card image found');
    await page.waitForTimeout(5000);
    console.log(`   URL after company: ${page.url()}`);

    // Click first project card (skip logo) with retry
    // Project card images may have empty alt text, so click the last non-logo image
    console.log('[NAV] Selecting project...');
    let projectClicked = false;
    for (let attempt = 0; attempt < 3 && !projectClicked; attempt++) {
      if (attempt > 0) {
        console.log(`   [RETRY] Attempt ${attempt + 1} - waiting for project images...`);
        await page.waitForTimeout(5000);
      }
      const projectImages = page.getByRole('img');
      const projectCount = await projectImages.count();
      for (let i = 0; i < projectCount; i++) {
        const img = projectImages.nth(i);
        const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
        console.log(`   Image ${i}: "${name}"`);
      }
      // Project cards have empty alt — click the last image that isn't the logo
      for (let i = projectCount - 1; i >= 0; i--) {
        const img = projectImages.nth(i);
        const name = await img.evaluate(el => el.alt || el.getAttribute('aria-label') || '');
        if (name !== 'SuperConstruct logo') {
          await img.click();
          console.log(`   [DONE] Project card clicked (image ${i}): "${name}"`);
          projectClicked = true;
          break;
        }
      }
    }
    if (!projectClicked) throw new Error('No project card image found');
    await page.waitForTimeout(5000);
    console.log(`   URL after project: ${page.url()}`);

    // Go to Members page - use visible link containing "Members" text or fallback to sidebar links
    console.log('[NAV] Navigating to Members...');
    // Try finding a visible Members link by text first
    const membersByText = page.getByRole('link', { name: /members/i });
    if (await membersByText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await membersByText.click();
      console.log('   [DONE] Members link clicked (by text)');
    } else {
      // Fallback: find all visible links in the sidebar and click the one for Members
      const allLinks = page.getByRole('link');
      const linkCount = await allLinks.count();
      let membersFound = false;
      for (let i = 0; i < linkCount; i++) {
        const link = allLinks.nth(i);
        const isVisible = await link.isVisible().catch(() => false);
        if (!isVisible) continue;
        const text = await link.textContent().catch(() => '');
        const href = await link.getAttribute('href').catch(() => '');
        console.log(`   Link ${i}: visible="${isVisible}" text="${text.trim()}" href="${href}"`);
        if (text.toLowerCase().includes('member') || (href && href.includes('/members'))) {
          await link.click();
          console.log(`   [DONE] Members link clicked: "${text.trim()}"`);
          membersFound = true;
          break;
        }
      }
      if (!membersFound) {
        await page.screenshot({ path: `test-results/members-nav-error-${Date.now()}.png` }).catch(() => {});
        throw new Error('Members link not found on page');
      }
    }
    await page.waitForTimeout(5000);
    console.log(`   URL after Members nav: ${page.url()}`);

    // ---- First time only: Add Member → Add From Company → Add User to Company ----
    console.log('\n[SETUP] Opening invite panel (first time)...');
    const addMemberButton = page.getByRole('button', { name: 'Add Member' });
    await addMemberButton.waitFor({ state: 'visible', timeout: 15000 });
    await addMemberButton.click();
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Add From Company' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Add User to Company' }).click();
    await page.waitForTimeout(2000);

    // ---- Invite each member ----
    // After each Send Invitation, dialog closes and Invite Member button reappears
    for (let idx = 0; idx < invitedMembers.length; idx++) {
      const member = invitedMembers[idx];
      console.log(`\n[INVITE ${idx + 1}] ${member.firstName} ${member.lastName} (${member.email})`);

      // Click Invite Member (visible on page after dialog closes)
      const inviteBtn = page.getByRole('button', { name: 'Invite Member' });
      await inviteBtn.waitFor({ state: 'visible', timeout: 15000 });
      await inviteBtn.click();
      await page.waitForTimeout(3000);

      // Fill email
      await page.getByRole('textbox', { name: 'Email' }).fill(member.email);
      console.log(`   [DONE] Email: ${member.email}`);

      // Fill first name (codegen: 'FirstName' — no space)
      await page.getByRole('textbox', { name: 'FirstName' }).fill(member.firstName);
      console.log(`   [DONE] FirstName: ${member.firstName}`);

      // Fill last name
      await page.getByRole('textbox', { name: 'Last Name' }).fill(member.lastName);
      console.log(`   [DONE] Last Name: ${member.lastName}`);

      // Click Send Invitation — dialog closes after this
      await page.getByRole('button', { name: 'Send Invitation' }).click();
      console.log(`   [OK] ${member.firstName} ${member.lastName} invited!`);

      // Wait for dialog to close and Invite Member button to reappear
      await page.waitForTimeout(5000);

      member.status = 'invited';
      member.invitedAt = new Date().toISOString();
    }

    // ---- Save invited members ----
    const authDir = path.dirname(INVITED_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(INVITED_PATH, JSON.stringify(invitedMembers, null, 2));
    console.log(`[SAVED] gc-invited-members.json with ${invitedMembers.length} members`);

    await page.screenshot({ path: `test-results/gc-invite-complete-${Date.now()}.png` }).catch(() => {});
    console.log('\n[COMPLETE] GC invited all 3 members!\n');
  });
});
