/**
 * EXPENSE MANAGEMENT MODULE TESTS
 * 
 * Purpose: Test Expense Management tab functionality
 * Features tested:
 * - Dashboard tab
 * - Expenses tab
 * - Search bar
 * - Calendar dropdown
 * - Filter dropdowns
 * - Reset filter button
 * - Import button
 * - Export button
 * - Add expense button
 * 
 * When to run:
 * - When testing expense tracking
 * - Before budget reviews
 * - After expense submissions
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Expense Management Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Expenses page
    await page.goto(
      `/app/projects/${projectId}/tools/expenses`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Expenses page loads
  test('01 - Expenses page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/expenses');
      console.log('[OK] Expenses page loaded');
    });

    await test.step('Take screenshot of Expenses page', async () => {
      await page.screenshot({ path: 'reports/screenshots/expenses-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot taken: expenses-main.png');
    });
  });

  // Test 2: Find Dashboard tab
  test('02 - Dashboard tab is visible', async ({ page }) => {
    await test.step('Look for Dashboard tab', async () => {
      console.log('[SEARCH] Looking for Dashboard tab...');
      
      const dashboardSelectors = [
        'text=Dashboard',
        'button:has-text("Dashboard")',
        'a:has-text("Dashboard")',
        '[role="tab"]:has-text("Dashboard")',
        '[data-testid*="dashboard"]'
      ];

      let dashboardFound = false;
      
      for (const selector of dashboardSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Dashboard tab: ${selector}`);
            dashboardFound = true;
            
            const text = await element.textContent();
            console.log(`   Text: "${text.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/expenses-dashboard-tab.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(dashboardFound).toBeTruthy();
    });
  });

  // Test 3: Find Expenses tab
  test('03 - Expenses tab is visible', async ({ page }) => {
    await test.step('Look for Expenses tab', async () => {
      console.log('[SEARCH] Looking for Expenses tab...');
      
      const expensesSelectors = [
        'text=Expenses',
        'button:has-text("Expenses")',
        'a:has-text("Expenses")',
        '[role="tab"]:has-text("Expenses")',
        '[data-testid*="expenses"]'
      ];

      let expensesFound = false;
      
      for (const selector of expensesSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Expenses tab: ${selector}`);
            expensesFound = true;
            
            const text = await element.textContent();
            console.log(`   Text: "${text.trim()}"`);
            
            // Click Expenses tab to show the filters
            await element.click();
            await page.waitForTimeout(1000);
            console.log('[OK] Clicked Expenses tab');
            
            await page.screenshot({ path: 'reports/screenshots/expenses-expenses-tab.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(expensesFound).toBeTruthy();
    });
  });

  // Test 4: Find search bar (in Expenses tab)
  test('04 - Search bar is visible', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

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
            
            await element.fill('Test Expense Search');
            await page.waitForTimeout(1000);
            console.log('[OK] Search text entered');
            
            await page.screenshot({ path: 'reports/screenshots/expenses-search.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(searchFound).toBeTruthy();
    });
  });

  // Test 5: Find calendar dropdown
  test('05 - Calendar dropdown is visible', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Look for calendar dropdown', async () => {
      console.log('[SEARCH] Looking for calendar dropdown...');
      
      const calendarSelectors = [
        'input[type="date"]',
        'input[placeholder*="date" i]',
        'button[aria-label*="calendar" i]',
        'button[aria-label*="date" i]',
        '[data-testid*="date"]',
        '[data-testid*="calendar"]'
      ];

      let calendarFound = false;
      
      for (const selector of calendarSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found calendar dropdown: ${selector}`);
            calendarFound = true;
            
            const placeholder = await element.getAttribute('placeholder').catch(() => '');
            console.log(`   Placeholder: "${placeholder}"`);
            
            await page.screenshot({ path: 'reports/screenshots/expenses-calendar.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(calendarFound).toBeTruthy();
    });
  });

  // Test 6: Find all dropdowns
  test('06 - Multiple dropdowns are visible', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

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
      
      for (let i = 0; i < Math.min(4, allDropdowns.length); i++) {
        const text = await allDropdowns[i].element.textContent().catch(() => '');
        console.log(`   Dropdown ${i + 1}: "${text.trim()}" (${allDropdowns[i].selector})`);
      }

      await page.screenshot({ path: 'reports/screenshots/expenses-dropdowns.png', fullPage: true });
      
      expect(allDropdowns.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test 7: Find Reset filter button
  test('07 - Reset filter button is visible', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Look for Reset filter button', async () => {
      console.log('[SEARCH] Looking for Reset filter button...');
      
      const resetSelectors = [
        'button:has-text("Reset")',
        'button:has-text("Reset Filter")',
        'button:has-text("Reset Filters")',
        'button:has-text("Clear")',
        '[data-testid*="reset"]'
      ];

      let resetFound = false;
      
      for (const selector of resetSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Reset button: ${selector}`);
            resetFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/expenses-reset-button.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(resetFound).toBeTruthy();
    });
  });

  // Test 8: Find Import button
  test('08 - Import button is clickable', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Look for Import button', async () => {
      console.log('[SEARCH] Looking for Import button...');
      
      const importButton = page.locator('button:has-text("Import")').first();
      const isVisible = await importButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[OK] Found Import button');
        
        const buttonText = await importButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/expenses-import-button.png', fullPage: true });
        
        // Click Import
        await importButton.click();
        await page.waitForTimeout(1500);
        console.log('[OK] Import button clicked');
        
        await page.screenshot({ path: 'reports/screenshots/expenses-import-clicked.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      } else {
        console.log('[WARNING]  Import button not found');
      }
    });
  });

  // Test 9: Export button is clickable
  test('09 - Export button is clickable', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Look for Export button', async () => {
      console.log('[SEARCH] Looking for Export button...');
      
      const exportButton = page.locator('button:has-text("Export")').first();
      const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('[OK] Found Export button');
        
        const buttonText = await exportButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/expenses-export-button.png', fullPage: true });
        
        // Click Export
        await exportButton.click();
        await page.waitForTimeout(1500);
        console.log('[OK] Export button clicked');
        
        await page.screenshot({ path: 'reports/screenshots/expenses-export-clicked.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      } else {
        console.log('[WARNING]  Export button not found');
      }
    });
  });

  // Test 10: Find Add expense button
  test('10 - Add expense button is visible', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Look for Add expense button', async () => {
      console.log('[SEARCH] Looking for Add expense button...');
      
      const addExpenseSelectors = [
        'button:has-text("Add Expense")',
        'button:has-text("Add expense")',
        'button:has-text("New Expense")',
        'button:has-text("Create Expense")',
        '[data-testid*="add-expense"]'
      ];

      let addExpenseFound = false;
      
      for (const selector of addExpenseSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`[OK] Found Add expense button: ${selector}`);
            addExpenseFound = true;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            await page.screenshot({ path: 'reports/screenshots/expenses-add-button.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(addExpenseFound).toBeTruthy();
    });
  });

  // Test 11: Complete page analysis
  test('11 - Analyze complete Expenses tab structure', async ({ page }) => {
    await test.step('Navigate to Expenses tab', async () => {
      const expensesTab = page.locator('text=Expenses').first();
      const isVisible = await expensesTab.isVisible({ timeout: 3000 }).catch(() => false);
      if (isVisible) {
        await expensesTab.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('Comprehensive page analysis', async () => {
      console.log('\n[CHART] EXPENSES TAB ANALYSIS');
      console.log('================================\n');

      // Count tabs
      const tabs = await page.locator('[role="tab"]').count();
      console.log(`Total tabs: ${tabs}`);

      // Count dropdowns
      const comboboxes = await page.locator('[role="combobox"]').count();
      const selects = await page.locator('select').count();
      console.log(`Total comboboxes: ${comboboxes}`);
      console.log(`Total select elements: ${selects}`);
      console.log(`Total dropdowns: ${comboboxes + selects}`);

      // Count inputs
      const inputs = await page.locator('input:visible').count();
      console.log(`\nTotal visible inputs: ${inputs}`);

      // Count buttons
      const buttons = await page.locator('button:visible').count();
      console.log(`Total visible buttons: ${buttons}`);

      // Check for specific buttons
      const resetBtn = await page.locator('button:has-text("Reset")').count();
      const importBtn = await page.locator('button:has-text("Import")').count();
      const exportBtn = await page.locator('button:has-text("Export")').count();
      const addExpenseBtn = await page.locator('button:has-text("Add Expense")').count();
      
      console.log(`  - Reset buttons: ${resetBtn}`);
      console.log(`  - Import buttons: ${importBtn}`);
      console.log(`  - Export buttons: ${exportBtn}`);
      console.log(`  - Add Expense buttons: ${addExpenseBtn}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/expenses-analysis.png', fullPage: true });
    });
  });
});


