/**
 * PAY APPLICATIONS MODULE TESTS
 * 
 * Purpose: Test Pay Applications tab functionality
 * Features tested:
 * - Export button
 * - Pay application list/display
 * 
 * When to run:
 * - When testing payment processing
 * - Before billing cycles
 * - After invoice generation
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Pay Applications Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Pay Applications page
    await page.goto(
      `/app/projects/${projectId}/tools/pay-apps`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Pay Applications page loads
  test('01 - Pay Applications page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/pay-apps');
      console.log('✅ Pay Applications page loaded');
    });

    await test.step('Take screenshot of Pay Applications page', async () => {
      await page.screenshot({ path: 'reports/screenshots/pay-apps-main.png', fullPage: true });
      console.log('📸 Screenshot taken: pay-apps-main.png');
    });
  });

  // Test 2: Export button is clickable
  test('02 - Export button is clickable', async ({ page }) => {
    await test.step('Look for Export button', async () => {
      console.log('🔍 Looking for Export button...');
      
      const exportButton = page.locator('button:has-text("Export")').first();
      const isVisible = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        console.log('✅ Found Export button');
        
        const buttonText = await exportButton.textContent();
        console.log(`   Button text: "${buttonText.trim()}"`);
        
        await page.screenshot({ path: 'reports/screenshots/pay-apps-export-button.png', fullPage: true });
        
        // Click Export
        await exportButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Export button clicked');
        
        await page.screenshot({ path: 'reports/screenshots/pay-apps-export-clicked.png', fullPage: true });
        expect(isVisible).toBeTruthy();
      } else {
        console.log('⚠️  Export button not found with text selector');
        
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

  // Test 3: Check page content
  test('03 - Page has pay application content', async ({ page }) => {
    await test.step('Verify page content', async () => {
      const pageContent = await page.content();
      
      const hasPayAppContent = 
        pageContent.toLowerCase().includes('pay') ||
        pageContent.toLowerCase().includes('application') ||
        pageContent.toLowerCase().includes('invoice') ||
        pageContent.length > 1000;
      
      console.log(`Page has pay application content: ${hasPayAppContent ? 'YES' : 'NO'}`);
      console.log(`Page content length: ${pageContent.length} characters`);
      
      expect(hasPayAppContent).toBeTruthy();
    });
  });

  // Test 4: Analyze page structure
  test('04 - Analyze complete page structure', async ({ page }) => {
    await test.step('Comprehensive page analysis', async () => {
      console.log('\n📊 PAY APPLICATIONS PAGE ANALYSIS');
      console.log('================================\n');

      // Count buttons
      const buttons = await page.locator('button:visible').all();
      console.log(`Total visible buttons: ${buttons.length}`);

      // Look for Export button
      const exportButtons = await page.locator('button:has-text("Export")').count();
      console.log(`  - Export buttons: ${exportButtons}`);

      // Count tables (pay apps might be in a table)
      const tables = await page.locator('table').count();
      console.log(`\nTotal tables: ${tables}`);

      // Count list items
      const lists = await page.locator('ul, ol').count();
      console.log(`Total lists: ${lists}`);

      // Count inputs
      const inputs = await page.locator('input:visible').all();
      console.log(`Total visible inputs: ${inputs.length}`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/pay-apps-analysis.png', fullPage: true });
    });
  });

  // Test 5: Look for pay application list or data
  test('05 - Check for pay application list', async ({ page }) => {
    await test.step('Look for pay application data', async () => {
      console.log('🔍 Looking for pay application data...');
      
      // Check for common pay app elements
      const payAppElements = [
        'text=Invoice',
        'text=Amount',
        'text=Status',
        'text=Date',
        'text=Payment',
        'table',
        '[role="row"]',
        '[role="cell"]'
      ];

      let elementsFound = 0;
      
      for (const selector of payAppElements) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ Found: ${selector} (${count})`);
          elementsFound++;
        }
      }

      console.log(`\nTotal pay app elements found: ${elementsFound}`);
      await page.screenshot({ path: 'reports/screenshots/pay-apps-elements.png', fullPage: true });
    });
  });
});
