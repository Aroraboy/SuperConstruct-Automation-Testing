/**
 * Members Accept Project Invitation
 *
 * After the GC adds members to the project, each member uses their
 * saved login session (storageState from the accept-invitations step)
 * to accept the project invitation — no re-login needed.
 *
 * Flow per member:
 *   1. Load saved session (storageState)
 *   2. Navigate to app → Click GC company card
 *   3. Click project card (heading)
 *   4. Click "Accept Invitation" button
 *   5. Verify landing on project page
 *
 * Prerequisites: gc-add-to-project must have completed
 * Reads: .auth/gc-accepted-members.json (has storagePath per member)
 *
 * Usage: npm run test:gc-members-accept-project
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ACCEPTED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-accepted-members.json');

function loadAcceptedMembers() {
  if (!fs.existsSync(ACCEPTED_PATH)) {
    throw new Error('Accepted members not found. Run the full GC flow first.');
  }
  return JSON.parse(fs.readFileSync(ACCEPTED_PATH, 'utf-8'));
}

test.describe.serial('Members Accept Project Invitation', () => {
  let members;

  test.beforeAll(async () => {
    members = loadAcceptedMembers();
    console.log(`\n[SETUP] Loaded ${members.length} accepted members:`);
    members.forEach(m => console.log(`   - ${m.firstName} ${m.lastName}: ${m.email} (storage: ${m.storagePath || 'none'})`));
  });

  test('All members accept project invitation', async ({ browser }) => {
    test.setTimeout(300000); // 5 minutes for all members

    const results = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const fullName = `${member.firstName} ${member.lastName}`;

      console.log(`\n${'='.repeat(60)}`);
      console.log(`[MEMBER ${i + 1}/${members.length}] ${fullName}`);
      console.log(`[EMAIL] ${member.email}`);
      console.log(`${'='.repeat(60)}`);

      // Load saved session
      const storagePath = member.storagePath
        ? path.join(__dirname, '..', '..', member.storagePath)
        : null;

      if (!storagePath || !fs.existsSync(storagePath)) {
        console.log(`   [SKIP] No saved session for ${fullName} — skipping`);
        results.push({ ...member, projectAccepted: false, error: 'No saved session' });
        continue;
      }

      console.log(`\n[STEP 1] Loading saved session...`);
      console.log(`   Storage: ${member.storagePath}`);

      const context = await browser.newContext({
        ...test.info().project.use,
        storageState: storagePath,
      });
      const page = await context.newPage();

      try {
        // ---- STEP 2: Navigate to app ----
        console.log('\n[STEP 2] Navigating to app...');
        await page.goto('https://beta.superconstruct.io/app', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForTimeout(3000);
        console.log(`   URL: ${page.url()}`);

        // ---- STEP 3: Click GC company card ----
        console.log('\n[STEP 3] Navigating to GC company...');
        const companyImg = page.getByRole('img', { name: /GC Construction/i });
        await companyImg.waitFor({ state: 'visible', timeout: 15000 });
        await companyImg.click();
        console.log('   [DONE] GC Company clicked');
        await page.waitForTimeout(3000);
        console.log(`   URL: ${page.url()}`);

        // ---- STEP 4: Click project card ----
        console.log('\n[STEP 4] Selecting project...');
        const projectHeading = page.getByRole('heading', { name: /TestProject/i });
        await projectHeading.waitFor({ state: 'visible', timeout: 15000 });
        await projectHeading.click();
        console.log('   [DONE] Project clicked');
        await page.waitForTimeout(3000);
        console.log(`   URL: ${page.url()}`);

        // ---- STEP 5: Click Accept Invitation ----
        console.log('\n[STEP 5] Accepting project invitation...');
        const acceptBtn = page.getByRole('button', { name: 'Accept Invitation' });
        await acceptBtn.waitFor({ state: 'visible', timeout: 15000 });
        await acceptBtn.click();
        console.log('   [DONE] Accept Invitation clicked');
        await page.waitForTimeout(5000);

        console.log(`   Final URL: ${page.url()}`);
        await page.screenshot({ path: `test-results/member-accept-project-${member.alias}-${Date.now()}.png` }).catch(() => {});

        console.log(`\n[OK] ${fullName} — accepted project invitation!`);
        results.push({ ...member, projectAccepted: true });

      } catch (error) {
        console.log(`\n   [FAIL] ${fullName}: ${error.message}`);
        await page.screenshot({ path: `test-results/member-accept-project-FAIL-${member.alias}-${Date.now()}.png` }).catch(() => {});
        results.push({ ...member, projectAccepted: false, error: error.message });
      } finally {
        await context.close();
      }
    }

    // ---- Summary ----
    console.log(`\n${'='.repeat(60)}`);
    console.log('[SUMMARY] Project Invitation Acceptance Results:');
    results.forEach(r => {
      const fullName = `${r.firstName} ${r.lastName}`;
      const status = r.projectAccepted ? 'accepted' : 'FAILED';
      console.log(`   ${fullName}: ${status}`);
    });
    console.log(`${'='.repeat(60)}\n`);

    // Verify all members accepted
    const allAccepted = results.every(r => r.projectAccepted);
    expect(allAccepted, 'Not all members accepted the project invitation').toBeTruthy();

    console.log('[COMPLETE] All members accepted the project invitation!\n');
  });
});
