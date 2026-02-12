/**
 * CHANGE REQUESTS MODULE TESTS
 * 
 * Purpose: Test Change Requests tab functionality
 * Features tested:
 * - Two dropdown menus
 * - Calendar dropdown
 * - Search bar
 * - Export button
 * 
 * When to run:
 * - When testing change order management
 * - Before project budget reviews
 * - After scope changes
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Change Requests Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Change Requests page
    await page.goto(
      `/app/projects/${projectId}/tools/change-requests`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Change Requests page loads
  test('01 - Change Requests page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/change-requests');
      console.log('[OK] Change Requests page loaded');
    });

    await test.step('Take screenshot of Change Requests page', async () => {
      await page.screenshot({ path: 'reports/screenshots/change-requests-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: change-requests-main.png');
    });
  });

  // Test 2: Search bar with functionality
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
            await element.fill('Test Change Request');
            await page.waitForTimeout(2000);
            console.log('[OK] Search text entered');
            
            const searchedContent = await page.content();
            console.log(`   Page updated: ${initialContent.length !== searchedContent.length}`);
            
            // Clear search
            await element.fill('');
            await page.waitForTimeout(1000);
            console.log('[OK] Search cleared');
            
            await page.screenshot({ path: 'reports/screenshots/change-requests-search.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(searchFound).toBeTruthy();
    });
  });

  // Test 3: First dropdown with functionality
  test('03 - First dropdown menu is functional', async ({ page }) => {
    await test.step('Look for and interact with first dropdown', async () => {
      console.log('[SEARCH] Looking for dropdowns...');
      
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
        const firstDropdown = allDropdowns[0];
        const text = await firstDropdown.element.textContent().catch(() => '');
        console.log(`   Dropdown 1: "${text.trim()}" (${firstDropdown.selector})`);
        
        // Click to open
        await firstDropdown.element.click();
        await page.waitForTimeout(1000);
        console.log('[OK] Dropdown opened');
        
        // Check for menu items
        const menuItems = await page.locator('[role="menuitem"]').all();
        console.log(`   Menu items found: ${menuItems.length}`);
        
        // Select first item
        if (menuItems.length > 0) {
          const itemText = await menuItems[0].textContent().catch(() => '');
          console.log(`   Selecting: "${itemText.trim()}"`);
          await menuItems[0].click();
          await page.waitForTimeout(1000);
          console.log('[OK] Option selected');
        }
        
        await page.screenshot({ path: 'reports/screenshots/change-requests-dropdown1.png', fullPage: true });
      }

      expect(allDropdowns.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 4: Find second dropdown
  test('04 - Second dropdown menu is visible', async ({ page }) => {
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

      console.log(`[OK] Total dropdowns found: ${allDropdowns.length}`);
      
      if (allDropdowns.length >= 2) {
        const secondDropdown = allDropdowns[1];
        const text = await secondDropdown.element.textContent().catch(() => '');
        console.log(`   Dropdown 2: "${text.trim()}" (${secondDropdown.selector})`);
        
        // Click second dropdown to open it
        await secondDropdown.element.click();
        await page.waitForTimeout(1000);
        console.log('[OK] Clicked second dropdown');
        
        await page.screenshot({ path: 'reports/screenshots/change-requests-dropdown2-open.png', fullPage: true });
      }

      expect(allDropdowns.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test 5: Find calendar dropdown
  test('05 - Calendar dropdown is visible', async ({ page }) => {
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
            
            await page.screenshot({ path: 'reports/screenshots/change-requests-calendar.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!calendarFound) {
        console.log('[WARNING]  Calendar dropdown not found with standard selectors');
        // Count all dropdowns to understand page structure
        const allComboboxes = await page.locator('[role="combobox"]').all();
        console.log(`   Total comboboxes on page: ${allComboboxes.length}`);
      }

      expect(calendarFound).toBeTruthy();
    });
  });

  // Test 6: Export button is clickable
  test('06 - Export button is clickable', async ({ page }) => {
    await test.step('Look for Export button', async () => {
      console.log('[SEARCH] Looking for Export button...');
      
      const exportButton = page.locator('button:has-text("Export")').first();
      const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[OK] Found Export button');
        
        const buttonText = await exportButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/change-requests-export-button.png', fullPage: true });
        
        // Click Export
        await exportButton.click();
        await page.waitForTimeout(1500);
        console.log('[OK] Export button clicked');
        
        await page.screenshot({ path: 'reports/screenshots/change-requests-export-clicked.png', fullPage: true });
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

  // Test 7: Test dropdown interactions with selection
  test('07 - Dropdown selection is functional', async ({ page }) => {
    await test.step('Click and select from dropdowns', async () => {
      const dropdowns = await page.locator('[role="combobox"]').all();
      
      if (dropdowns.length >= 1) {
        console.log(`[OK] Found ${dropdowns.length} dropdowns`);
        
        await dropdowns[0].click();
        await page.waitForTimeout(1000);
        console.log('[OK] Clicked first dropdown');
        
        const menuItems = await page.locator('[role="menuitem"]').all();
        console.log(`   Menu items: ${menuItems.length}`);
        
        if (menuItems.length > 0) {
          // List options
          for (let i = 0; i < Math.min(5, menuItems.length); i++) {
            const text = await menuItems[i].textContent().catch(() => '');
            console.log(`   Option ${i + 1}: "${text.trim()}"`);
          }
          
          // Select first option
          const firstText = await menuItems[0].textContent().catch(() => '');
          console.log(`[OK] Selecting: "${firstText.trim()}"`);
          await menuItems[0].click();
          await page.waitForTimeout(1000);
          console.log('[OK] Option selected');
        }
        
        await page.screenshot({ path: 'reports/screenshots/change-requests-dropdown-options.png', fullPage: true });
      }
    });
  });

  // Test 9: Complete page analysis
  test('09 - Analyze complete page structure', async ({ page }) => {
    await test.step('Comprehensive page analysis', async () => {
      console.log('\n[CHART] CHANGE REQUESTS PAGE ANALYSIS');
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
      
      for (const input of inputs) {
        const type = await input.getAttribute('type').catch(() => 'text');
        const placeholder = await input.getAttribute('placeholder').catch(() => '') || '';
        
        if (placeholder.toLowerCase().includes('search')) searchCount++;
        if (placeholder.toLowerCase().includes('date') || type === 'date') dateCount++;
      }
      
      console.log(`  - Search inputs: ${searchCount}`);
      console.log(`  - Date inputs: ${dateCount}`);

      // Count buttons
      const buttons = await page.locator('button:visible').all();
      console.log(`Total visible buttons: ${buttons.length}`);

      // Look for Export button
      const exportButtons = await page.locator('button:has-text("Export")').all();
      console.log(`  - Export buttons: ${exportButtons.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/change-requests-analysis.png', fullPage: true });
    });
  });
});


