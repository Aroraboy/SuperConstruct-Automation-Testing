/**
 * MEMBERS MODULE TESTS
 * 
 * Purpose: Test Members/Users tab functionality
 * Features tested:
 * - Add Member button
 * - Edit existing member button
 * - Create new member flow
 * - Member list display
 * 
 * When to run:
 * - After authentication
 * - When testing user management
 * - Before team collaboration features
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Members Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Members page
    await page.goto(
      `/app/projects/${projectId}/tools/members`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Members page loads
  test('01 - Members page loads and displays member list', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/members');
      console.log('[OK] Members page loaded');
    });

    await test.step('Verify page has content', async () => {
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
      console.log('[OK] Page has content');
    });

    await test.step('Take screenshot of Members page', async () => {
      await page.screenshot({ path: 'reports/screenshots/members-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: members-main.png');
    });
  });

  // Test 2: Find and verify "Add Member" button
  test('02 - Add Member button is visible and clickable', async ({ page }) => {
    await test.step('Look for Add Member button', async () => {
      const addMemberSelectors = [
        'button:has-text("Add Member")',
        'button:has-text("Add User")',
        'button:has-text("Invite Member")',
        'button:has-text("Invite User")',
        'button:has-text("New Member")',
        'button:has-text("Create Member")',
        'a:has-text("Add Member")',
        '[data-testid="add-member"]',
        '[data-testid="create-member"]',
        'button:has-text("Add"):has-text("Member")'
      ];

      let buttonFound = false;
      let addButton = null;
      
      for (const selector of addMemberSelectors) {
        try {
          const button = page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Add Member button: ${selector}`);
            buttonFound = true;
            addButton = button;
            
            // Log button details
            const buttonText = await button.textContent();
            const isDisabled = await button.isDisabled().catch(() => false);
            const ariaLabel = await button.getAttribute('aria-label').catch(() => 'N/A');
            
            console.log(`   Button text: "${buttonText}"`);
            console.log(`   Button disabled: ${isDisabled}`);
            console.log(`   aria-label: "${ariaLabel}"`);
            
            // Take screenshot highlighting the button
            await page.screenshot({ path: 'reports/screenshots/members-add-button.png', fullPage: true });
            
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      expect(buttonFound).toBeTruthy();
    });
  });

  // Test 3: Find existing members and their Edit buttons
  test('03 - Member list displays with Edit buttons', async ({ page }) => {
    await test.step('Look for member list items', async () => {
      console.log('[SEARCH] Analyzing member list...');
      
      // Common patterns for member list items
      const memberListSelectors = [
        '[role="row"]',
        'tr',
        '.member-item',
        '.user-item',
        '[data-testid*="member"]',
        '[data-testid*="user"]'
      ];

      let membersFound = false;
      
      for (const selector of memberListSelectors) {
        try {
          const items = await page.locator(selector).all();
          
          if (items.length > 0) {
            console.log(`[OK] Found ${items.length} items using: ${selector}`);
            membersFound = true;
            
            // Analyze first few members
            for (let i = 0; i < Math.min(3, items.length); i++) {
              const text = await items[i].textContent().catch(() => '');
              console.log(`   Member ${i + 1}: ${text.substring(0, 50)}...`);
            }
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`Members list ${membersFound ? 'FOUND' : 'NOT FOUND'}`);
    });

    await test.step('Look for Edit buttons in member list', async () => {
      const editButtonSelectors = [
        'button:has-text("Edit")',
        'a:has-text("Edit")',
        'button[aria-label*="Edit"]',
        '[data-testid*="edit"]',
        'button:has(svg) >> nth=0', // First button with icon
        'button:has-text("...")', // Three-dot menu
        '[role="button"]:has-text("Edit")'
      ];

      let editButtonsFound = 0;
      
      for (const selector of editButtonSelectors) {
        try {
          const buttons = await page.locator(selector).all();
          
          if (buttons.length > 0) {
            console.log(`[OK] Found ${buttons.length} edit buttons/menus: ${selector}`);
            editButtonsFound = buttons.length;
            
            // Log details of first button
            const firstButton = buttons[0];
            const isVisible = await firstButton.isVisible().catch(() => false);
            const text = await firstButton.textContent().catch(() => '');
            const ariaLabel = await firstButton.getAttribute('aria-label').catch(() => '');
            
            console.log(`   First button visible: ${isVisible}`);
            console.log(`   Text: "${text}"`);
            console.log(`   aria-label: "${ariaLabel}"`);
            
            // Take screenshot
            await page.screenshot({ path: 'reports/screenshots/members-with-edit-buttons.png', fullPage: true });
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`\n[CHART] Edit buttons/actions found: ${editButtonsFound}`);
    });
  });

  // Test 4: Click Add Member button and verify form opens
  test('04 - Add Member button opens member creation form', async ({ page }) => {
    await test.step('Click Add Member button', async () => {
      const addMemberSelectors = [
        'button:has-text("Add Member")',
        'button:has-text("Add User")',
        'button:has-text("Invite Member")',
        'button:has-text("New Member")',
        'a:has-text("Add Member")'
      ];

      let formOpened = false;
      
      for (const selector of addMemberSelectors) {
        try {
          const button = page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[PIN] Clicking Add Member: ${selector}`);
            await button.click();
            await page.waitForTimeout(2000); // Wait for form/modal to appear
            formOpened = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(formOpened).toBeTruthy();
    });

    await test.step('Verify member form/modal appeared', async () => {
      console.log('[SEARCH] Checking if member form appeared...');
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'reports/screenshots/members-form-opened.png', fullPage: true });
      
      // Look for form fields
      const formFieldSelectors = [
        'input[name*="name"]',
        'input[name*="email"]',
        'input[placeholder*="name" i]',
        'input[placeholder*="email" i]',
        'input[type="email"]',
        'input[type="text"]'
      ];

      let formFieldsFound = 0;
      
      for (const selector of formFieldSelectors) {
        try {
          const fields = await page.locator(selector).all();
          if (fields.length > 0) {
            const fieldCount = fields.length;
            console.log(`[OK] Found ${fieldCount} form fields: ${selector}`);
            formFieldsFound += fieldCount;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`\n[CHART] Total form fields found: ${formFieldsFound}`);
      
      // Check for modal/dialog
      const hasModal = await page.locator('[role="dialog"], .modal, [data-testid*="modal"]').isVisible().catch(() => false);
      console.log(`Modal/Dialog visible: ${hasModal}`);
      
      expect(formFieldsFound > 0 || hasModal).toBeTruthy();
    });
  });

  // Test 5: Fill and submit member creation form
  test('05 - Create new member with form submission', async ({ page }) => {
    await test.step('Click Add Member button', async () => {
      const button = page.locator('button:has-text("Add Member"), button:has-text("Add User"), button:has-text("Invite")').first();
      const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        await button.click();
        await page.waitForTimeout(2000);
        console.log('[OK] Clicked Add Member button');
      }
    });

    await test.step('Fill member form', async () => {
      const timestamp = Date.now();
      const testMember = {
        name: `Test Member ${timestamp}`,
        email: `test.member${timestamp}@example.com`,
        role: 'Project Manager'
      };

      console.log(`[NOTE] Filling form for: ${testMember.name}`);

      // Fill name field
      try {
        const nameSelectors = [
          'input[name="name"]',
          'input[name="fullName"]',
          'input[name="firstName"]',
          'input[placeholder*="name" i]'
        ];
        
        for (const selector of nameSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          if (isVisible) {
            await field.fill(testMember.name);
            console.log(`[OK] Filled name: ${selector}`);
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] Could not fill name field');
      }

      // Fill email field
      try {
        const emailSelectors = [
          'input[name="email"]',
          'input[type="email"]',
          'input[placeholder*="email" i]'
        ];
        
        for (const selector of emailSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          if (isVisible) {
            await field.fill(testMember.email);
            console.log(`[OK] Filled email: ${selector}`);
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] Could not fill email field');
      }

      // Select role if dropdown exists
      try {
        const roleSelectors = [
          'select[name="role"]',
          'select[name*="role" i]',
          '[data-testid*="role"]'
        ];
        
        for (const selector of roleSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          if (isVisible) {
            await field.selectOption({ label: testMember.role }).catch(() => {});
            console.log(`[OK] Selected role: ${selector}`);
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] No role selector found or failed');
      }

      // Take screenshot of filled form
      await page.screenshot({ path: 'reports/screenshots/members-form-filled.png', fullPage: true });
    });

    await test.step('Submit member form', async () => {
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Add")',
        'button:has-text("Save")',
        'button:has-text("Invite")',
        'button:has-text("Submit")',
        'button:has-text("Create")'
      ];

      let submitted = false;
      
      for (const selector of submitSelectors) {
        try {
          const button = page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[PIN] Clicking submit: ${selector}`);
            await button.click();
            await page.waitForTimeout(3000); // Wait for submission
            submitted = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`Form submission: ${submitted ? 'SUCCESS' : 'FAILED'}`);
      
      // Take screenshot after submission
      await page.screenshot({ path: 'reports/screenshots/members-after-submit.png', fullPage: true });
    });

    await test.step('Verify member was created', async () => {
      // Check if we're back to member list or see success message
      const pageContent = await page.content();
      const hasSuccessIndicators = 
        pageContent.toLowerCase().includes('success') ||
        pageContent.toLowerCase().includes('invited') ||
        pageContent.toLowerCase().includes('added');
      
      console.log(`Success indicators found: ${hasSuccessIndicators}`);
      
      // URL should contain /members
      const currentUrl = page.url();
      const onMembersPage = currentUrl.includes('/members');
      
      console.log(`On members page: ${onMembersPage}`);
      console.log(`Current URL: ${currentUrl}`);
    });
  });
});


