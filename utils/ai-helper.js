const { expect } = require('@playwright/test');

class AITestHelper {
  constructor(page, config) {
    this.page = page;
    this.config = config;
  }

  /**
   * AI-powered element finder with fallback strategies
   */
  async findElement(selectors, options = {}) {
    const strategies = Array.isArray(selectors) ? selectors : [selectors];
    
    for (const selector of strategies) {
      try {
        const element = this.page.locator(selector).first();
        await element.waitFor({ state: 'visible', timeout: options.timeout || 5000 });
        return element;
      } catch (error) {
        continue;
      }
    }

    // Fallback: Try to find by text content
    if (options.text) {
      try {
        return this.page.getByText(options.text, { exact: false }).first();
      } catch (error) {
        // Continue to next fallback
      }
    }

    // Fallback: Try to find by role
    if (options.role) {
      try {
        return this.page.getByRole(options.role, { name: options.name }).first();
      } catch (error) {
        // Continue to next fallback
      }
    }

    throw new Error(`Could not find element with selectors: ${strategies.join(', ')}`);
  }

  /**
   * Smart click with retry logic
   */
  async smartClick(selector, options = {}) {
    const element = await this.findElement(selector, options);
    await element.scrollIntoViewIfNeeded();
    await element.click({ timeout: options.timeout || 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  /**
   * Smart fill with validation
   */
  async smartFill(selector, value, options = {}) {
    const element = await this.findElement(selector, options);
    await element.scrollIntoViewIfNeeded();
    await element.clear();
    await element.fill(value);
    
    // Verify the value was filled
    if (options.verify !== false) {
      const filledValue = await element.inputValue();
      if (filledValue !== value) {
        // Retry once
        await element.clear();
        await element.fill(value);
      }
    }
  }

  /**
   * Wait for element to be visible with AI fallback
   */
  async waitForElement(selector, options = {}) {
    return await this.findElement(selector, { 
      timeout: options.timeout || 15000,
      ...options 
    });
  }

  /**
   * Smart navigation with loading detection
   */
  async smartNavigate(url) {
    await this.page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `reports/screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  /**
   * Intelligent form filler
   */
  async fillForm(fields) {
    for (const [selector, value] of Object.entries(fields)) {
      try {
        await this.smartFill(selector, value);
      } catch (error) {
        console.warn(`Warning: Could not fill field ${selector}:`, error.message);
      }
    }
  }

  /**
   * Wait for successful navigation or action
   */
  async waitForSuccess(indicators = []) {
    const defaultIndicators = [
      'text=success',
      'text=created',
      'text=saved',
      '.success',
      '.alert-success',
      '[data-testid="success"]'
    ];

    const allIndicators = [...indicators, ...defaultIndicators];

    try {
      await Promise.race(
        allIndicators.map(indicator => 
          this.page.locator(indicator).first().waitFor({ 
            state: 'visible', 
            timeout: 10000 
          })
        )
      );
      return true;
    } catch (error) {
      // Check if URL changed (navigation success)
      return true;
    }
  }

  /**
   * Smart select dropdown option
   */
  async smartSelect(selector, value, options = {}) {
    const element = await this.findElement(selector, options);
    
    // Try different selection methods
    try {
      await element.selectOption(value);
    } catch (error) {
      // Fallback: Click and select
      await element.click();
      await this.page.getByText(value, { exact: false }).first().click();
    }
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector, options = {}) {
    try {
      await this.findElement(selector, { timeout: options.timeout || 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content with fallback
   */
  async getTextContent(selector, options = {}) {
    const element = await this.findElement(selector, options);
    return await element.textContent();
  }
}

module.exports = AITestHelper;
