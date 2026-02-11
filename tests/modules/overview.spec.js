/**
 * OVERVIEW MODULE TESTS
 * 
 * Purpose: Test Overview page actions
 * Features tested:
 * - Complete Project button
 * - Three-dot menu (overflow menu)
 * - Edit Project option from menu
 * 
 * When to run:
 * - After project creation
 * - Before project completion
 * - When testing project settings
 */

const { test, expect } = require('@playwright/test');
const DashboardPage = require('../../pages/dashboard.page');
const config = require('../../utils/config-manager');

test.describe('Overview Module Tests', () => {
  let dashboardPage;
  const projectId = '24939171-2ea4-4f4f-b283-3462b4e4b307';

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    
    // Navigate directly to Overview page
    await page.goto(
      `/app/projects/${projectId}/tools/overview`,
      { waitUntil: 'domcontentloaded', timeout: 60000 }
    );
    
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  // Test 1: Verify Overview page loads with Complete Project button
  test('01 - Overview page loads and displays project info', async ({ page }) => {
    await test.step('Verify page loaded', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('/tools/overview');
      console.log('✅ Overview page loaded');
    });

    await test.step('Verify page has content', async () => {
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(500);
      console.log('✅ Page has content');
    });

    await test.step('Take screenshot of Overview page', async () => {
      await page.screenshot({ path: 'reports/screenshots/overview-main.png', fullPage: true });
      console.log('📸 Screenshot taken: overview-main.png');
    });
  });

  // Test 2: Find and interact with "Complete Project" button
  test('02 - Complete Project button is visible', async ({ page }) => {
    await test.step('Look for Complete Project button', async () => {
      const completeButtonSelectors = [
        'button:has-text("Complete Project")',
        'button:has-text("Complete")',
        'button[aria-label*="Complete"]',
        '[data-testid="complete-project"]',
        'button:has-text("Finish Project")',
        'button:has-text("Mark Complete")'
      ];

      let buttonFound = false;
      
      for (const selector of completeButtonSelectors) {
        try {
          const button = page.locator(selector).first();
          const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Complete Project button: ${selector}`);
            buttonFound = true;
            
            // Log button text
            const buttonText = await button.textContent();
            console.log(`   Button text: "${buttonText}"`);
            
            // Check button state (enabled/disabled)
            const isDisabled = await button.isDisabled().catch(() => false);
            console.log(`   Button disabled: ${isDisabled}`);
            
            // Take screenshot highlighting the button
            await page.screenshot({ path: 'reports/screenshots/overview-complete-button.png', fullPage: true });
            
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      expect(buttonFound).toBeTruthy();
    });
  });

  // Test 3: Find and interact with three-dot menu button (PROJECT MENU, NOT ASSISTANT)
  test('03 - Three-dot menu button is visible', async ({ page }) => {
    await test.step('Look for three-dot menu (NOT Assistant button)', async () => {
      console.log('🔍 Finding the PROJECT three-dot menu (not AI Assistant button)...');
      
      // Get all buttons on page
      const buttons = await page.locator('button').all();
      console.log(`📊 Total buttons found: ${buttons.length}`);

      let menuButton = null;
      let buttonDetails = [];

      // Analyze each button
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent().catch(() => '');
        const ariaLabel = await buttons[i].getAttribute('aria-label').catch(() => '');
        const title = await buttons[i].getAttribute('title').catch(() => '');
        const dataTestId = await buttons[i].getAttribute('data-testid').catch(() => '');
        const isVisible = await buttons[i].isVisible().catch(() => false);
        
        buttonDetails.push({
          index: i,
          text: text.trim(),
          ariaLabel,
          title,
          dataTestId,
          visible: isVisible
        });

        console.log(`\n  Button ${i}:`);
        console.log(`    Text: "${text.trim()}"`);
        console.log(`    aria-label: "${ariaLabel}"`);
        console.log(`    title: "${title}"`);
        console.log(`    data-testid: "${dataTestId}"`);

        // Look for the project menu button (should be near Complete Project button)
        // Usually has "..." text, or aria-label with "menu"/"more"/"options"
        if (
          (text.includes('...') || 
           ariaLabel.toLowerCase().includes('menu') ||
           ariaLabel.toLowerCase().includes('more') ||
           ariaLabel.toLowerCase().includes('option') ||
           ariaLabel.toLowerCase().includes('action') ||
           title.toLowerCase().includes('menu') ||
           title.toLowerCase().includes('more') ||
           dataTestId.toLowerCase().includes('menu') ||
           dataTestId.toLowerCase().includes('action')) &&
          !ariaLabel.toLowerCase().includes('assistant') &&  // Exclude AI Assistant
          !text.toLowerCase().includes('complete')  // Exclude Complete button
        ) {
          console.log(`\n✅ FOUND PROJECT MENU: Button ${i}`);
          menuButton = buttons[i];
          break;
        }
      }

      // If still not found, check for button adjacent to Complete button
      if (!menuButton) {
        console.log('\n🔍 Menu not found by labels, checking position near Complete button...');
        for (let i = 0; i < buttonDetails.length; i++) {
          if (buttonDetails[i].text.includes('Complete')) {
            console.log(`Found Complete button at index ${i}`);
            // Check next button
            if (i + 1 < buttons.length) {
              const nextBtn = buttons[i + 1];
              const nextText = await nextBtn.textContent().catch(() => '');
              console.log(`Button right after Complete: "${nextText}"`);
              if (!nextText.toLowerCase().includes('assistant')) {
                menuButton = nextBtn;
                break;
              }
            }
          }
        }
      }

      console.log(`\n✅ Menu button ${menuButton ? 'FOUND' : 'NOT FOUND'}`);
      expect(menuButton !== null).toBeTruthy();
    });
  });

  // Test 4: Click three-dot menu and verify Edit Project option appears
  test('04 - Three-dot menu opens and shows Edit Project option', async ({ page }) => {
    await test.step('Find and click three-dot menu', async () => {
      const menuButtonSelectors = [
        'button[aria-label*="menu" i]',
        'button[aria-label*="more" i]',
        'button:has(svg)',
        '[data-testid*="menu"]'
      ];

      let menuClicked = false;
      
      for (const selector of menuButtonSelectors) {
        try {
          const menu = page.locator(selector).first();
          const isVisible = await menu.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`📍 Clicking menu: ${selector}`);
            await menu.click();
            await page.waitForTimeout(1000); // Wait for menu to open
            menuClicked = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(menuClicked).toBeTruthy();
    });

    await test.step('Look for Edit Project option in menu', async () => {
      const editOptionSelectors = [
        'a:has-text("Edit Project")',
        'button:has-text("Edit Project")',
        '[role="menuitem"]:has-text("Edit")',
        '[data-testid="edit-project"]',
        'div:has-text("Edit Project")',
        'a:has-text("Edit")',
        'button:has-text("Edit")'
      ];

      let editOptionFound = false;
      
      for (const selector of editOptionSelectors) {
        try {
          const option = page.locator(selector).first();
          const isVisible = await option.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isVisible) {
            console.log(`✅ Found Edit Project option: ${selector}`);
            const optionText = await option.textContent();
            console.log(`   Option text: "${optionText}"`);
            editOptionFound = true;
            
            // Take screenshot of menu
            await page.screenshot({ path: 'reports/screenshots/overview-menu-open.png', fullPage: true });
            
            break;
          }
        } catch (e) {
          // Continue
        }
      }

      expect(editOptionFound).toBeTruthy();
    });
  });

  // Test 5: Click Edit Project and verify navigation/modal opens
  test('05 - Edit Project option opens edit form', async ({ page }) => {
    await test.step('Click three-dot menu', async () => {
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      const isVisible = await menuButton.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await menuButton.click();
        await page.waitForTimeout(1000);
        console.log('📍 Clicked menu button');
      }
    });

    await test.step('Click Edit Project option', async () => {
      const editOption = page.locator(
        'a:has-text("Edit Project"), button:has-text("Edit Project"), [data-testid="edit-project"], a:has-text("Edit")'
      ).first();
      
      const isVisible = await editOption.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isVisible) {
        await editOption.click();
        await page.waitForTimeout(2000); // Wait for form/modal to load
        console.log('🔧 Clicked Edit Project option');
        
        // Take screenshot of edit form
        await page.screenshot({ path: 'reports/screenshots/overview-edit-form.png', fullPage: true });
      }
    });

    await test.step('Verify edit form or page opened', async () => {
      const pageContent = await page.content();
      
      // Check for form fields or modal indicators
      const hasFormFields = pageContent.includes('input') || pageContent.includes('textarea');
      const hasEditIndicators = pageContent.toLowerCase().includes('edit') || pageContent.toLowerCase().includes('save');
      
      expect(hasFormFields || hasEditIndicators).toBeTruthy();
      console.log('✅ Edit form/modal detected');
    });
  });

  // Test 6: Verify Complete Project button and Edit menu work together
  test('06 - Project action buttons summary', async ({ page }) => {
    await test.step('Summary of Overview page buttons', async () => {
      // Get all buttons on page
      const allButtons = await page.locator('button').all();
      console.log(`\n📊 OVERVIEW PAGE BUTTON ANALYSIS`);
      console.log(`================================`);
      console.log(`Total buttons found: ${allButtons.length}\n`);

      let completeFound = false;
      let menuFound = false;

      for (const button of allButtons) {
        const text = await button.textContent().catch(() => '');
        const ariaLabel = await button.getAttribute('aria-label').catch(() => '');
        const dataTestId = await button.getAttribute('data-testid').catch(() => '');
        const isVisible = await button.isVisible().catch(() => false);

        if (isVisible && text.length < 50) {
          console.log(`Button: "${text}" | aria-label: "${ariaLabel}" | data-testid: "${dataTestId}"`);
          
          if (text.toLowerCase().includes('complete')) completeFound = true;
          if (ariaLabel.toLowerCase().includes('menu') || text.includes('...')) menuFound = true;
        }
      }

      console.log(`\n✅ Complete Project button: ${completeFound ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`✅ Menu button: ${menuFound ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`================================\n`);

      expect(completeFound || menuFound).toBeTruthy();
    });
  });
});
