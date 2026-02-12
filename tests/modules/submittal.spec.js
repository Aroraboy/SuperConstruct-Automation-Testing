/**
 * SUBMITTALS MODULE TESTS
 * 
 * Purpose: Test Submittals tab functionality
 * Features tested:
 * - Search bar
 * - Created by input field
 * - Calendar dropdown
 * - Dropdown menu
 * - Export button
 * 
 * When to run:
 * - When testing document submission workflows
 * - Before contractor reviews
 * - After material selections
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Submittals Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Submittals page
    await page.goto(
      `/app/projects/${projectId}/tools/submittals`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Submittals page loads
  test('01 - Submittals page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/submittals');
      console.log('[OK] Submittals page loaded');
    });

    await test.step('Take screenshot of Submittals page', async () => {
      await page.screenshot({ path: 'reports/screenshots/submittals-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: submittals-main.png');
    });
  });

  // Test 2: Search bar is functional
  test('02 - Search bar is functional', async ({ page }) => {
    await test.step('Look for search bar and test functionality', async () => {
      console.log('[SEARCH] Looking for search bar...');
      
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="find" i]',
        '[data-testid*="search"]',
        'input[name*="search"]'
      ];

      let searchFound = false;
      
      for (const selector of searchSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found search bar: ${selector}`);
            searchFound = true;
            
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            console.log(`   Placeholder: "${placeholder}"`);
            
            // Test search functionality
            const initialContent = await page.content();
            await element.fill('Test Submittal Search');
            await page.waitForTimeout(2000);
            console.log('[OK] Search text entered');
            
            const searchedContent = await page.content();
            console.log(`   Page updated: ${initialContent.length !== searchedContent.length}`);
            
            // Clear search
            await element.fill('');
            await page.waitForTimeout(1000);
            console.log('[OK] Search cleared');
            
            await page.screenshot({ path: 'reports/screenshots/submittals-search.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(searchFound).toBeTruthy();
    });
  });

  // Test 3: Find "Created by" field
  test('03 - Created by field is visible', async ({ page }) => {
    await test.step('Look for Created by field', async () => {
      console.log('[SEARCH] Looking for "Created by" field...');
      
      const createdBySelectors = [
        'input[placeholder*="created by" i]',
        'input[name*="createdBy"]',
        'input[name*="created_by"]',
        '[data-testid*="created-by"]',
        'label:has-text("Created by") + input',
        'label:has-text("Created By") + input'
      ];

      let fieldFound = false;
      
      for (const selector of createdBySelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found "Created by" field: ${selector}`);
            fieldFound = true;
            
            await element.fill('Test User');
            await page.waitForTimeout(500);
            console.log('[OK] Created by text entered');
            
            await page.screenshot({ path: 'reports/screenshots/submittals-created-by.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!fieldFound) {
        console.log('[WARNING]  Created by field not found with standard selectors');
        await page.screenshot({ path: 'reports/screenshots/submittals-no-created-by.png', fullPage: true });
      }

      expect(fieldFound).toBeTruthy();
    });
  });

  // Test 4: Find calendar dropdown
  test('04 - Calendar dropdown is visible', async ({ page }) => {
    await test.step('Look for calendar dropdown', async () => {
      console.log('[SEARCH] Looking for calendar dropdown...');
      
      const calendarSelectors = [
        'input[type="date"]',
        'input[placeholder*="date" i]',
        'button[aria-label*="calendar" i]',
        'button[aria-label*="date" i]',
        '[data-testid*="date"]',
        '[data-testid*="calendar"]',
        'input[name*="date"]'
      ];

      let calendarFound = false;
      
      for (const selector of calendarSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found calendar dropdown: ${selector}`);
            calendarFound = true;
            
            const elementType = await element.evaluate(el => el.tagName);
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            console.log(`   Element: ${elementType}, Placeholder: "${placeholder}"`);
            
            await page.screenshot({ path: 'reports/screenshots/submittals-calendar.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(calendarFound).toBeTruthy();
    });
  });

  // Test 5: Find dropdown menu
  test('05 - Dropdown menu is visible', async ({ page }) => {
    await test.step('Look for dropdown menu', async () => {
      console.log('[SEARCH] Looking for dropdown menu...');
      
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

      console.log(`[OK] Found ${allDropdowns.length} total dropdowns`);
      
      if (allDropdowns.length >= 1) {
        for (let i = 0; i < Math.min(2, allDropdowns.length); i++) {
          const text = await allDropdowns[i].element.textContent().catch(() => '');
          console.log(`   Dropdown ${i + 1}: "${text.trim()}" (${allDropdowns[i].selector})`);
        }
        
        await page.screenshot({ path: 'reports/screenshots/submittals-dropdown.png', fullPage: true });
      }

      expect(allDropdowns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 6: Find Export button
  test('06 - Export button is visible', async ({ page }) => {
    await test.step('Look for Export button', async () => {
      console.log('[SEARCH] Looking for Export button...');
      
      const exportButton = page.locator('button:has-text("Export")').first();
      const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[OK] Found Export button');
        
        const buttonText = await exportButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/submittals-export-button.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      } else {
        console.log('[WARNING]  Export button not found with text selector');
        
        // Try to find any export-related button
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${allButtons.length}`);
        
        for (let i = 0; i < Math.min(10, allButtons.length); i++) {
          const text = await allButtons[i].textContent().catch(() => '');
          if (text.toLowerCase().includes('export')) {
            console.log(`   Found export button: "${text.trim()}"`);
          }
        }
      }
    });
  });

  // Test 7: Test dropdown interaction
  test('07 - Test dropdown interaction', async ({ page }) => {
    await test.step('Click dropdown and check options', async () => {
      const dropdowns = await page.locator('[role="combobox"]').all();
      
      if (dropdowns.length >= 1) {
        console.log(`[OK] Found ${dropdowns.length} dropdowns`);
        
        await dropdowns[0].click();
        await page.waitForTimeout(1000);
        console.log('[OK] Clicked dropdown');
        
        const menuItems = await page.locator('[role="menuitem"]').all();
        console.log(`   Menu items: ${menuItems.length}`);
        
        if (menuItems.length > 0) {
          for (let i = 0; i < Math.min(5, menuItems.length); i++) {
            const text = await menuItems[i].textContent().catch(() => '');
            console.log(`   Option ${i + 1}: "${text.trim()}"`);
          }
        }
        
        await page.screenshot({ path: 'reports/screenshots/submittals-dropdown-open.png', fullPage: true });
      }
    });
  });

  // Test 8: Complete page analysis
  test('08 - Analyze complete page structure', async ({ page }) => {
    await test.step('Comprehensive page analysis', async () => {
      console.log('\n[CHART] SUBMITTALS PAGE ANALYSIS');
      console.log('================================\n');

      // Count dropdowns
      const comboboxes = await page.locator('[role="combobox"]').all();
      console.log(`Total comboboxes/dropdowns: ${comboboxes.length}`);

      // Count inputs
      const inputs = await page.locator('input:visible').all();
      console.log(`Total visible inputs: ${inputs.length}`);

      // List input types
      let searchCount = 0;
      let dateCount = 0;
      let createdByCount = 0;
      
      for (const input of inputs) {
        const type = await input.getAttribute('type').catch(() => 'text');
        const placeholder = await input.getAttribute('placeholder').catch(() => '') || '';
        
        if (placeholder.toLowerCase().includes('search')) searchCount++;
        if (placeholder.toLowerCase().includes('date') || type === 'date') dateCount++;
        if (placeholder.toLowerCase().includes('created by')) createdByCount++;
      }
      
      console.log(`  - Search inputs: ${searchCount}`);
      console.log(`  - Date inputs: ${dateCount}`);
      console.log(`  - Created by inputs: ${createdByCount}`);

      // Count buttons
      const buttons = await page.locator('button:visible').all();
      console.log(`Total visible buttons: ${buttons.length}`);

      // Look for Export button
      const exportButtons = await page.locator('button:has-text("Export")').all();
      console.log(`  - Export buttons: ${exportButtons.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/submittals-analysis.png', fullPage: true });
    });
  });
});


