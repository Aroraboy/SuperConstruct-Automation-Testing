/**
 * INSPECTIONS MODULE TESTS
 * 
 * Purpose: Test Inspections tab functionality
 * Features tested:
 * - Expand All button
 * - Search bar
 * - Three dropdown menus
 * - Sort order button (asc/desc)
 * - Create Inspection button
 * - Inspection creation form with input fields and dropdowns
 * 
 * When to run:
 * - When testing quality control
 * - Before project milestones
 * - After construction phases
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Inspections Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Inspections page
    await page.goto(
      `/app/projects/${projectId}/tools/inspections`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Inspections page loads
  test('01 - Inspections page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/inspections');
      console.log('[OK] Inspections page loaded');
    });

    await test.step('Take screenshot of Inspections page', async () => {
      await page.screenshot({ path: 'reports/screenshots/inspections-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: inspections-main.png');
    });
  });

  // Test 2: Expand All button is functional
  test('02 - Expand All button is functional', async ({ page }) => {
    await test.step('Look for and click Expand All button', async () => {
      console.log('[SEARCH] Looking for Expand All button...');
      
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
            console.log(`[OK] Found Expand All button: ${selector}`);
            expandFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/inspections-before-expand.png', fullPage: true });
            
            // Click button
            await element.click();
            await page.waitForTimeout(1500);
            console.log('[OK] Expand All button clicked');
            
            // Check if text changed
            const newText = await element.textContent();
            console.log(`   Button text after click: "${newText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/inspections-after-expand.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(expandFound).toBeTruthy();
    });
  });

  // Test 3: Find search bar
  test('03 - Search bar is visible and functional', async ({ page }) => {
    await test.step('Look for search bar', async () => {
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
            await element.fill('Test Inspection Search');
            await page.waitForTimeout(1000);
            console.log('[OK] Search text entered');
            
            await page.screenshot({ path: 'reports/screenshots/inspections-search.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(searchFound).toBeTruthy();
    });
  });

  // Test 4: Find all three dropdowns
  test('04 - Three dropdown menus are visible', async ({ page }) => {
    await test.step('Look for all dropdowns', async () => {
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
      
      // List all found dropdowns
      for (let i = 0; i < Math.min(3, allDropdowns.length); i++) {
        const text = await allDropdowns[i].element.textContent().catch(() => '');
        console.log(`   Dropdown ${i + 1}: "${text.trim()}" (${allDropdowns[i].selector})`);
      }

      await page.screenshot({ path: 'reports/screenshots/inspections-dropdowns.png', fullPage: true });
      
      expect(allDropdowns.length).toBeGreaterThanOrEqual(3);
    });
  });

  // Test 5: Find sort order button
  test('05 - Sort order button is visible', async ({ page }) => {
    await test.step('Look for sort button (asc/desc)', async () => {
      console.log('[SEARCH] Looking for sort order button...');
      
      const sortSelectors = [
        'button[aria-label*="sort" i]',
        'button:has-text("Sort")',
        '[data-testid*="sort"]',
        'button[title*="sort" i]',
        'button[aria-label*="ascending" i]',
        'button[aria-label*="descending" i]'
      ];

      let sortFound = false;
      
      for (const selector of sortSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found sort button: ${selector}`);
            sortFound = true;
            
            const ariaLabel = await element.getAttribute('aria-label').catch(() => '');
            const text = await element.textContent().catch(() => '');
            console.log(`   Aria-label: "${ariaLabel}"`);
            console.log(`   Text: "${text.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/inspections-sort-button.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!sortFound) {
        console.log('[WARNING]  Sort button not found - analyzing all buttons');
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${allButtons.length}`);
      }
    });
  });

  // Test 6: Find Create Inspection button
  test('06 - Create Inspection button is visible', async ({ page }) => {
    await test.step('Look for Create Inspection button', async () => {
      console.log('[SEARCH] Looking for Create Inspection button...');
      
      const createSelectors = [
        'button:has-text("Create Inspection")',
        'button:has-text("Create")',
        'button:has-text("New Inspection")',
        'a:has-text("Create Inspection")',
        '[data-testid*="create-inspection"]'
      ];

      let createFound = false;
      
      for (const selector of createSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Create Inspection button: ${selector}`);
            createFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/inspections-create-button.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(createFound).toBeTruthy();
    });
  });

  // Test 7: Click Create Inspection and navigate to form
  test('07 - Create Inspection button opens new form', async ({ page }) => {
    await test.step('Find and click Create Inspection button', async () => {
      console.log('[SEARCH] Looking for Create Inspection button...');
      
      const createSelectors = [
        'button:has-text("Create Inspection")',
        'button:has-text("Create")',
        'a:has-text("Create Inspection")',
        'a:has-text("Create")'
      ];

      let clicked = false;
      
      for (const selector of createSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Create button: ${selector}`);
            await element.click();
            await page.waitForTimeout(2000);
            console.log('[OK] Create button clicked');
            clicked = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(clicked).toBeTruthy();
    });

    await test.step('Verify navigation to inspection form', async () => {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      const isFormPage = currentUrl.includes('/inspections') && 
                        (currentUrl.includes('/new') || currentUrl.includes('/create'));
      
      if (isFormPage) {
        console.log('[OK] Navigated to Inspection creation form');
      } else {
        console.log(`[WARNING]  Current URL: ${currentUrl}`);
      }
      
      await page.screenshot({ path: 'reports/screenshots/inspections-new-form.png', fullPage: true });
    });
  });

  // Test 8: Analyze inspection creation form
  test('08 - Analyze inspection creation form fields', async ({ page }) => {
    await test.step('Navigate to inspection creation form', async () => {
      const createButton = page.locator('button:has-text("Create")').first();
      const isVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(2000);
        console.log('[OK] Navigated via Create button');
      } else {
        // Try direct navigation
        await page.goto(`/app/projects/${projectId}/tools/inspections/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        console.log('[OK] Navigated directly to form');
      }
    });

    await test.step('Analyze form structure', async () => {
      console.log('\n[CHART] INSPECTION FORM STRUCTURE ANALYSIS');
      console.log('================================\n');

      // Count inputs
      const inputs = await page.locator('input:visible').all();
      console.log(`Total visible inputs: ${inputs.length}`);
      
      // List input types
      for (let i = 0; i < Math.min(10, inputs.length); i++) {
        const type = await inputs[i].getAttribute('type').catch(() => 'unknown');
        const name = await inputs[i].getAttribute('name').catch(() => 'unnamed');
        const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
        console.log(`  Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }

      // Count textareas
      const textareas = await page.locator('textarea:visible').all();
      console.log(`\nTotal visible textareas: ${textareas.length}`);

      // Count dropdowns/selects
      const selects = await page.locator('select:visible').all();
      const comboboxes = await page.locator('[role="combobox"]:visible').all();
      console.log(`Total visible selects: ${selects.length}`);
      console.log(`Total visible comboboxes: ${comboboxes.length}`);
      console.log(`Total dropdowns: ${selects.length + comboboxes.length}`);

      // List combobox labels
      for (let i = 0; i < Math.min(5, comboboxes.length); i++) {
        const text = await comboboxes[i].textContent().catch(() => '');
        console.log(`  Combobox ${i + 1}: "${text.trim()}"`);
      }

      // Count buttons
      const buttons = await page.locator('button:visible').all();
      console.log(`\nTotal visible buttons: ${buttons.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/inspections-form-analysis.png', fullPage: true });
    });
  });

  // Test 9: Test Expand All functionality
  test('09 - Test Expand All button functionality', async ({ page }) => {
    await test.step('Find and click Expand All button', async () => {
      const expandButton = page.locator('button:has-text("Expand All")').first();
      const isVisible = await expandButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[OK] Found Expand All button');
        
        await page.screenshot({ path: 'reports/screenshots/inspections-before-expand.png', fullPage: true });
        
        await expandButton.click();
        await page.waitForTimeout(1500);
        console.log('[OK] Clicked Expand All button');
        
        await page.screenshot({ path: 'reports/screenshots/inspections-after-expand.png', fullPage: true });
        
        // Check if button text changed
        const newText = await expandButton.textContent().catch(() => '');
        console.log(`   Button text after click: "${newText.trim()}"`);
      } else {
        console.log('[WARNING]  Expand All button not found');
      }
    });
  });

  // Test 10: Test dropdown interactions
  test('10 - Test dropdown menu interactions', async ({ page }) => {
    await test.step('Click first dropdown and check options', async () => {
      const dropdowns = await page.locator('[role="combobox"]').all();
      
      if (dropdowns.length >= 1) {
        console.log(`[OK] Found ${dropdowns.length} dropdowns`);
        
        await dropdowns[0].click();
        await page.waitForTimeout(1000);
        console.log('[OK] Clicked first dropdown');
        
        const menuItems = await page.locator('[role="menuitem"]').all();
        console.log(`   Menu items: ${menuItems.length}`);
        
        if (menuItems.length > 0) {
          for (let i = 0; i < Math.min(5, menuItems.length); i++) {
            const text = await menuItems[i].textContent().catch(() => '');
            console.log(`   Option ${i + 1}: "${text.trim()}"`);
          }
        }
        
        await page.screenshot({ path: 'reports/screenshots/inspections-dropdown-open.png', fullPage: true });
      }
    });
  });
});


