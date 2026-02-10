/**
 * BASE PAGE OBJECT
 * 
 * Provides common page interactions for all page objects:
 * - Navigation
 * - Wait for page load
 * - Screenshot capture
 * - Element interaction via helper
 * 
 * All page objects inherit from this class to avoid code duplication
 */

const TestHelper = require('../utils/test-helper');

class BasePage {
  /**
   * Initialize page object
   * @param {Page} page - Playwright page object
   * @param {ConfigManager} config - Configuration manager
   */
  constructor(page, config) {
    this.page = page;
    this.config = config;
    this.helper = new TestHelper(page, config);
  }

  /**
   * Navigate to a specific path within the app
   * @param {string} path - Relative path (e.g., '/app/projects/123/overview')
   */
  async navigate(path = '') {
    const baseUrl = this.config.getAppUrl();
    const url = path ? `${baseUrl}${path}` : baseUrl;
    await this.helper.smartNavigate(url);
  }

  /**
   * Wait for page to fully load (DOM + Network)
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  /**
   * Capture screenshot for debugging/reporting
   * @param {string} name - Descriptive name for screenshot
   */
  async takeScreenshot(name) {
    return await this.helper.takeScreenshot(name);
  }
}

module.exports = BasePage;
