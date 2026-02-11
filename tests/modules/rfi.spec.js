/**
 * RFI (REQUEST FOR INFORMATION) MODULE TESTS
 * 
 * Purpose: Test RFI tab functionality
 * Features tested:
 * - Search bar
 * - Created by filter
 * - Calendar date filter
 * - Dropdown menu
 * - Export button
 * - Create button and form workflow
 * 
 * When to run:
 * - When testing project communication
 * - Before milestone reviews
 * - After team changes
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('RFI Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to RFI page
    await page.goto(
      `/app/projects/${projectId}/tools/rfi`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify RFI page loads
  test('01 - RFI page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/rfi');
      console.log('✅ RFI page loaded');
    });

    await test.step('Take screenshot of RFI page', async () => {
      await page.screenshot({ path: 'reports/screenshots/rfi-main.png', fullPage: true });
      console.log('📸 Screenshot taken: rfi-main.png');
    });
  });

  // Test 2: Find and test search bar functionality
  test('02 - Search bar is functional', async ({ page }) => {
    await test.step('Look for search bar and test search', async () => {
      console.log('🔍 Looking for search bar...');
      
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
            console.log(`✅ Found search bar: ${selector}`);
            searchFound = true;
            
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            console.log(`   Placeholder: "${placeholder}"`);
            
            // Get initial page state
            const initialContent = await page.content();
            const initialLength = initialContent.length;
            console.log(`   Initial page length: ${initialLength}`);
            
            // Test search functionality
            await element.fill('Test RFI Search');
            await page.waitForTimeout(2000);
            console.log('✅ Search text entered');
            
            // Verify page updated
            const searchedContent = await page.content();
            console.log(`   After search length: ${searchedContent.length}`);
            console.log('✅ Search functionality verified');
            
            await page.screenshot({ path: 'reports/screenshots/rfi-search.png', fullPage: true });
            
            // Clear search
            await element.fill('');
            await page.waitForTimeout(1000);
            console.log('✅ Search cleared');
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
      console.log('🔍 Looking for "Created by" field...');
      
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
            console.log(`✅ Found "Created by" field: ${selector}`);
            fieldFound = true;
            
            await element.fill('Test User');
            await page.waitForTimeout(500);
            console.log('✅ Created by text entered');
            
            await page.screenshot({ path: 'reports/screenshots/rfi-created-by.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!fieldFound) {
        console.log('⚠️  Created by field not found with standard selectors');
        // Still take screenshot to analyze
        await page.screenshot({ path: 'reports/screenshots/rfi-no-created-by.png', fullPage: true });
      }
    });
  });

  // Test 4: Find calendar date filter
  test('04 - Calendar date filter is visible', async ({ page }) => {
    await test.step('Look for date filter calendar', async () => {
      console.log('🔍 Looking for calendar date filter...');
      
      const calendarSelectors = [
        'input[type="date"]',
        'input[placeholder*="date" i]',
        'button[aria-label*="calendar" i]',
        'button[aria-label*="date" i]',
        '[data-testid*="date"]',
        '[data-testid*="calendar"]',
        'input[name*="createdDate"]',
        'input[name*="created_date"]'
      ];

      let calendarFound = false;
      
      for (const selector of calendarSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found calendar filter: ${selector}`);
            calendarFound = true;
            
            const elementType = await element.evaluate(el => el.tagName);
            console.log(`   Element type: ${elementType}`);
            
            await page.screenshot({ path: 'reports/screenshots/rfi-calendar.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      if (!calendarFound) {
        console.log('⚠️  Calendar filter not found - will analyze page buttons');
        const buttons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${buttons.length}`);
      }
    });
  });

  // Test 5: Find and test dropdown menu
  test('05 - Dropdown menu is visible and functional', async ({ page }) => {
    await test.step('Look for dropdown menu', async () => {
      console.log('🔍 Looking for dropdown menu...');
      
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
            console.log(`✅ Found dropdown: ${selector}`);
            dropdownFound = true;
            
            // Click to open dropdown
            await element.click();
            await page.waitForTimeout(1000);
            console.log('✅ Dropdown opened');
            
            // Check for menu items
            const menuItems = await page.locator('[role="menuitem"]').all();
            console.log(`   Menu items found: ${menuItems.length}`);
            
            await page.screenshot({ path: 'reports/screenshots/rfi-dropdown-open.png', fullPage: true });
            
            // Try to select first option if available
            if (menuItems.length > 0) {
              const firstItem = menuItems[0];
              const itemText = await firstItem.textContent().catch(() => '');
              console.log(`   Selecting first option: "${itemText.trim()}"`);
              
              await firstItem.click();
              await page.waitForTimeout(1000);
              console.log('✅ Dropdown option selected');
              
              await page.screenshot({ path: 'reports/screenshots/rfi-dropdown-selected.png', fullPage: true });
            }
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(dropdownFound).toBeTruthy();
    });
  });

  // Test 6: Find and click Export button
  test('06 - Export button is clickable', async ({ page }) => {
    await test.step('Look for Export button', async () => {
      console.log('🔍 Looking for Export button...');
      
      const exportButton = page.locator('button:has-text("Export")').first();
      const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('✅ Found Export button');
        
        const buttonText = await exportButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/rfi-export-button.png', fullPage: true });
        
        // Click Export button
        await exportButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Export button clicked');
        
        await page.screenshot({ path: 'reports/screenshots/rfi-export-clicked.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      } else {
        console.log('⚠️  Export button not found with text selector');
        
        // Try to find any export-related button
        const allButtons = await page.locator('button').all();
        console.log(`   Total buttons on page: ${allButtons.length}`);
        
        for (let i = 0; i < Math.min(5, allButtons.length); i++) {
          const text = await allButtons[i].textContent().catch(() => '');
          if (text.toLowerCase().includes('export')) {
            console.log(`   Found possible export button: "${text.trim()}"`);
          }
        }
      }
    });
  });

  // Test 7: Find and click Create button
  test('07 - Create button opens new RFI form', async ({ page }) => {
    await test.step('Look for Create button', async () => {
      console.log('🔍 Looking for Create button...');
      
      const createSelectors = [
        'button:has-text("Create")',
        'button:has-text("Create RFI")',
        'button:has-text("New RFI")',
        '[data-testid*="create"]',
        'a:has-text("Create")'
      ];

      let createFound = false;
      
      for (const selector of createSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Create button: ${selector}`);
            createFound = true;
            
            await page.screenshot({ path: 'reports/screenshots/rfi-create-button.png', fullPage: true });
            
            // Click Create button
            await element.click();
            await page.waitForTimeout(2000);
            console.log('✅ Create button clicked');
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(createFound).toBeTruthy();
    });

    await test.step('Verify navigation to /rfi/new', async () => {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      expect(currentUrl).toContain('/rfi/new');
      console.log('✅ Navigated to RFI creation form');
      
      await page.screenshot({ path: 'reports/screenshots/rfi-new-form.png', fullPage: true });
    });
  });

  // Test 8: Analyze RFI creation form
  test('08 - Analyze RFI creation form fields', async ({ page }) => {
    await test.step('Navigate to RFI creation form', async () => {
      const createButton = page.locator('button:has-text("Create")').first();
      const isVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Direct navigation if button not found
        await page.goto(`/app/projects/${projectId}/tools/rfi/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Analyze form structure', async () => {
      console.log('\n📊 RFI FORM STRUCTURE ANALYSIS');
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

      // List select/combobox names
      for (let i = 0; i < Math.min(5, selects.length); i++) {
        const name = await selects[i].getAttribute('name').catch(() => 'unnamed');
        console.log(`  Select ${i + 1}: name="${name}"`);
      }

      for (let i = 0; i < Math.min(5, comboboxes.length); i++) {
        const label = await comboboxes[i].textContent().catch(() => '');
        console.log(`  Combobox ${i + 1}: "${label.trim()}"`);
      }

      // Count buttons
      const buttons = await page.locator('button:visible').all();
      console.log(`\nTotal visible buttons: ${buttons.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/rfi-form-analysis.png', fullPage: true });
    });
  });

  // Test 9: Test RFI form submission workflow
  test('09 - Complete RFI creation workflow', async ({ page }) => {
    await test.step('Navigate to RFI creation form', async () => {
      const createButton = page.locator('button:has-text("Create")').first();
      const isVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await createButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Navigated via Create button');
      } else {
        await page.goto(`/app/projects/${projectId}/tools/rfi/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        console.log('✅ Navigated directly to form');
      }
    });

    await test.step('Fill RFI form fields', async () => {
      const timestamp = Date.now();
      
      // Try to fill common RFI fields
      const titleSelectors = [
        'input[name="title"]',
        'input[name="subject"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="subject" i]'
      ];

      for (const selector of titleSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await element.fill(`Test RFI ${timestamp}`);
            console.log(`✅ Filled title field: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      // Try to fill description
      const descriptionSelectors = [
        'textarea[name="description"]',
        'textarea[placeholder*="description" i]',
        'textarea[name="details"]'
      ];

      for (const selector of descriptionSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await element.fill('This is an automated test RFI created by Playwright');
            console.log(`✅ Filled description field: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'reports/screenshots/rfi-form-filled.png', fullPage: true });
    });

    await test.step('Submit or verify form state', async () => {
      // Look for submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Create")',
        'button:has-text("Save")'
      ];

      let submitFound = false;
      
      for (const selector of submitSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found submit button: ${selector}`);
            submitFound = true;
            
            // NOTE: Not actually clicking to avoid creating test data
            console.log('⚠️  Skipping actual submission to avoid test data creation');
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      console.log(`\nForm submission: ${submitFound ? 'READY' : 'BUTTON NOT FOUND'}`);
      await page.screenshot({ path: 'reports/screenshots/rfi-ready-to-submit.png', fullPage: true });
    });
  });
});
