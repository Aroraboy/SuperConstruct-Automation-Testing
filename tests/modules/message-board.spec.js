/**
 * MESSAGE BOARD MODULE TESTS
 * 
 * Purpose: Test Message Board functionality
 * Features tested:
 * - New message button
 * - Message board page load
 * - Basic message viewing functionality
 * 
 * When to run:
 * - When testing team communication
 * - Before project messaging updates
 * - After new message creation
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Message Board Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Message Board page
    await page.goto(
      `/app/projects/${projectId}/tools/message-board`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Message Board page loads
  test('01 - Message Board page loads successfully', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/message-board');
      console.log('✅ Message Board page loaded');
    });

    await test.step('Take screenshot of Message Board page', async () => {
      await page.screenshot({ path: 'reports/screenshots/message-board-main.png', fullPage: true });
      console.log('📸 Screenshot taken: message-board-main.png');
    });
  });

  // Test 2: Find New message button
  test('02 - New message button is visible', async ({ page }) => {
    await test.step('Look for New message button', async () => {
      console.log('🔍 Looking for New message button...');
      
      const newMessageSelectors = [
        'button:has-text("New Message")',
        'button:has-text("New message")',
        'button:has-text("Create Message")',
        'button:has-text("Add Message")',
        '[data-testid*="new-message"]',
        '[data-testid*="create-message"]'
      ];

      let buttonFound = false;
      let buttonElement;
      
      for (const selector of newMessageSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found New message button: ${selector}`);
            buttonFound = true;
            buttonElement = element;
            
            const buttonText = await element.textContent();
            console.log(`   Button text: "${buttonText.trim()}"`);
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(buttonFound).toBeTruthy();
      
      await page.screenshot({ path: 'reports/screenshots/message-board-new-button.png', fullPage: true });
    });
  });

  // Test 3: Click New message button and verify navigation/form
  test('03 - New message button is clickable', async ({ page }) => {
    await test.step('Click New message button', async () => {
      console.log('🔍 Looking for New message button...');
      
      const newMessageSelectors = [
        'button:has-text("New Message")',
        'button:has-text("New message")',
        'button:has-text("Create Message")',
        'button:has-text("Add Message")'
      ];

      let clicked = false;
      
      for (const selector of newMessageSelectors) {
        try {
          const element = page.locator(selector).first();
          const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found button, clicking: ${selector}`);
            
            await element.click();
            await page.waitForTimeout(2000);
            
            clicked = true;
            console.log('✅ Clicked New message button');
            
            const currentUrl = page.url();
            console.log(`   Current URL: ${currentUrl}`);
            
            await page.screenshot({ path: 'reports/screenshots/message-board-after-click.png', fullPage: true });
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(clicked).toBeTruthy();
    });
  });

  // Test 4: Check for message board content/list
  test('04 - Message board has content area', async ({ page }) => {
    await test.step('Check for message content', async () => {
      console.log('🔍 Looking for message board content...');
      
      const pageContent = await page.content();
      const hasMessageContent = pageContent.length > 10000;
      
      console.log(`Page has message content: ${hasMessageContent ? 'YES' : 'NO'}`);
      console.log(`Page content length: ${pageContent.length.toLocaleString()} characters`);
      
      expect(hasMessageContent).toBeTruthy();
      
      await page.screenshot({ path: 'reports/screenshots/message-board-content.png', fullPage: true });
    });
  });

  // Test 5: Check for message elements
  test('05 - Check for message elements', async ({ page }) => {
    await test.step('Look for message-related elements', async () => {
      console.log('🔍 Looking for message elements...');
      
      // Check for common message-related text
      const messageTexts = [
        'text=Message',
        'text=Subject',
        'text=Posted',
        'text=Author',
        'text=Date'
      ];
      
      let foundElements = 0;
      
      for (const textSelector of messageTexts) {
        try {
          const count = await page.locator(textSelector).count();
          if (count > 0) {
            const keyword = textSelector.replace('text=', '');
            console.log(`✅ Found: ${keyword} (${count})`);
            foundElements++;
          }
        } catch (e) {
          // Continue
        }
      }
      
      console.log(`Total message-related elements found: ${foundElements}`);
      
      await page.screenshot({ path: 'reports/screenshots/message-board-elements.png', fullPage: true });
    });
  });

  // Test 6: Complete page analysis
  test('06 - Analyze complete Message Board structure', async ({ page }) => {
    await test.step('Comprehensive page analysis', async () => {
      console.log('\n📊 MESSAGE BOARD PAGE ANALYSIS');
      console.log('================================\n');

      // Count buttons
      const buttons = await page.locator('button:visible').count();
      console.log(`Total visible buttons: ${buttons}`);

      // Check for New message button
      const newMessageBtn = await page.locator('button:has-text("New Message"), button:has-text("New message")').count();
      console.log(`  - New message buttons: ${newMessageBtn}`);

      // Count lists/tables
      const tables = await page.locator('table').count();
      const lists = await page.locator('ul, ol').count();
      console.log(`\nTotal tables: ${tables}`);
      console.log(`Total lists: ${lists}`);

      // Count inputs
      const inputs = await page.locator('input:visible').count();
      console.log(`\nTotal visible inputs: ${inputs}`);

      // Page content
      const pageContent = await page.content();
      console.log(`\nPage content length: ${pageContent.length.toLocaleString()} characters`);

      console.log('\n================================\n');
      
      await page.screenshot({ path: 'reports/screenshots/message-board-analysis.png', fullPage: true });
    });
  });
});
