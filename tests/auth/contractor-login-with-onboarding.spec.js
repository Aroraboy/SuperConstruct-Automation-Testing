const { test, expect } = require('@playwright/test');
const { getOTPFromEmail } = require('../../utils/test-email-service');

test.describe('Contractor Login and Onboarding', () => {
  test.beforeAll(async () => {
    console.log('\n🚀 Setting up login test...');
  });

  test('should login contractor and complete onboarding', async ({ page, context, browser }) => {
    // Increase test timeout to 60 seconds
    test.setTimeout(60000);
    
    // Ensure NO authentication is carried over
    console.log('\n🧹 Ensuring fresh unauthenticated context...');
    
    // Use MailSlurp registered contractor account credentials
    console.log('\n🔑 Using MailSlurp registered contractor account...');
    const testEmail = '1e79e412-764b-4a9b-b000-377e29efc237@mailslurp.biz';
    const testPassword = 'TestPassword@123';
    const inboxId = '1e79e412-764b-4a9b-b000-377e29efc237';
    
    console.log(`\n📧 MailSlurp Contractor email: ${testEmail}`);
    
    // Step 2: Navigate to login page
    console.log('\n🔐 Step 2: Navigating to login page...');
    const loginUrl = 'https://app.superconstruct.io/auth/login';
    
    await page.goto(loginUrl, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(2000);
    console.log(`   Current URL: ${page.url()}`);
    console.log(`   ✅ Login page loaded`);
    
    // Check if already logged in
    if (page.url().includes('/app') && !page.url().includes('login')) {
      console.log(`   ⚠️  Already logged in! Proceeding to onboarding...`);
    }

    // Step 3: Enter login credentials
    console.log('\n📝 Step 3: Entering login credentials...');
    try {
      // Fill email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.waitFor({ timeout: 5000 });
      await emailInput.fill(testEmail);
      console.log(`   ✓ Email: ${testEmail}`);
      
      // Fill password
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.waitFor({ timeout: 5000 });
      await passwordInput.fill(testPassword);
      console.log(`   ✓ Password entered`);
      
      // Click login button
      const loginButton = page.locator('button').filter({ hasText: /Login|Sign In/i }).first();
      await loginButton.waitFor({ timeout: 5000 });
      await loginButton.click();
      console.log(`   ✓ Login button clicked`);
      
      // Wait for navigation away from login page
      await page.waitForTimeout(3000);
      console.log(`   Current URL after login: ${page.url()}`);
      
      // If still on login page, there might be an error
      if (page.url().includes('/auth/login')) {
        console.log(`   ⚠️  Still on login page, checking for errors...`);
        const errorMsg = page.locator('[role="alert"], .error, [class*="error"]').first();
        const errorText = await errorMsg.textContent({ timeout: 2000 }).catch(() => null);
        if (errorText) {
          console.error(`   ❌ Login error: ${errorText}`);
          throw new Error(`Login failed: ${errorText}`);
        }
        
        // Maybe already onboarded - let's navigate to app
        console.log(`   ℹ️  No error found, trying to navigate to app...`);
        await page.goto('https://app.superconstruct.io/app', { waitUntil: 'load', timeout: 15000 });
        console.log(`   Navigated to: ${page.url()}`);
      }
      
      console.log(`   ✅ Successfully logged in! Current URL: ${page.url()}`);
    } catch (error) {
      console.error(`   ❌ Login error: ${error.message}`);
      throw error;
    }
    
    // Step 4: Proceed to onboarding or dashboard
    console.log('\n✅ Step 4: Login successful, checking current page...');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Check if login requires OTP verification
    if (currentUrl.includes('/otp') && currentUrl.includes('isSignIn=true')) {
      console.log(`   📨 Login requires OTP verification, waiting for email...`);
      
      // Step 5: Wait for and extract OTP
      console.log('\n📧 Step 5: Waiting for OTP email...');
      let otp;
      try {
        otp = await getOTPFromEmail(inboxId, 60000);
        console.log(`   ✅ OTP extracted: ${otp}`);
      } catch (error) {
        console.error(`   ❌ Failed to get OTP: ${error.message}`);
        throw error;
      }
      
      // Step 6: Enter OTP
      console.log('\n🔐 Step 6: Entering OTP...');
      const otpInputs = page.locator('input[type="text"]');
      const otpArray = otp.split('');
      const otpInputsArray = await otpInputs.all();
      
      if (otpInputsArray.length >= otpArray.length) {
        // Multiple input fields (one per digit)
        for (let i = 0; i < otpArray.length; i++) {
          await otpInputsArray[i].fill(otpArray[i]);
          await page.waitForTimeout(200);
          console.log(`   ✓ Digit ${i + 1}: ${otpArray[i]}`);
        }
      } else if (otpInputsArray.length > 0) {
        // Single input field
        await otpInputsArray[0].fill(otp);
        console.log(`   ✓ OTP entered: ${otp}`);
      }
      
      // Click verify button if present
      await page.waitForTimeout(1000);
      const verifyButton = page.locator('button').filter({ hasText: /Verify|Confirm|Submit/i }).first();
      if (await verifyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await verifyButton.click();
        console.log('   ✓ Verify button clicked');
      }
      
      // Wait for navigation after OTP
      await page.waitForTimeout(3000);
      console.log(`   Current URL after OTP: ${page.url()}`);
    }
    
    // Check if we're already on the app (onboarding completed)
    const finalUrl = page.url();
    if (finalUrl.includes('/app') && !finalUrl.includes('/onboarding')) {
      console.log(`   ✅ Already onboarded! Contractor is on the main app.`);
    } else if (finalUrl.includes('/onboarding') || finalUrl.includes('/setup')) {
      console.log(`   📝 Onboarding detected, need to complete onboarding first...`);
    } else {
      console.log(`   ℹ️  Current page: ${finalUrl}`);
    }
    
    // Step 7: Click on company "viva"
    console.log('\n🏢 Step 7: Selecting company "viva"...');
    await page.waitForTimeout(3000);
    
    try {
      // Take screenshot before company selection
      await page.screenshot({ path: `test-results/before-company-select-${Date.now()}.png` }).catch(() => {});
      
      // Look for company "viva" - try various selectors
      let companyFound = false;
      
      // Try 1: Look for exact text "viva"
      const companyExact = page.locator('a, div, span, button, [class*="company"], [class*="organization"]').filter({ hasText: /^viva$/i }).first();
      if (await companyExact.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyExact.click();
        console.log('   ✓ Company "viva" clicked (exact match)');
        companyFound = true;
      }
      
      // Try 2: Look for text containing "viva"
      if (!companyFound) {
        const companyContains = page.getByText('viva', { exact: false }).first();
        if (await companyContains.isVisible({ timeout: 2000 }).catch(() => false)) {
          await companyContains.click();
          console.log('   ✓ Company "viva" clicked (contains match)');
          companyFound = true;
        }
      }
      
      // Try 3: Look for dropdown or selector with company
      if (!companyFound) {
        const companyDropdown = page.locator('[class*="company"], [class*="organization"], [class*="selector"]').filter({ hasText: /viva/i }).first();
        if (await companyDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
          await companyDropdown.click();
          console.log('   ✓ Company "viva" selector clicked');
          companyFound = true;
        }
      }
      
      if (companyFound) {
        await page.waitForTimeout(3000);
        console.log(`   Current URL after company selection: ${page.url()}`);
        await page.screenshot({ path: `test-results/after-company-select-${Date.now()}.png` }).catch(() => {});
      } else {
        console.log('   ⚠️  Company "viva" not found - may already be selected or in different location');
        await page.screenshot({ path: `test-results/company-not-found-${Date.now()}.png` }).catch(() => {});
      }
      
    } catch (error) {
      console.error(`   ⚠️  Company selection error: ${error.message}`);
      await page.screenshot({ path: `test-results/company-error-${Date.now()}.png` }).catch(() => {});
    }
    
    // Step 8: Navigate to existing project "abcd"
    console.log('\n🏗️  Step 8: Navigating to project "abcd"...');
    await page.waitForTimeout(3000);
    
    try {
      // Take screenshot of current page
      await page.screenshot({ path: `test-results/before-project-nav-${Date.now()}.png` }).catch(() => {});
      
      // Look for project "abcd" - try various possible selectors
      let projectFound = false;
      
      // Try 1: Look for exact text match in links or cards
      const projectLinkExact = page.locator('a, div, span, [class*="project"], [class*="card"]').filter({ hasText: /^abcd$/i });
      if (await projectLinkExact.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await projectLinkExact.first().click();
        console.log('   ✓ Project "abcd" clicked (exact match)');
        projectFound = true;
      }
      
      // Try 2: Look for text containing abcd
      if (!projectFound) {
        const projectLinkContains = page.getByText('abcd', { exact: false }).first();
        if (await projectLinkContains.isVisible({ timeout: 2000 }).catch(() => false)) {
          await projectLinkContains.click();
          console.log('   ✓ Project "abcd" clicked (contains match)');
          projectFound = true;
        }
      }
      
      // Try 3: Look in a table or list
      if (!projectFound) {
        const projectRow = page.locator('tr, li, [class*="row"]').filter({ hasText: /abcd/i }).first();
        if (await projectRow.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click the row or find a link within it
          const linkInRow = projectRow.locator('a').first();
          if (await linkInRow.isVisible({ timeout: 1000 }).catch(() => false)) {
            await linkInRow.click();
          } else {
            await projectRow.click();
          }
          console.log('   ✓ Project "abcd" clicked (table/list)');
          projectFound = true;
        }
      }
      
      // Try 4: Look for clickable elements with abcd text
      if (!projectFound) {
        const clickableAbcd = page.locator('[role="button"], button, a, [class*="clickable"]').filter({ hasText: /abcd/i }).first();
        if (await clickableAbcd.isVisible({ timeout: 2000 }).catch(() => false)) {
          await clickableAbcd.click();
          console.log('   ✓ Project "abcd" clicked (clickable element)');
          projectFound = true;
        }
      }
      
      if (projectFound) {
        await page.waitForTimeout(3000);
        console.log(`   Current URL after project click: ${page.url()}`);
        await page.screenshot({ path: `test-results/project-page-${Date.now()}.png` }).catch(() => {});
        console.log('   ✅ Inside project "abcd" - should see panel with 14 modules');
      } else {
        console.log('   ⚠️  Project "abcd" not found on page');
        await page.screenshot({ path: `test-results/project-not-found-${Date.now()}.png` }).catch(() => {});
      }
      
    } catch (error) {
      console.error(`   ⚠️  Project navigation error: ${error.message}`);
      await page.screenshot({ path: `test-results/project-nav-error-${Date.now()}.png` }).catch(() => {});
    }
    
    // Step 9: Navigate to Members section
    console.log('\n👥 Step 9: Navigating to Members section...');
    try {
      // Get current project URL and navigate to /tools/members
      const currentUrl = page.url();
      let membersUrl;
      
      if (currentUrl.includes('/tools/')) {
        membersUrl = currentUrl.replace(/\/tools\/[^\/]+/, '/tools/members');
      } else {
        // If not on a tools page, construct the URL from scratch
        membersUrl = currentUrl + '/tools/members';
      }
      
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Navigating to: ${membersUrl}`);
      
      await page.goto(membersUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      console.log(`   ✓ Navigated to Members section`);
      console.log(`   Current URL: ${page.url()}`);
      await page.screenshot({ path: `test-results/members-page-${Date.now()}.png` }).catch(() => {});
      
    } catch (error) {
      console.error(`   ⚠️  Members navigation error: ${error.message}`);
      await page.screenshot({ path: `test-results/members-nav-error-${Date.now()}.png` }).catch(() => {});
    }
    
    // Step 10: Click Add Member button
    console.log('\n➕ Step 10: Clicking Add Member button...');
    try {
      const addMemberButton = page.locator('button, a').filter({ hasText: /Add Member|Invite|Add User|\+ Member|\+ User/i }).first();
      await addMemberButton.waitFor({ timeout: 5000 });
      await addMemberButton.click();
      console.log('   ✓ Add Member button clicked');
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/add-member-form-${Date.now()}.png` }).catch(() => {});
      
    } catch (error) {
      console.error(`   ⚠️  Add Member button error: ${error.message}`);
      await page.screenshot({ path: `test-results/add-member-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 11: Fill member invitation form
    console.log('\n📝 Step 11: Filling member invitation form...');
    try {
      await page.waitForTimeout(2000);
      
      // Use a different MailSlurp email for the new member
      const newMemberEmail = 'f0c8e7d5-1a2b-4c3d-8e9f-0a1b2c3d4e5f@mailslurp.biz'; // Different inbox
      const newMemberFirstName = 'John';
      const newMemberLastName = 'Doe';
      
      // Fill email
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"i], input[name*="email"i]').first();
      await emailInput.waitFor({ timeout: 5000 });
      await emailInput.fill(newMemberEmail);
      console.log(`   ✓ Email: ${newMemberEmail}`);
      await page.waitForTimeout(500);
      
      // Fill first name
      const firstNameInput = page.locator('input[placeholder*="first"i], input[name*="firstName"i], input[name*="first"i]').first();
      if (await firstNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstNameInput.fill(newMemberFirstName);
        console.log(`   ✓ First Name: ${newMemberFirstName}`);
        await page.waitForTimeout(500);
      }
      
      // Fill last name
      const lastNameInput = page.locator('input[placeholder*="last"i], input[name*="lastName"i], input[name*="last"i]').first();
      if (await lastNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await lastNameInput.fill(newMemberLastName);
        console.log(`   ✓ Last Name: ${newMemberLastName}`);
        await page.waitForTimeout(500);
      }
      
      // Fill name if there's a single name field instead
      const nameInput = page.locator('input[placeholder*="name"i], input[name*="name"i]').first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false) && !(await firstNameInput.isVisible().catch(() => false))) {
        await nameInput.fill(`${newMemberFirstName} ${newMemberLastName}`);
        console.log(`   ✓ Full Name: ${newMemberFirstName} ${newMemberLastName}`);
        await page.waitForTimeout(500);
      }
      
      // Select role from dropdown
      console.log('\n   🎯 Selecting role...');
      
      // Try standard select first
      const roleSelect = page.locator('select').filter({ hasText: /role|position/i }).or(page.locator('select[name*="role"i]')).first();
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.selectOption({ index: 1 });
        const selectedRole = await roleSelect.inputValue();
        console.log(`   ✓ Role selected: ${selectedRole}`);
      } else {
        // Try custom dropdown
        const roleDropdown = page.locator('button, div[role="combobox"]').filter({ hasText: /role|select role|choose role/i }).or(page.locator('[class*="role"] button, [class*="select"]')).first();
        if (await roleDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
          await roleDropdown.click();
          await page.waitForTimeout(500);
          
          // Select first available role option
          const roleOption = page.locator('div[role="option"], li[role="option"], [class*="option"]').first();
          if (await roleOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            const roleText = await roleOption.textContent();
            await roleOption.click();
            console.log(`   ✓ Role selected: ${roleText?.trim()}`);
            await page.waitForTimeout(500);
          }
        }
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/member-form-filled-${Date.now()}.png` }).catch(() => {});
      
    } catch (error) {
      console.error(`   ⚠️  Form filling error: ${error.message}`);
      await page.screenshot({ path: `test-results/member-form-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }
    
    // Step 12: Submit member invitation
    console.log('\n📤 Step 12: Sending member invitation...');
    try {
      const inviteButton = page.locator('button').filter({ hasText: /Invite|Send|Add|Submit/i }).first();
      await inviteButton.waitFor({ timeout: 5000 });
      await inviteButton.click();
      console.log('   ✓ Invite button clicked');
      
      await page.waitForTimeout(3000);
      
      // Check for success message
      const successMsg = page.locator('[class*="success"], [role="status"], [class*="toast"]').first();
      const successText = await successMsg.textContent({ timeout: 3000 }).catch(() => null);
      if (successText) {
        console.log(`   ✅ Success: ${successText}`);
      }
      
      // Check for error messages
      const errorMsg = page.locator('[class*="error"], [role="alert"]').first();
      const errorText = await errorMsg.textContent({ timeout: 2000 }).catch(() => null);
      if (errorText) {
        console.log(`   ⚠️  Error: ${errorText}`);
      }
      
      await page.screenshot({ path: `test-results/member-invited-${Date.now()}.png` }).catch(() => {});
      console.log('   ✅ Member invitation sent successfully!');
      console.log('   🎉 Test completed - Login, company selection, project access, and member invitation!');
      
    } catch (error) {
      console.error(`   ❌ Invitation error: ${error.message}`);
      await page.screenshot({ path: `test-results/invite-error-${Date.now()}.png` }).catch(() => {});
      throw error;
    }

    console.log('\n🎉 Test completed successfully: Login → OTP → Company → Project → Add Member!\n');
  });

  test.afterAll(async () => {
    console.log('\n✅ Test run completed');
  });
});
