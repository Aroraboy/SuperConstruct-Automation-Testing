## Pages Folder - Page Objects

This folder contains Page Object Models (POM) that encapsulate page interactions and reduce duplication in tests.

### ### Architecture

```
BasePage (base.page.js)
├── LoginPage (login.page.js)
├── SignupPage (signup.page.js)
├── DashboardPage (dashboard.page.js)
└── CreateModulePage (create-module.page.js)
```

### ### Files

| File                      | Purpose                                                                                          | Methods                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **base.page.js**          | Base class inherited by all page objects<br>Common functionality: navigation, waits, screenshots | `navigate()`, `waitForPageLoad()`, `takeScreenshot()`                                       |
| **login.page.js**         | Login page interactions<br>Handles regular login and OTP flow                                    | `login()`, `loginWithTestUser()`, `loginWithOTPAuto()`, `submitOTPManual()`, `isLoggedIn()` |
| **signup.page.js**        | Sign-up / Registration flow                                                                      | `signup()`, `fillSignupForm()`, `verifySignupSuccess()`                                     |
| **dashboard.page.js**     | Project dashboard navigation                                                                     | `navigateToProject()`, `navigateToModule()`                                                 |
| **create-module.page.js** | Generic form for creating modules<br>(RFI, SOV, Submittal, etc.)                                 | `fillForm()`, `submit()`, `verifyCreated()`                                                 |

### ### Usage Pattern

```javascript
// Instead of writing selectors in tests:
// ❌ BAD
await page.fill('input[name="email"]', "test@example.com");
await page.click('button:has-text("Login")');

// ✅ GOOD
const loginPage = new LoginPage(page, config);
await loginPage.loginWithTestUser();
```

### ### Key Principles

1. **Single Responsibility** - Each page handles one page/feature
2. **Encapsulation** - Hide selector details, expose high-level actions
3. **Reusability** - Tests use simple, readable methods
4. **Maintainability** - Change selectors in one place
5. **Inheritance** - Extend BasePage to reuse common functionality

### ### Adding a New Page Object

1. Create new file: `my-feature.page.js`
2. Extend BasePage:

```javascript
const BasePage = require("./base.page");

class MyFeaturePage extends BasePage {
  constructor(page, config) {
    super(page, config);
    // Define selectors
    this.selectors = {
      title: "h1.page-title",
      submitBtn: 'button[type="submit"]',
    };
  }

  async doSomething() {
    await this.page.locator(this.selectors.submitBtn).click();
    await this.waitForPageLoad();
  }
}

module.exports = MyFeaturePage;
```

3. Import and use in tests

