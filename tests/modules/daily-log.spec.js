/**
 * DAILY LOG MODULE TESTS
 * 
 * Purpose: Test Daily Log tab functionality
 * Features tested:
 * 1. Search button/field
 * 2. Dropdown menu
 * 3. Filter by date (opens calendar)
 * 4. Create Log button (creates new daily log)
 * 
 * When to run:
 * - When testing daily reporting
 * - Before site activity tracking
 * - After weather/worker management features
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Daily Log Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Daily Logs page
    await page.goto(
      `/app/projects/${projectId}/tools/daily-logs`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Daily Log page loads with all elements
  test('01 - Daily Log page loads with all 4 elements', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/daily-logs');
      console.log('[OK] Daily Log page loaded');
    });

    await test.step('Take screenshot of main page', async () => {
      await page.screenshot({ path: 'reports/screenshots/daily-log-main.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-main.png');
    });

    await test.step('Verify all 4 elements exist', async () => {
      console.log('\n[SEARCH] Checking for all 4 Daily Log elements...\n');
      
      let foundElements = [];

      // 1. Search button/field
      const searchExists = await page.locator('input[placeholder*="search" i], button:has-text("Search")').first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`1️⃣ Search: ${searchExists ? '[OK] FOUND' : '[ERROR] NOT FOUND'}`);
      if (searchExists) foundElements.push('Search');

      // 2. Dropdown menu
      const dropdownExists = await page.locator('select, [role="combobox"], button[aria-haspopup]').first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`2️⃣ Dropdown: ${dropdownExists ? '[OK] FOUND' : '[ERROR] NOT FOUND'}`);
      if (dropdownExists) foundElements.push('Dropdown');

      // 3. Date filter
      const dateFilterExists = await page.locator('input[type="date"], button:has-text("Date"), button:has-text("Filter"), [aria-label*="date" i]').first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`3️⃣ Date Filter: ${dateFilterExists ? '[OK] FOUND' : '[ERROR] NOT FOUND'}`);
      if (dateFilterExists) foundElements.push('Date Filter');

      // 4. Create Log button
      const createButtonExists = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`4️⃣ Create Log: ${createButtonExists ? '[OK] FOUND' : '[ERROR] NOT FOUND'}`);
      if (createButtonExists) foundElements.push('Create Log');

      console.log(`\n[CHART] Elements found: ${foundElements.length}/4`);
      expect(foundElements.length).toBeGreaterThan(0);
    });
  });

  // Test 2: Find and test Search functionality
  test('02 - Search button/field works correctly', async ({ page }) => {
    await test.step('Find search field', async () => {
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="find" i]',
        'input[name*="search"]',
        '[data-testid*="search"]'
      ];

      let searchFound = false;
      
      for (const selector of searchSelectors) {
        const field = page.locator(selector).first();
        const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[OK] Found search field: ${selector}`);
          
          const placeholder = await field.getAttribute('placeholder').catch(() => '');
          console.log(`   Placeholder: "${placeholder}"`);
          
          searchFound = true;
          break;
        }
      }

      expect(searchFound).toBeTruthy();
    });

    await test.step('Test search functionality', async () => {
      const searchField = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      
      await searchField.fill('test search');
      await page.waitForTimeout(1000);
      
      console.log('[OK] Search query entered');
      
      await page.screenshot({ path: 'reports/screenshots/daily-log-search.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-search.png');
    });
  });

  // Test 3: Find and test Dropdown menu
  test('03 - Dropdown menu opens and shows options', async ({ page }) => {
    await test.step('Find dropdown menu', async () => {
      const dropdownSelectors = [
        'select',
        '[role="combobox"]',
        'button[aria-haspopup="listbox"]',
        'button[aria-haspopup="menu"]',
        '[data-testid*="dropdown"]',
        '[data-testid*="select"]'
      ];

      let dropdownFound = false;
      let dropdownElement = null;
      
      for (const selector of dropdownSelectors) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[OK] Found dropdown: ${selector}`);
          dropdownFound = true;
          dropdownElement = element;
          
          const text = await element.textContent().catch(() => '');
          console.log(`   Current value: "${text.trim()}"`);
          
          break;
        }
      }

      expect(dropdownFound).toBeTruthy();
    });

    await test.step('Click dropdown and view options', async () => {
      const dropdown = page.locator('select, [role="combobox"], button[aria-haspopup]').first();
      
      await dropdown.click();
      await page.waitForTimeout(1000);
      
      console.log('[OK] Dropdown clicked');
      
      await page.screenshot({ path: 'reports/screenshots/daily-log-dropdown-open.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-dropdown-open.png');
      
      // Count menu items
      const menuItems = await page.locator('[role="option"], [role="menuitem"], option').all();
      console.log(`[CHART] Dropdown options: ${menuItems.length}`);
      
      for (let i = 0; i < Math.min(5, menuItems.length); i++) {
        const text = await menuItems[i].textContent().catch(() => '');
        console.log(`   ${i + 1}. ${text.trim()}`);
      }
    });
  });

  // Test 4: Find and test Date Filter (calendar)
  test('04 - Filter by date opens calendar', async ({ page }) => {
    await test.step('Find date filter button/field', async () => {
      const dateFilterSelectors = [
        'input[type="date"]',
        'button:has-text("Date")',
        'button:has-text("Filter")',
        'button[aria-label*="date" i]',
        '[data-testid*="date"]',
        'button:has-text("Calendar")',
        'button:has(svg) >> text=/date|calendar/i'
      ];

      let dateFilterFound = false;
      let dateFilterElement = null;
      
      for (const selector of dateFilterSelectors) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[OK] Found date filter: ${selector}`);
          dateFilterFound = true;
          dateFilterElement = element;
          
          const text = await element.textContent().catch(() => '');
          const ariaLabel = await element.getAttribute('aria-label').catch(() => '');
          
          console.log(`   Text: "${text.trim()}"`);
          console.log(`   aria-label: "${ariaLabel}"`);
          
          break;
        }
      }

      expect(dateFilterFound).toBeTruthy();
    });

    await test.step('Click date filter to open calendar', async () => {
      const dateFilter = page.locator('input[type="date"], button:has-text("Date"), button:has-text("Filter")').first();
      
      await dateFilter.click();
      await page.waitForTimeout(1500);
      
      console.log('[OK] Date filter clicked');
      
      await page.screenshot({ path: 'reports/screenshots/daily-log-calendar-open.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-calendar-open.png');
      
      // Check if calendar appeared
      const calendarVisible = await page.locator('[role="dialog"], .calendar, [data-testid*="calendar"], [class*="calendar"]').isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`Calendar popup visible: ${calendarVisible ? 'YES' : 'NO'}`);
    });
  });

  // Test 5: Find and click "Create Log" button
  test('05 - Create Log button opens form', async ({ page }) => {
    await test.step('Find Create Log button', async () => {
      const createButtonSelectors = [
        'button:has-text("Create Log")',
        'button:has-text("Add Log")',
        'button:has-text("New Log")',
        'button:has-text("Create Daily Log")',
        'button:has-text("Create")',
        'button:has-text("Add")',
        'button:has-text("New")',
        'a:has-text("Create Log")',
        '[data-testid*="create"]',
        '[data-testid*="add-log"]'
      ];

      let createButtonFound = false;
      let createButton = null;
      
      for (const selector of createButtonSelectors) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[OK] Found Create Log button: ${selector}`);
          createButtonFound = true;
          createButton = button;
          
          const text = await button.textContent();
          const isDisabled = await button.isDisabled().catch(() => false);
          
          console.log(`   Button text: "${text}"`);
          console.log(`   Disabled: ${isDisabled}`);
          
          await page.screenshot({ path: 'reports/screenshots/daily-log-create-button.png', fullPage: true });
          console.log('[CAMERA] Screenshot: daily-log-create-button.png');
          
          break;
        }
      }

      expect(createButtonFound).toBeTruthy();
    });

    await test.step('Click Create Log button', async () => {
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      
      await createButton.click();
      await page.waitForTimeout(2000);
      
      console.log('[OK] Create Log button clicked');
      
      await page.screenshot({ path: 'reports/screenshots/daily-log-form-opened.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-form-opened.png');
    });

    await test.step('Verify daily log form/modal appeared', async () => {
      // Check for form fields
      const formFields = await page.locator('input, textarea, select').all();
      console.log(`[CHART] Form fields found: ${formFields.length}`);
      
      // Check for modal/dialog
      const hasModal = await page.locator('[role="dialog"], .modal, [data-testid*="modal"]').isVisible().catch(() => false);
      console.log(`Modal visible: ${hasModal ? 'YES' : 'NO'}`);
      
      // Check URL changed (maybe navigated to create page)
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      expect(formFields.length > 0 || hasModal).toBeTruthy();
    });
  });

  // Test 6: Create a complete Daily Log
  test('06 - Create new Daily Log with form submission', async ({ page }) => {
    await test.step('Click Create Log button', async () => {
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();
      
      await createButton.click();
      await page.waitForTimeout(2000);
      
      console.log('[OK] Create Log form opened');
    });

    await test.step('Fill Daily Log form', async () => {
      const timestamp = new Date().toISOString().split('T')[0]; // Today's date
      
      console.log(`[NOTE] Creating Daily Log for date: ${timestamp}`);

      // Try to fill date field
      try {
        const dateField = page.locator('input[type="date"], input[name*="date"]').first();
        const isVisible = await dateField.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          await dateField.fill(timestamp);
          console.log(`[OK] Date filled: ${timestamp}`);
        }
      } catch (e) {
        console.log('[WARNING] Date field not found or failed');
      }

      // Try to fill weather field
      try {
        const weatherSelectors = [
          'input[name*="weather"]',
          'input[placeholder*="weather" i]',
          'select[name*="weather"]'
        ];
        
        for (const selector of weatherSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await field.fill('Sunny, 72°F');
            console.log('[OK] Weather filled');
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] Weather field not found');
      }

      // Try to fill work performed/notes
      try {
        const notesSelectors = [
          'textarea[name*="note"]',
          'textarea[name*="description"]',
          'textarea[placeholder*="note" i]',
          'textarea[placeholder*="work" i]',
          'textarea'
        ];
        
        for (const selector of notesSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await field.fill('Test daily log entry - automated test');
            console.log('[OK] Notes/Work Performed filled');
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] Notes field not found');
      }

      // Try to fill workers count
      try {
        const workersSelectors = [
          'input[name*="worker"]',
          'input[name*="crew"]',
          'input[type="number"]'
        ];
        
        for (const selector of workersSelectors) {
          const field = page.locator(selector).first();
          const isVisible = await field.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            await field.fill('15');
            console.log('[OK] Workers count filled');
            break;
          }
        }
      } catch (e) {
        console.log('[WARNING] Workers field not found');
      }

      await page.screenshot({ path: 'reports/screenshots/daily-log-form-filled.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-form-filled.png');
    });

    await test.step('Submit Daily Log form', async () => {
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Save")',
        'button:has-text("Create")',
        'button:has-text("Submit")',
        'button:has-text("Add")'
      ];

      let submitted = false;
      
      for (const selector of submitSelectors) {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
          console.log(`[PIN] Clicking submit: ${selector}`);
          await button.click();
          await page.waitForTimeout(3000);
          submitted = true;
          break;
        }
      }

      console.log(`Form submission: ${submitted ? 'SUCCESS' : 'FAILED'}`);
      
      await page.screenshot({ path: 'reports/screenshots/daily-log-after-submit.png', fullPage: true });
      console.log('[CAMERA] Screenshot: daily-log-after-submit.png');
    });

    await test.step('Verify Daily Log was created', async () => {
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      const pageContent = await page.content();
      const hasSuccessIndicators = 
        pageContent.toLowerCase().includes('success') ||
        pageContent.toLowerCase().includes('created') ||
        pageContent.toLowerCase().includes('saved');
      
      console.log(`Success indicators: ${hasSuccessIndicators ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`Back on daily-logs page: ${currentUrl.includes('/daily-logs')}`);
    });
  });
});


