const BasePage = require('./base.page');

class CreateModulePage extends BasePage {
  constructor(page, config, moduleName) {
    super(page, config);
    this.moduleName = moduleName;
    
    // Generic selectors that work across different modules
    this.selectors = {
      titleInput: [
        'input[name="title"]',
        'input[name="name"]',
        'input[id*="title" i]',
        'input[placeholder*="title" i]',
        'input[placeholder*="name" i]',
        '[data-testid="title-input"]',
        '[data-testid="name-input"]'
      ],
      descriptionInput: [
        'textarea[name="description"]',
        'textarea[id*="description" i]',
        'input[name="description"]',
        '[data-testid="description-input"]'
      ],
      typeSelect: [
        'select[name="type"]',
        'select[id*="type" i]',
        '[data-testid="type-select"]'
      ],
      statusSelect: [
        'select[name="status"]',
        'select[id*="status" i]',
        '[data-testid="status-select"]'
      ],
      dateInput: [
        'input[type="date"]',
        'input[name*="date" i]',
        '[data-testid="date-input"]'
      ],
      submitButton: [
        'button[type="submit"]',
        'button:has-text("Create")',
        'button:has-text("Save")',
        'button:has-text("Submit")',
        '[data-testid="submit-button"]',
        '[data-testid="create-button"]'
      ],
      cancelButton: [
        'button:has-text("Cancel")',
        '[data-testid="cancel-button"]'
      ],
      successMessage: [
        '.success',
        '.alert-success',
        'text=successfully created',
        'text=created successfully',
        '[role="alert"]:has-text("success")',
        '[data-testid="success-message"]'
      ]
    };
  }

  async fillBasicFields(data) {
    // Fill title/name
    if (data.title || data.name) {
      await this.helper.smartFill(this.selectors.titleInput, data.title || data.name);
    }

    // Fill description if provided
    if (data.description) {
      if (await this.helper.elementExists(this.selectors.descriptionInput, { timeout: 2000 })) {
        await this.helper.smartFill(this.selectors.descriptionInput, data.description);
      }
    }

    // Select type if provided
    if (data.type) {
      if (await this.helper.elementExists(this.selectors.typeSelect, { timeout: 2000 })) {
        await this.helper.smartSelect(this.selectors.typeSelect, data.type);
      }
    }

    // Select status if provided
    if (data.status) {
      if (await this.helper.elementExists(this.selectors.statusSelect, { timeout: 2000 })) {
        await this.helper.smartSelect(this.selectors.statusSelect, data.status);
      }
    }
  }

  async submit() {
    await this.helper.smartClick(this.selectors.submitButton);
    await this.page.waitForTimeout(2000);
    await this.waitForPageLoad();
  }

  async verifySuccess() {
    // Check for success indicators
    const hasSuccessMessage = await this.helper.elementExists(
      this.selectors.successMessage, 
      { timeout: 5000 }
    );

    if (hasSuccessMessage) {
      return true;
    }

    // Alternative: Check if URL changed (navigated away from create page)
    const currentUrl = this.page.url();
    return !currentUrl.includes('/create') && !currentUrl.includes('/new');
  }
}

module.exports = CreateModulePage;


