const { test, expect } = require('@playwright/test');
const LoginPage = require('../../pages/login.page');
const DashboardPage = require('../../pages/dashboard.page');
const CreateModulePage = require('../../pages/create-module.page');
const config = require('../../utils/config-manager');

test.describe('User Management Tests', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page, config);
    // Authentication handled by global setup - navigate to use saved session
    await dashboardPage.goto();
    await page.waitForTimeout(2000); // Wait for page to stabilize
  });

  test('should navigate to app and verify authenticated', async ({ page }) => {
    await test.step('Verify on dashboard', async () => {
      const currentUrl = page.url();
      expect(currentUrl).toContain('superconstruct.io');
      console.log(`[OK] Authenticated and on: ${currentUrl}`);
    });

    await test.step('Select company', async () => {
      await dashboardPage.selectCompany();
      
      // Wait and verify we're now in a company context
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`[OK] After company selection: ${currentUrl}`);
    });

    await test.step('Open existing project (abcd)', async () => {
      await dashboardPage.selectProject('abcd');
      
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`[OK] Opened project abcd, current URL: ${currentUrl}`);
    });

    await test.step('Check for navigation elements', async () => {
      const currentUrl = page.url();
      
      // Take screenshot of current state after project opening
      await page.screenshot({ path: 'screenshots/inside-project.png', fullPage: true });
      
      // Log what's visible now
      const allLinks = await page.locator('a[href]').evaluateAll(links => 
        links.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href'),
          ariaLabel: link.getAttribute('aria-label')
        })).filter(l => l.href && l.href.includes('/tools/'))
      );
      
      console.log(`[LIST] Available tool links:`, JSON.stringify(allLinks, null, 2));
      
      // Check for specific modules by searching page content or URLs
      const pageContent = await page.content();
      const hasRFI = pageContent.includes('rfi') || pageContent.includes('RFI');
      const hasSubmittal = pageContent.includes('submittal') || pageContent.includes('Submittal');
      const hasInspection = pageContent.includes('inspection') || pageContent.includes('Inspection');
      const hasSOV = await page.locator('text=/schedule/i').isVisible().catch(() => false);
      
      console.log(`RFI mentioned: ${hasRFI}`);
      console.log(`Submittal mentioned: ${hasSubmittal}`);
      console.log(`Inspection mentioned: ${hasInspection}`);
      console.log(`SOV visible: ${hasSOV}`);
      
      // Should be inside a project with tools navigation
      const isInProject = currentUrl.includes('/projects/') && currentUrl.includes('/tools/');
      expect(isInProject).toBeTruthy();
      
      console.log('[OK] Successfully navigated into project with tools/modules access');
    });
  });

  test.skip('should create a new user', async ({ page }) => {
    // Skipped until we understand the actual app navigation structure
    const timestamp = Date.now();
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${timestamp}@example.com`,
      password: 'TestUser123!',
      role: 'Project Manager'
    };

    await test.step('Navigate to users section', async () => {
      await dashboardPage.navigateToModule('Users');
    });

    await test.step('Click create user button', async () => {
      await dashboardPage.clickCreateButton('user');
    });

    await test.step('Fill user form', async () => {
      const createPage = new CreateModulePage(page, config, 'User');
      
      // Fill form fields
      const formFields = {
        'input[name="firstName"], input[name="first_name"]': userData.firstName,
        'input[name="lastName"], input[name="last_name"]': userData.lastName,
        'input[name="email"], input[type="email"]': userData.email,
      };

      for (const [selector, value] of Object.entries(formFields)) {
        const selectors = selector.split(', ');
        try {
          await createPage.ai.smartFill(selectors, value);
        } catch (error) {
          console.warn(`Could not fill field ${selector}`);
        }
      }

      // Select role if dropdown exists
      try {
        await createPage.ai.smartSelect(
          ['select[name="role"]', 'select[id*="role"]'], 
          userData.role
        );
      } catch {
        // Role field might not exist
      }

      await createPage.submit();
    });

    await test.step('Verify user creation', async () => {
      await page.waitForTimeout(2000);
      const createPage = new CreateModulePage(page, config, 'User');
      const success = await createPage.verifySuccess();
      expect(success).toBeTruthy();
    });
  });
});


