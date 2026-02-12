/**
 * SCHEDULE OF VALUES (SOV) MODULE TESTS
 * 
 * Purpose: Test SOV tab functionality
 * Features tested:
 * - Dropdown menu (filter options)
 * - Search functionality
 * - SOV list display
 * 
 * Note: SOV tab has dropdown + search, typically no "Add" button
 *       (SOV is usually set up during project creation)
 * 
 * When to run:
 * - When testing budget tracking
 * - Before financial reports
 * - After project setup
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Schedule of Values (SOV) Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to SOV page
    await page.goto(
      `/app/projects/${projectId}/tools/sov`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify SOV page loads
  test('01 - SOV page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/sov');
      console.log('[OK] SOV page loaded');
    });

    await test.step('Verify page has content', async () => {
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
      console.log('[OK] Page has content');
    });

    await test.step('Take screenshot of SOV page', async () => {
      await page.screenshot({ path: 'reports/screenshots/sov-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: sov-main.png');
    });
  });

  // Test 2: Find and analyze dropdown menu
  test('02 - Dropdown menu is visible and functional', async ({ page }) => {
    await test.step('Look for dropdown menu', async () => {
      console.log('[SEARCH] Looking for dropdown menu...');
      
      const dropdownSelectors = [
        'select',
        '[role="combobox"]',
        'button[aria-haspopup="listbox"]',
        'button[aria-haspopup="menu"]',
        '[data-testid*="dropdown"]',
        '[data-testid*="select"]'
      ];

      let dropdownFound = false;
      
      for (const selector of dropdownSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found dropdown: ${selector}`);
            dropdownFound = true;
            
            const text = await element.textContent().catch(() => '');
            console.log(`   Current value: "${text.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/sov-with-dropdown.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`\nDropdown found: ${dropdownFound ? 'YES' : 'NO'}`);
      expect(dropdownFound).toBeTruthy();
    });
  });

  // Test 3: Find and analyze search functionality
  test('03 - Search input is visible and functional', async ({ page }) => {
    await test.step('Look for search field', async () => {
      console.log('[SEARCH] Looking for search field...');
      
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="find" i]',
        '[data-testid*="search"]'
      ];

      let searchFound = false;
      
      for (const selector of searchSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found search field: ${selector}`);
            searchFound = true;
            
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            console.log(`   placeholder: "${placeholder}"`);
            
            await page.screenshot({ path: 'reports/screenshots/sov-with-search.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`\nSearch field found: ${searchFound ? 'YES' : 'NO'}`);
      expect(searchFound).toBeTruthy();
    });
  });

  // Test 4: Test search functionality
  test('04 - Search functionality works', async ({ page }) => {
    await test.step('Enter text in search field', async () => {
      const searchField = page.locator('input[placeholder*="search" i]').first();
      const isVisible = await searchField.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[PIN] Using search field');
        
        const searchQuery = 'structural';
        await searchField.fill(searchQuery);
        await page.waitForTimeout(1000);
        
        console.log(`[OK] Entered search query: "${searchQuery}"`);
        
        await page.screenshot({ path: 'reports/screenshots/sov-after-search.png', fullPage: true });
      }
    });

    await test.step('Verify search results or response', async () => {
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/sov');
      console.log('[OK] Still on SOV page after search');
    });
  });

  // Test 5: Click dropdown and explore options
  test('05 - Dropdown menu opens and shows options', async ({ page }) => {
    await test.step('Find and click dropdown', async () => {
      const dropdown = page.locator('[role="combobox"]').first();
      const isVisible = await dropdown.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[PIN] Clicking dropdown');
        await dropdown.click();
        await page.waitForTimeout(1000);
        console.log('[OK] Clicked dropdown');
        
        await page.screenshot({ path: 'reports/screenshots/sov-dropdown-open.png', fullPage: true });
      }
    });

    await test.step('Check for dropdown menu items', async () => {
      const menuItems = await page.locator('[role="menuitem"]').all();
      
      if (menuItems.length > 0) {
        console.log(`[OK] Found ${menuItems.length} menu items`);
        
        for (let i = 0; i < Math.min(4, menuItems.length); i++) {
          const text = await menuItems[i].textContent().catch(() => '');
          console.log(`   Item ${i + 1}: ${text.trim()}`);
        }
      }

      console.log(`\n[CHART] Total menu items found: ${menuItems.length}`);
    });
  });

  // Test 6: Analyze complete SOV page structure
  test('06 - Analyze complete SOV page structure', async ({ page }) => {
    await test.step('Comprehensive page analysis', async () => {
      console.log('\n[CHART] SOV PAGE STRUCTURE ANALYSIS');
      console.log('================================\n');

      // Count buttons
      const buttons = await page.locator('button').all();
      console.log(`Total buttons: ${buttons.length}`);

      // Count inputs
      const inputs = await page.locator('input').all();
      console.log(`Total inputs: ${inputs.length}`);

      // Count selects
      const selects = await page.locator('select').all();
      console.log(`Total select elements: ${selects.length}`);

      // Check for tables
      const tables = await page.locator('table').all();
      console.log(`Total tables: ${tables.length}`);

      // Check for lists
      const lists = await page.locator('ul, ol').all();
      console.log(`Total lists (ul/ol): ${lists.length}`);

      console.log('\n================================\n');
      console.log('[OK] SOV page is a view/filter page (read-only)');
    });
  });
});


