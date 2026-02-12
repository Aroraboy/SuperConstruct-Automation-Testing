const { chromium } = require('@playwright/test');
const { getOTPFromEmail } = require('../utils/test-email-service');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testEmail = '1e79e412-764b-4a9b-b000-377e29efc237@mailslurp.biz';
  const testPassword = 'TestPassword@123';
  const inboxId = '1e79e412-764b-4a9b-b000-377e29efc237';

  // Login
  console.log('--- LOGIN ---');
  await page.goto('https://beta.superconstruct.io/auth/login', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(2000);

  await page.locator('input[type="email"]').first().fill(testEmail);
  await page.locator('input[type="password"]').first().fill(testPassword);
  await page.locator('button').filter({ hasText: /Login|Sign In/i }).first().click();
  await page.waitForTimeout(3000);
  console.log('URL after login click:', page.url());

  // Handle OTP if needed
  if (page.url().includes('/otp')) {
    console.log('--- OTP REQUIRED ---');
    const otp = await getOTPFromEmail(inboxId, 60000);
    console.log('OTP:', otp);
    const otpInputs = await page.locator('input[type="text"]').all();
    const digits = otp.split('');
    for (let i = 0; i < digits.length; i++) {
      await otpInputs[i].fill(digits[i]);
      await page.waitForTimeout(200);
    }
    const verifyBtn = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
    if (await verifyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyBtn.click();
    }
    await page.waitForTimeout(3000);
    console.log('URL after OTP:', page.url());
  }

  await page.reload();
  await page.waitForTimeout(3000);
  console.log('URL after reload:', page.url());

  // --- COMPANY PAGE (at /app) ---
  console.log('\n=== STEP 1: COMPANY PAGE ===');
  console.log('URL:', page.url());

  // Click the company CARD (the div with company name, not nav links)
  const companyCard = page.getByText(/Acme Construction/i).first();
  if (await companyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Found company card with "Acme Construction"');
    await companyCard.click();
    await page.waitForTimeout(4000);
    console.log('URL after company click:', page.url());
  } else {
    console.log('Company card not found! Dumping page HTML...');
    const html = await page.locator('body').innerHTML();
    console.log(html.substring(0, 2000));
  }

  // --- PROJECTS PAGE ---
  console.log('\n=== STEP 2: PROJECTS PAGE ===');
  console.log('URL:', page.url());
  await page.screenshot({ path: 'test-results/inspect-projects-page.png' });

  // The project card has an h4 with the project name (e.g. "abc")
  // Click the first project card by its h4 title
  console.log('\n--- Trying to click first project card ---');
  
  // Try clicking h4 (project title)
  const projectTitle = page.locator('h4').first();
  if (await projectTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
    const titleText = await projectTitle.textContent().catch(() => '');
    console.log(`Found project h4: "${titleText?.trim()}"`);
    await projectTitle.click();
    await page.waitForTimeout(4000);
    console.log('URL after h4 click:', page.url());
    
    // If still on same page, it might need clicking a parent element
    if (page.url().includes('/projects') && !page.url().includes('/tools/')) {
      console.log('Still on projects page, trying parent click...');
      // Get the parent of h4 and click that
      const parentCard = projectTitle.locator('..');
      await parentCard.click();
      await page.waitForTimeout(4000);
      console.log('URL after parent click:', page.url());
    }
  }
  
  // If still no dice, try getting HTML surrounding the project card
  if (!page.url().includes('/tools/')) {
    console.log('\nStill not inside project. Dumping card area HTML...');
    const cardAreaHTML = await page.locator('h4').first().locator('..').locator('..').locator('..').innerHTML().catch(() => 'N/A');
    console.log(cardAreaHTML.substring(0, 2000));
  }

  // --- INSIDE PROJECT (should be at /tools/overview) ---
  console.log('\n=== STEP 3: INSIDE PROJECT ===');
  console.log('URL:', page.url());
  await page.screenshot({ path: 'test-results/inspect-inside-project.png' });

  // Now navigate to /tools/members
  const currentUrl = page.url();
  if (currentUrl.includes('/tools/')) {
    const membersUrl = currentUrl.replace(/\/tools\/\w+/, '/tools/members');
    console.log(`Navigating to members: ${membersUrl}`);
    await page.goto(membersUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  } else if (currentUrl.includes('/projects/')) {
    // URL might be /app/projects/{id} without /tools/
    const membersUrl = currentUrl.replace(/\/$/, '') + '/tools/members';
    console.log(`Navigating to members: ${membersUrl}`);
    await page.goto(membersUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }

  // --- MEMBERS PAGE ---
  console.log('\n=== STEP 4: MEMBERS PAGE ===');
  console.log('URL:', page.url());
  await page.screenshot({ path: 'test-results/inspect-members-page.png' });

  // Dump ALL buttons on members page
  console.log('\nAll visible buttons:');
  const membersButtons = await page.locator('button').all();
  for (const btn of membersButtons) {
    try {
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        const text = await btn.textContent({ timeout: 500 }).catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        if ((text?.trim().length > 0 && text.trim().length < 80) || ariaLabel) {
          console.log(`  BUTTON: "${text?.trim()}" [aria-label="${ariaLabel || ''}"]`);
        }
      }
    } catch (e) {}
  }

  // Dump ALL links on members page
  console.log('\nAll visible links:');
  const membersLinks = await page.locator('a[href]').all();
  for (const link of membersLinks) {
    try {
      if (await link.isVisible({ timeout: 500 }).catch(() => false)) {
        const href = await link.getAttribute('href');
        const text = await link.textContent({ timeout: 500 }).catch(() => '');
        console.log(`  LINK: "${text?.trim().substring(0, 80)}" -> ${href}`);
      }
    } catch (e) {}
  }

  // Also check for any element with "Add" or "Invite" or "+" text
  console.log('\nElements with Add/Invite/+ text:');
  const addElements = await page.locator('button, a, span, div').filter({ hasText: /add|invite|\+|new/i }).all();
  for (const el of addElements) {
    try {
      if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
        const tag = await el.evaluate(e => e.tagName);
        const text = await el.textContent({ timeout: 500 }).catch(() => '');
        if (text?.trim().length > 0 && text.trim().length < 100) {
          console.log(`  ${tag}: "${text?.trim()}"`);
        }
      }
    } catch (e) {}
  }

  console.log('\n--- DONE ---');
  await page.waitForTimeout(5000);
  await browser.close();
})();
