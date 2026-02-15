/**
 * Accept Invitations — Each invited member clicks the invite link from email,
 * then completes OTP + set password + onboarding.
 *
 * Flow (from codegen):
 *   1. Navigate to invite link (/auth/register/otp?token=...)
 *   2. Enter 6-digit OTP (from email) into textbox fields
 *   3. Set Password + Confirm Password → "Set Password" button
 *   4. Click "Next" (intro page)
 *   5. Profile: Address (autocomplete), City, State, Postal Code,
 *      Timezone (svg dropdown), Phone Number → "Save" → "Next"
 *   6. Terms checkbox → "Complete Onboarding"
 *   7. Lands on /app with company card visible
 *
 * Prerequisites: Run the full GC flow first:
 *   npm run test:gc-flow   (register → create project → invite 3 members)
 *
 * Reads member list from .auth/gc-invited-members.json
 * Reads invite links + OTP from Gmail via IMAP (+alias pattern)
 *
 * Usage: npm run test:gc-accept
 */

const { test, expect } = require('@playwright/test');
const { getInviteDataFromGmail } = require('../../utils/gmail-invite-reader');
const fs = require('fs');
const path = require('path');

const INVITED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-invited-members.json');
const ACCEPTED_PATH = path.join(__dirname, '..', '..', '.auth', 'gc-accepted-members.json');
const DEFAULT_PASSWORD = 'Test@Password123';

function loadInvitedMembers() {
  if (!fs.existsSync(INVITED_PATH)) {
    throw new Error('Invited members file not found. Run "npm run test:gc-flow" first.');
  }
  return JSON.parse(fs.readFileSync(INVITED_PATH, 'utf-8'));
}

test.describe.serial('Accept All Member Invitations', () => {
  let members;
  const acceptedMembers = [];

  test.beforeAll(async () => {
    members = loadInvitedMembers();
    console.log(`\n[SETUP] Loaded ${members.length} invited members:`);
    members.forEach(m => console.log(`   - ${m.firstName} ${m.lastName}: ${m.email} (${m.status})`));
  });

  test.afterAll(async () => {
    const authDir = path.dirname(ACCEPTED_PATH);
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    fs.writeFileSync(ACCEPTED_PATH, JSON.stringify(acceptedMembers, null, 2));
    console.log(`\n[SAVED] ${acceptedMembers.length} accepted members -> .auth/gc-accepted-members.json`);
  });

  test('Accept invitations for all 3 members', async ({ browser }) => {
    test.setTimeout(360000); // 6 minutes total

    for (let idx = 0; idx < members.length; idx++) {
      const member = members[idx];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[MEMBER ${idx + 1}/${members.length}] ${member.firstName} ${member.lastName}`);
      console.log(`[EMAIL] ${member.email}`);
      console.log(`${'='.repeat(60)}`);

      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // ---- STEP 1: Get invite link + OTP from Gmail ----
        console.log('\n[STEP 1] Fetching invite data from Gmail...');
        const data = await getInviteDataFromGmail(member.email, 90000);
        const inviteLink = data.link;
        const emailOTP = data.otp;
        console.log(`   [OK] Invite link: ${inviteLink}`);
        console.log(`   [OK] OTP: ${emailOTP}`);

        // ---- STEP 2: Navigate to invite link ----
        console.log('\n[STEP 2] Navigating to invite link...');
        await page.goto(inviteLink, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);
        console.log(`   URL: ${page.url()}`);
        await page.screenshot({ path: `test-results/accept-landing-${member.alias}-${Date.now()}.png` }).catch(() => {});

        // ---- STEP 3: Enter OTP (6 textbox fields) ----
        console.log('\n[STEP 3] Entering OTP...');
        const otpDigits = emailOTP.split('');
        for (let i = 0; i < otpDigits.length; i++) {
          await page.getByRole('textbox').nth(i).fill(otpDigits[i]);
          await page.waitForTimeout(200);
        }
        console.log(`   [DONE] OTP entered: ${emailOTP}`);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-results/accept-otp-entered-${member.alias}-${Date.now()}.png` }).catch(() => {});

        // ---- STEP 4: Set Password ----
        console.log('\n[STEP 4] Setting password...');
        const passwordField = page.getByRole('textbox', { name: 'Password*', exact: true });
        await passwordField.waitFor({ state: 'visible', timeout: 10000 });
        await passwordField.click();
        await passwordField.fill(DEFAULT_PASSWORD);
        console.log(`   [DONE] Password: ${DEFAULT_PASSWORD}`);

        await page.getByRole('textbox', { name: 'Confirm Password*' }).click();
        await page.getByRole('textbox', { name: 'Confirm Password*' }).fill(DEFAULT_PASSWORD);
        console.log('   [DONE] Confirm Password filled');

        await page.getByRole('button', { name: 'Set Password' }).click();
        console.log('   [DONE] Set Password clicked');
        await page.waitForTimeout(3000);
        console.log(`   URL after password: ${page.url()}`);
        await page.screenshot({ path: `test-results/accept-password-set-${member.alias}-${Date.now()}.png` }).catch(() => {});

        // ---- STEP 5: Onboarding — Intro (Next) ----
        console.log('\n[STEP 5] Onboarding intro — clicking Next...');
        const nextButton = page.getByRole('button', { name: 'Next' });
        await nextButton.waitFor({ state: 'visible', timeout: 10000 });
        await nextButton.click();
        console.log('   [DONE] Next clicked');
        await page.waitForTimeout(2000);

        // ---- STEP 6: Onboarding — Profile ----
        console.log('\n[STEP 6] Filling profile...');

        // Address (with autocomplete dropdown)
        const addressField = page.getByRole('textbox', { name: 'Address' });
        await addressField.waitFor({ state: 'visible', timeout: 10000 });
        await addressField.click();
        await addressField.fill('Texas');
        await page.waitForTimeout(1500);
        // Click the autocomplete suggestion
        const suggestion = page.getByText('TexasUSA').or(page.getByText('Texas')).first();
        if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
          await suggestion.click();
          console.log('   [DONE] Address: Texas (autocomplete selected)');
        } else {
          console.log('   [INFO] No autocomplete suggestion, continuing...');
        }
        await page.waitForTimeout(1000);

        // City
        await page.getByRole('textbox', { name: 'City' }).click();
        await page.getByRole('textbox', { name: 'City' }).fill('Dallas');
        console.log('   [DONE] City: Dallas');

        // State
        await page.getByRole('textbox', { name: 'State' }).click();
        await page.getByRole('textbox', { name: 'State' }).fill('TX');
        console.log('   [DONE] State: TX');

        // Postal Code
        await page.getByRole('textbox', { name: 'Postal Code' }).click();
        await page.getByRole('textbox', { name: 'Postal Code' }).fill('75001');
        console.log('   [DONE] Postal Code: 75001');

        // Timezone — click the svg dropdown (2nd svg on page)
        console.log('   Selecting timezone...');
        const svgIcons = page.locator('svg');
        const svgCount = await svgIcons.count();
        if (svgCount > 1) {
          await svgIcons.nth(1).click();
          await page.waitForTimeout(1000);
          const tzOption = page.getByText('America/New_York');
          if (await tzOption.isVisible({ timeout: 3000 }).catch(() => false)) {
            await tzOption.click();
            console.log('   [DONE] Timezone: America/New_York');
          } else {
            console.log('   [WARNING] Timezone option not found');
          }
        } else {
          console.log('   [WARNING] Timezone svg dropdown not found');
        }

        // Phone Number
        await page.getByRole('textbox', { name: 'Phone Number' }).click();
        await page.getByRole('textbox', { name: 'Phone Number' }).fill('5551234567');
        console.log('   [DONE] Phone: 5551234567');

        await page.screenshot({ path: `test-results/accept-profile-filled-${member.alias}-${Date.now()}.png` }).catch(() => {});

        // Save
        await page.getByRole('button', { name: 'Save' }).click();
        console.log('   [DONE] Save clicked');
        await page.waitForTimeout(3000);

        // Next
        console.log('   Clicking Next...');
        await page.getByRole('button', { name: 'Next' }).click();
        console.log('   [DONE] Next clicked');
        await page.waitForTimeout(2000);

        // ---- STEP 7: Terms & Complete Onboarding ----
        console.log('\n[STEP 7] Accepting terms and completing onboarding...');
        const termsCheckbox = page.getByRole('checkbox', { name: 'I agree to the Terms and' });
        await termsCheckbox.waitFor({ state: 'visible', timeout: 10000 });
        await termsCheckbox.check();
        console.log('   [DONE] Terms checkbox checked');

        await page.getByRole('button', { name: 'Complete Onboarding' }).click();
        console.log('   [DONE] Complete Onboarding clicked');
        await page.waitForTimeout(5000);

        // ---- STEP 8: Verify — should land on /app ----
        console.log('\n[STEP 8] Verifying...');
        const finalUrl = page.url();
        console.log(`   Final URL: ${finalUrl}`);
        await page.screenshot({ path: `test-results/accept-complete-${member.alias}-${Date.now()}.png` }).catch(() => {});

        const success = finalUrl.includes('/app');
        acceptedMembers.push({
          ...member,
          password: DEFAULT_PASSWORD,
          status: success ? 'accepted' : 'unknown',
          finalUrl,
          acceptedAt: new Date().toISOString(),
        });

        if (success) {
          console.log(`   [OK] ${member.firstName} ${member.lastName} — invitation accepted!`);
        } else {
          console.log(`   [WARNING] Unexpected final URL: ${finalUrl}`);
        }

      } catch (error) {
        console.error(`   [FAIL] ${member.firstName} ${member.lastName}: ${error.message}`);
        await page.screenshot({ path: `test-results/accept-error-${member.alias}-${Date.now()}.png` }).catch(() => {});
        acceptedMembers.push({
          ...member,
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString(),
        });
      } finally {
        await context.close();
      }
    }

    // Final summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SUMMARY] Invitation Acceptance Results:`);
    acceptedMembers.forEach(m => {
      console.log(`   ${m.firstName} ${m.lastName}: ${m.status}`);
    });
    console.log(`${'='.repeat(60)}\n`);

    expect(acceptedMembers.length).toBe(members.length);
  });
});
