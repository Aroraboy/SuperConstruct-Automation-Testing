/**
 * Owner Approves SOV (Schedule of Values)
 *
 * Flow:
 *   1. Navigate to app → company → project → SOV page
 *   2. Find the pending SOV and click to open it
 *   3. Click "Approve" → "Confirm"
 *
 * Prerequisites: gc-create-sov must have completed
 * Uses: Owner login state (.auth/owner-login-state.json)
 *
 * Usage: npm run test:sov-approve
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe.serial('Owner Approves SOV', () => {

  test('Owner approves the submitted SOV', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes

    // ---- STEP 1: Navigate to app ----
    console.log('\n[STEP 1] Navigating to app...');
    await page.goto('https://beta.superconstruct.io/app', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 2: Navigate to company → project ----
    console.log('\n[STEP 2] Navigating to company → project...');

    // Click the first company card (skip site logo & null-alt icons)
    const allImages = await page.getByRole('img').all();
    console.log(`   Found ${allImages.length} images on page`);

    let clicked = false;
    for (let i = 0; i < allImages.length; i++) {
      const alt = await allImages[i].getAttribute('alt').catch(() => '');
      if (alt && alt !== 'null' && !alt.toLowerCase().includes('superconstruct')) {
        await allImages[i].click();
        console.log(`   [DONE] Clicked company card: "${alt}"`);
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Ultimate fallback: click last visible img (company cards are after icons)
      console.log('   [FALLBACK] Clicking last image...');
      await page.getByRole('img').last().click();
    }
    await page.waitForTimeout(3000);

    const projectImg = page.getByRole('img', { name: /TestProject/i });
    await projectImg.waitFor({ state: 'visible', timeout: 15000 });
    await projectImg.click();
    console.log('   [DONE] Project clicked');
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 3: Navigate to SOV page (5th link, index 4) ----
    console.log('\n[STEP 3] Navigating to SOV page...');
    await page.getByRole('link').nth(4).click();
    console.log('   [DONE] SOV link clicked');
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // ---- STEP 4: Click on the pending SOV ----
    console.log('\n[STEP 4] Opening pending SOV...');

    // Look for the SOV row/card — try status "Pending Approval" or the SOV itself
    const pendingSOV = page.getByText('Pending Approval').first();
    try {
      await pendingSOV.waitFor({ state: 'visible', timeout: 10000 });
      await pendingSOV.click();
      console.log('   [DONE] Pending Approval SOV clicked');
    } catch {
      // Fallback: click on any SOV row
      console.log('   [INFO] "Pending Approval" text not found, trying table row...');
      const firstRow = page.getByRole('row').nth(1);
      await firstRow.click();
      console.log('   [DONE] First SOV row clicked');
    }
    await page.waitForTimeout(3000);
    console.log(`   URL: ${page.url()}`);

    // Take screenshot before approve
    await page.screenshot({ path: `test-results/owner-sov-before-approve-${Date.now()}.png` }).catch(() => {});

    // ---- STEP 5: Approve SOV ----
    console.log('\n[STEP 5] Approving SOV...');
    const approveBtn = page.getByRole('button', { name: 'Approve' });
    await approveBtn.waitFor({ state: 'visible', timeout: 15000 });
    await approveBtn.click();
    console.log('   [DONE] Approve clicked');
    await page.waitForTimeout(2000);

    // ---- STEP 6: Confirm approval ----
    console.log('\n[STEP 6] Confirming approval...');
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
    await confirmBtn.click();
    console.log('   [DONE] Confirm clicked');
    await page.waitForTimeout(5000);

    console.log(`   Final URL: ${page.url()}`);
    await page.screenshot({ path: `test-results/owner-sov-approved-${Date.now()}.png` }).catch(() => {});

    console.log('\n[COMPLETE] Owner approved the SOV!\n');
  });
});
