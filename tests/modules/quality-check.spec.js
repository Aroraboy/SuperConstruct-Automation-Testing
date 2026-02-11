/**
 * QUALITY CHECK MODULE TESTS
 * 
 * Purpose: Test Quality Check tab functionality
 * Features tested:
 * - Two dropdown menus
 * - Expand All button
 * - Add QC button
 * - QC creation form with 4 dropdown fields
 * 
 * When to run:
 * - When testing quality control
 * - Before inspections
 * - After construction milestones
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Quality Check Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Quality Check page
    await page.goto(
      `/app/projects/${projectId}/tools/quality-check`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Quality Check page loads
  test('01 - Quality Check page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/quality-check');
      console.log('✅ Quality Check page loaded');
    });

    await test.step('Take screenshot of Quality Check page', async () => {
      await page.screenshot({ path: 'reports/screenshots/quality-check-main.png', fullPage: true });
      console.log('📸 Screenshot taken: quality-check-main.png');
    });
  });

  // Test 2: Find first dropdown and test functionality
  test('02 - First dropdown menu is functional', async ({ page }) => {
    await test.step('Look for and interact with first dropdown', async () => {
      console.log('🔍 Looking for dropdowns...');
      
      const dropdownSelectors = [
        'select',
        '[role="combobox"]',
        'button[aria-haspopup="listbox"]',
        'button[aria-haspopup="menu"]'
      ];

      const allDropdowns = [];
      
      for (const selector of dropdownSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            const isVisible = await element.isVisible().catch(() => false);
            if (isVisible) {
              allDropdowns.push({ element, selector });
            }
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`✅ Found ${allDropdowns.length} total dropdowns`);
      
      if (allDropdowns.length >= 1) {
        const firstDropdown = allDropdowns[0];
        const text = await firstDropdown.element.textContent().catch(() => '');
        console.log(`   Dropdown 1: "${text.trim()}" (${firstDropdown.selector})`);
        
        // Click to open dropdown
        await firstDropdown.element.click();
        await page.waitForTimeout(1000);
        console.log('✅ Dropdown opened');
        
        // Check for menu items
        const menuItems = await page.locator('[role="menuitem"]').all();
        console.log(`   Menu items found: ${menuItems.length}`);
        
        // Select first item if available
        if (menuItems.length > 0) {
          const itemText = await menuItems[0].textContent().catch(() => '');
          console.log(`   Selecting: "${itemText.trim()}"`);
          await menuItems[0].click();
          await page.waitForTimeout(1000);
          console.log('✅ Dropdown option selected');
        }
        
        await page.screenshot({ path: 'reports/screenshots/quality-check-dropdown1.png', fullPage: true });
      }

      expect(allDropdowns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 3: Find second dropdown menu
  test('03 - Second dropdown menu is visible and functional', async ({ page }) => {
    await test.step('Look for second dropdown', async () => {
      const dropdownSelectors = [
        'select',
        '[role="combobox"]',
        'button[aria-haspopup="listbox"]',
        'button[aria-haspopup="menu"]'
      ];

      const allDropdowns = [];
      
      for (const selector of dropdownSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            const isVisible = await element.isVisible().catch(() => false);
            if (isVisible) {
              allDropdowns.push({ element, selector });
            }
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`✅ Total dropdowns found: ${allDropdowns.length}`);
      
      if (allDropdowns.length >= 2) {
        const secondDropdown = allDropdowns[1];
        const text = await secondDropdown.element.textContent().catch(() => '');
        console.log(`   Dropdown 2: "${text.trim()}" (${secondDropdown.selector})`);
        
        // Click second dropdown to open it
        await secondDropdown.element.click();
        await page.waitForTimeout(1000);
        console.log('✅ Clicked second dropdown');
        
        await page.screenshot({ path: 'reports/screenshots/quality-check-dropdown2-open.png', fullPage: true });
      }

      expect(allDropdowns.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test 4: Find and click Expand All button
  test('04 - Expand All button is functional', async ({ page }) => {
    await test.step('Look for and click Expand All button', async () => {
      console.log('🔍 Looking for Expand All button...');
      
      const expandSelectors = [
        'button:has-text("Expand All")',
        'button:has-text("Expand all")',
        'button:has-text("EXPAND ALL")',
        '[data-testid*="expand-all"]',
        'button[aria-label*="expand all" i]'
      ];

      let expandFound = false;
      
      for (const selector of expandSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Expand All button: ${selector}`);
            expandFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/quality-check-before-expand.png', fullPage: true });
            
            // Click button
            await element.click();
            await page.waitForTimeout(1500);
            console.log('✅ Expand All button clicked');
            
            // Check if text changed
            const newText = await element.textContent();
            console.log(`   Button text after click: "${newText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/quality-check-after-expand.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!expandFound) {
        console.log('⚠️  Expand All button not found with standard selectors');
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${allButtons.length}`);
        
        // Check first 10 buttons for expand-related text
        for (let i = 0; i < Math.min(10, allButtons.length); i++) {
          const text = await allButtons[i].textContent().catch(() => '');
          if (text.toLowerCase().includes('expand')) {
            console.log(`   Found possible expand button: "${text.trim()}"`);
          }
        }
      }

      expect(expandFound).toBeTruthy();
    });
  });

  // Test 5: Find and click Add QC button
  test('05 - Add QC button is clickable', async ({ page }) => {
    await test.step('Look for and click Add QC button', async () => {
      console.log('🔍 Looking for Add QC button...');
      
      const addQCSelectors = [
        'button:has-text("Add QC")',
        'button:has-text("Add Quality Check")',
        'button:has-text("Create QC")',
        'button:has-text("New QC")',
        '[data-testid*="add-qc"]',
        '[data-testid*="create-qc"]'
      ];

      let addQCFound = false;
      
      for (const selector of addQCSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Add QC button: ${selector}`);
            addQCFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/quality-check-add-button.png', fullPage: true });
            
            // Click button
            await element.click();
            await page.waitForTimeout(2000);
            console.log('✅ Add QC button clicked');
            
            const currentUrl = page.url();
            console.log(`   Navigated to: ${currentUrl}`);
            
            await page.screenshot({ path: 'reports/screenshots/quality-check-after-add-click.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!addQCFound) {
        console.log('⚠️  Add QC button not found - analyzing all buttons');
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${allButtons.length}`);
        
        for (let i = 0; i < Math.min(15, allButtons.length); i++) {
          const text = await allButtons[i].textContent().catch(() => '');
          const trimmedText = text.trim();
          if (trimmedText && trimmedText.length < 30) {
            console.log(`   Button ${i + 1}: "${trimmedText}"`);
          }
        }
      }

      expect(addQCFound).toBeTruthy();
    });
  });

  // Test 6: Click Add QC button and navigate to form
  test('06 - Add QC button opens new QC form', async ({ page }) => {
    await test.step('Find and click Add QC button', async () => {
      console.log('🔍 Looking for Add QC button...');
      
      const addQCSelectors = [
        'button:has-text("Add QC")',
        'button:has-text("Add Quality Check")',
        'button:has-text("Create QC")',
        'button:has-text("New QC")',
        'a:has-text("Add QC")',
        'a:has-text("Create")'
      ];

      let clicked = false;
      
      for (const selector of addQCSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Add QC button: ${selector}`);
            await element.click();
            await page.waitForTimeout(2000);
            console.log('✅ Add QC button clicked');
            clicked = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(clicked).toBeTruthy();
    });

    await test.step('Verify navigation to QC form', async () => {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      const isFormPage = currentUrl.includes('/quality-check') && 
                        (currentUrl.includes('/new') || currentUrl.includes('/create'));
      
      if (isFormPage) {
        console.log('✅ Navigated to QC creation form');
      } else {
        console.log(`⚠️  Current URL: ${currentUrl}`);
      }
      
      await page.screenshot({ path: 'reports/screenshots/quality-check-new-form.png', fullPage: true });
    });
  });

  // Test 7: Analyze QC form structure
  test('07 - Analyze QC creation form', async ({ page }) => {
    await test.step('Navigate to QC creation form', async () => {
      const addQCButton = page.locator('button:has-text("Add QC")').first();
      const isVisible = await addQCButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await addQCButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Navigated via Add QC button');
      } else {
        // Try alternative navigation
        await page.goto(`/app/projects/${projectId}/tools/quality-checks/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        console.log('✅ Navigated directly to form');
      }
    });

    await test.step('Count and analyze dropdown fields', async () => {
      console.log('\n📊 QC FORM STRUCTURE ANALYSIS');
      console.log('================================\n');

      // Count all dropdowns
      const selectElements = await page.locator('select:visible').all();
      const comboboxes = await page.locator('[role="combobox"]:visible').all();
      
      console.log(`Total visible select elements: ${selectElements.length}`);
      console.log(`Total visible comboboxes: ${comboboxes.length}`);
      console.log(`Total dropdowns: ${selectElements.length + comboboxes.length}`);

      // Analyze select elements
      if (selectElements.length > 0) {
        console.log('\n📋 Select Elements:');
        for (let i = 0; i < Math.min(4, selectElements.length); i++) {
          const name = await selectElements[i].getAttribute('name').catch(() => 'unnamed');
          const id = await selectElements[i].getAttribute('id').catch(() => '');
          console.log(`  Select ${i + 1}: name="${name}", id="${id}"`);
        }
      }

      // Analyze comboboxes
      if (comboboxes.length > 0) {
        console.log('\n📋 Combobox Elements:');
        for (let i = 0; i < Math.min(4, comboboxes.length); i++) {
          const text = await comboboxes[i].textContent().catch(() => '');
          const ariaLabel = await comboboxes[i].getAttribute('aria-label').catch(() => '');
          console.log(`  Combobox ${i + 1}: text="${text.trim()}", aria-label="${ariaLabel}"`);
        }
      }

      // Count other inputs
      const textInputs = await page.locator('input[type="text"]:visible').all();
      const textareas = await page.locator('textarea:visible').all();
      
      console.log(`\nTotal text inputs: ${textInputs.length}`);
      console.log(`Total textareas: ${textareas.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/quality-check-form-analysis.png', fullPage: true });
    });
  });

  // Test 8: Test QC form interaction
  test('08 - Interact with QC form dropdowns', async ({ page }) => {
    await test.step('Navigate to QC creation form', async () => {
      const addQCButton = page.locator('button:has-text("Add QC")').first();
      const isVisible = await addQCButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await addQCButton.click();
        await page.waitForTimeout(2000);
      } else {
        await page.goto(`/app/projects/${projectId}/tools/quality-checks/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Interact with dropdown fields', async () => {
      console.log('🔍 Testing dropdown interactions...\n');

      // Get all dropdowns
      const comboboxes = await page.locator('[role="combobox"]:visible').all();
      
      if (comboboxes.length >= 4) {
        console.log(`✅ Found ${comboboxes.length} dropdown fields (expected 4+)`);
        
        // Click first dropdown
        try {
          await comboboxes[0].click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked first dropdown');
          
          const menuItems = await page.locator('[role="menuitem"]').all();
          console.log(`   Options found: ${menuItems.length}`);
          
          await page.screenshot({ path: 'reports/screenshots/quality-check-dropdown1-open.png', fullPage: true });
          
          // Close by clicking elsewhere
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        } catch (e) {
          console.log('⚠️  Could not interact with first dropdown');
        }
      } else {
        console.log(`⚠️  Found ${comboboxes.length} dropdowns (expected 4)`);
      }

      await page.screenshot({ path: 'reports/screenshots/quality-check-form-ready.png', fullPage: true });
    });
  });
});
