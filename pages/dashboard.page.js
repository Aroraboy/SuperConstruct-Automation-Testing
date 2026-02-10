const BasePage = require('./base.page');

class DashboardPage extends BasePage {
  constructor(page, config) {
    super(page, config);
    
    this.selectors = {
      logoutButton: [
        'button:has-text("Logout")',
        'button:has-text("Log out")',
        'a:has-text("Logout")',
        '[data-testid="logout-button"]',
        '.logout-button'
      ],
      userMenu: [
        '[data-testid="user-menu"]',
        '.user-menu',
        'button:has-text("Profile")',
        '[aria-label="User menu"]'
      ],
      createButtons: {
        user: [
          'button:has-text("Create User")',
          'button:has-text("Add User")',
          'button:has-text("New User")',
          '[data-testid="create-user-button"]'
        ],
        sov: [
          'button:has-text("Schedule of Values")',
          'button:has-text("Create SOV")',
          'button:has-text("New SOV")',
          '[data-testid="create-sov-button"]'
        ],
        rfi: [
          'button:has-text("Create RFI")',
          'button:has-text("New RFI")',
          'button:has-text("Request for Information")',
          '[data-testid="create-rfi-button"]'
        ],
        submittal: [
          'button:has-text("Create Submittal")',
          'button:has-text("New Submittal")',
          '[data-testid="create-submittal-button"]'
        ],
        inspection: [
          'button:has-text("Create Inspection")',
          'button:has-text("New Inspection")',
          '[data-testid="create-inspection-button"]'
        ],
        changeRequest: [
          'button:has-text("Change Request")',
          'button:has-text("Create Change Request")',
          'button:has-text("New Change Request")',
          '[data-testid="create-change-request-button"]'
        ]
      }
    };
  }

  async goto() {
    await this.navigate('/dashboard');
  }

  async selectCompany(companyName = null) {
    console.log('🏢 Looking for company to select...');
    
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
    
    // Take screenshot before selecting company
    await this.takeScreenshot('before-company-selection');
    
    // Selectors for company cards/buttons
    const companySelectors = companyName ? [
      `text="${companyName}"`,
      `[title="${companyName}"]`,
      `.company-card:has-text("${companyName}")`,
      `div:has-text("${companyName}")`,
    ] : [
      // Generic selectors to click any company
      '.company-card',
      '[role="button"]:has(h3)',
      'div[cursor="pointer"]:has(h3)',
      'a[href*="/company"]',
      'button:has-text("Open")',
      'div:has(h3):has(p)', // Card with heading and paragraph
    ];

    try {
      // If no specific company name, try to find any clickable company element
      if (!companyName) {
        const companyHeading = await this.page.locator('h3').first().isVisible().catch(() => false);
        if (companyHeading) {
          console.log('📍 Found company heading, clicking parent container...');
          // Click the parent container of the h3 (the company card)
          await this.page.locator('h3').first().locator('..').locator('..').click({ timeout: 5000 });
          await this.waitForPageLoad();
          console.log('✅ Company selected');
          return;
        }
      }
      
      await this.helper.smartClick(companySelectors, { timeout: 5000 });
      await this.waitForPageLoad();
      console.log('✅ Company selected');
    } catch (error) {
      console.log('⚠️ Could not find company element to click');
      console.log(`Current URL: ${this.page.url()}`);
      throw new Error('Cannot select company. Please check dashboard state.');
    }
  }

  async createProject(projectData = {}) {
    console.log('🏗️ Creating new project...');
    
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
    
    // Take screenshot of projects page
    await this.takeScreenshot('projects-page');
    
    // Look for create/add project button
    const createButtonSelectors = [
      'button:has-text("Create Project")',
      'button:has-text("New Project")',
      'button:has-text("Add Project")',
      'button:has-text("Create")',
      'button:has-text("New")',
      'a:has-text("Create Project")',
      '[data-testid="create-project"]',
      'button[aria-label*="Create"]',
      'button:has(svg) >> text=Create',
    ];

    try {
      await this.helper.smartClick(createButtonSelectors, { timeout: 5000 });
      await this.page.waitForTimeout(2000);
      console.log('✅ Clicked create project button');
      
      // Fill project form
      const timestamp = Date.now();
      const projectName = projectData.name || `Test Project ${timestamp}`;
      const projectAddress = projectData.address || '123 Test Street, Test City';
      
      console.log(`📝 Filling project form: ${projectName}`);
      
      // Try to find and fill project name field
      const nameSelectors = [
        'input[name="name"]',
        'input[name="projectName"]',
        'input[name="project_name"]',
        'input[placeholder*="name" i]',
        'input[id*="name"]',
      ];
      
      await this.helper.smartFill(nameSelectors, projectName);
      console.log('✅ Filled project name');
      
      // Try to fill address if field exists
      const addressSelectors = [
        'input[name="address"]',
        'input[name="location"]',
        'input[placeholder*="address" i]',
        'textarea[name="address"]',
      ];
      
      try {
        await this.helper.smartFill(addressSelectors, projectAddress, { timeout: 3000 });
        console.log('✅ Filled project address');
      } catch (e) {
        console.log('⚠️ No address field found, skipping');
      }
      
      // Click submit/save button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Create")',
        'button:has-text("Save")',
        'button:has-text("Submit")',
        '[data-testid="submit-button"]',
      ];
      
      await this.helper.smartClick(submitSelectors, { timeout: 5000 });
      await this.waitForPageLoad();
      
      console.log('✅ Project created successfully');
      return projectName;
      
    } catch (error) {
      console.log('⚠️ Could not create project:', error.message);
      console.log(`Current URL: ${this.page.url()}`);
      
      // Take screenshot for debugging
      await this.takeScreenshot('project-creation-failed');
      
      throw new Error('Cannot create project. Check if create button exists or form fields match.');
    }
  }

  async selectProject(projectName = null) {
    console.log('🎯 Selecting project...');
    
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
    
    // If no project name specified, select the first project
    if (!projectName) {
      const projectSelectors = [
        '.project-card',
        '[role="button"]:has(h3)',
        'div[cursor="pointer"]:has(h3)',
        'a[href*="/project"]',
      ];
      
      try {
        await this.helper.smartClick(projectSelectors, { timeout: 5000 });
        await this.waitForPageLoad();
        console.log('✅ Project selected');
        return;
      } catch (e) {
        console.log('⚠️ No existing projects found');
      }
    } else {
      // Select specific project by name
      await this.helper.smartClick([`text="${projectName}"`], { timeout: 5000 });
      await this.waitForPageLoad();
      console.log(`✅ Selected project: ${projectName}`);
    }
  }

  async logout() {
    // Try to find and click user menu first
    if (await this.helper.elementExists(this.selectors.userMenu, { timeout: 3000 })) {
      await this.helper.smartClick(this.selectors.userMenu);
      await this.page.waitForTimeout(500);
    }

    // Click logout button
    await this.helper.smartClick(this.selectors.logoutButton);
    
    // Wait for redirect to login page
    await this.waitForPageLoad();
  }

  async isOnDashboard() {
    // Check for dashboard indicators
    const indicators = [
      'text=Dashboard',
      'text=Welcome',
      '[data-testid="dashboard"]',
      '.dashboard'
    ];
    
    for (const indicator of indicators) {
      if (await this.helper.elementExists(indicator, { timeout: 2000 })) {
        return true;
      }
    }
    return false;
  }

  async navigateToModule(moduleName) {
    console.log(`🔍 Looking for ${moduleName} navigation...`);
    
    // Wait for dashboard to load
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(2000);
    
    // Take screenshot to help debug
    await this.takeScreenshot(`dashboard-before-${moduleName.toLowerCase()}`);
    
    // Navigation strategies - more flexible
    const navSelectors = [
      `a:has-text("${moduleName}")`,
      `button:has-text("${moduleName}")`,
      `[href*="${moduleName.toLowerCase().replace(/\s+/g, '-')}"]`,
      `[data-testid="${moduleName.toLowerCase()}-nav"]`,
      `.nav-item:has-text("${moduleName}")`,
      `nav a:has-text("${moduleName}")`,
      `[role="navigation"] >> text="${moduleName}"`
    ];

    try {
      await this.helper.smartClick(navSelectors, { text: moduleName, timeout: 5000 });
      await this.waitForPageLoad();
      console.log(`✅ Navigated to ${moduleName}`);
    } catch (error) {
      console.log(`⚠️ Could not find ${moduleName} navigation element`);
      console.log(`Current URL: ${this.page.url()}`);
      
      // Try to find any navigation elements on the page
      const navElements = await this.page.locator('nav a, [role="navigation"] a').allTextContents().catch(() => []);
      console.log(`Available navigation: ${navElements.join(', ')}`);
      
      throw new Error(`Cannot navigate to ${moduleName}. Check if module exists in app navigation.`);
    }
  }

  async clickCreateButton(module) {
    const selector = this.selectors.createButtons[module];
    if (!selector) {
      throw new Error(`Unknown module: ${module}`);
    }

    await this.helper.smartClick(selector);
    await this.waitForPageLoad();
  }
}

module.exports = DashboardPage;


