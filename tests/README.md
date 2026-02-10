## Tests Folder - Test Suites

This folder contains all test files organized by test type and module.

### 📂 Structure

```
tests/
├── global-setup.js                 # Runs once before all tests
├── smoke-test.spec.js              # Quick sanity checks
├── data-driven-tests.spec.js       # Multiple scenarios per module
├── comprehensive-functional.spec.js # Full end-to-end workflows
├── test-data.json                  # Test data for all modules
├── auth/                           # Authentication tests
│   ├── login.spec.js              # Login functionality
│   └── signup.spec.js             # User registration
├── modules/                        # Individual module tests
│   ├── rfi.spec.js                # RFI module
│   ├── submittal.spec.js          # Submittal module
│   ├── inspection.spec.js         # Inspection module
│   ├── sov.spec.js                # SOV module
│   ├── change-request.spec.js     # Change Request module
│   └── users.spec.js              # User management
└── comprehensive/                 # Advanced scenarios
    └── [additional tests]
```

### 🧪 Test Types

| File                                 | Type        | Duration  | Purpose                                  | When to Run                   |
| ------------------------------------ | ----------- | --------- | ---------------------------------------- | ----------------------------- |
| **smoke-test.spec.js**               | Smoke       | ~2 min    | Quick validation of all 14 modules       | Daily, before deployment      |
| **data-driven-tests.spec.js**        | Data-Driven | ~3-4 min  | Multiple scenarios per module (39 tests) | Before deployment, regression |
| **comprehensive-functional.spec.js** | Functional  | ~5-10 min | Complete workflows with real data        | Weekly, CI/CD                 |
| **auth/**                            | Unit        | ~1-2 min  | Login/signup only                        | Before auth changes           |
| **modules/**                         | Feature     | ~2-3 min  | Individual module tests                  | After module changes          |

### 📋 Test Files

#### global-setup.js

- Runs ONCE before all tests
- Logs in to app
- Saves authentication state
- All tests reuse saved session
- **Benefit**: Faster tests, no repeated login

#### smoke-test.spec.js

- ✅ 14 tests (one per module)
- Validates all modules load without errors
- Checks for 404/500 errors
- **Perfect for**: Daily smoke testing

#### data-driven-tests.spec.js

- ✅ 39 tests with multiple scenarios
- Tests: RFI, Submittal, Inspection, SOV, Change Request, Daily Logs, Expense, Message Board, Members, Edge Cases
- Uses test-data.json for test data
- **Perfect for**: Comprehensive regression testing

#### auth/\*.spec.js

- Tests login/logout functionality
- Tests invalid credentials
- Tests signup flow
- Does NOT use saved session (tests auth itself)

#### modules/\*.spec.js

- Tests individual module features
- RFI creation, Submittal management, etc.
- Used for focused testing on specific modules

### 📊 Test Coverage Summary

| Module         | Smoke | Data-Driven | Functional | Total |
| -------------- | ----- | ----------- | ---------- | ----- |
| RFI            | ✅    | ✅ (3)      | -          | ✅    |
| Submittal      | ✅    | ✅ (3)      | -          | ✅    |
| Inspection     | ✅    | ✅ (3)      | -          | ✅    |
| SOV            | ✅    | ✅ (4)      | -          | ✅    |
| Change Request | ✅    | ✅ (3)      | -          | ✅    |
| Members        | ✅    | ✅ (4)      | -          | ✅    |
| And 8 more...  | ✅    | ✅          | -          | ✅    |
| **TOTAL**      | 14    | 39          | TBD        | 53+   |

### 🚀 Running Tests

```bash
# Run all tests
npm run test:all

# Run smoke tests only (fastest)
npm run test:smoke

# Run data-driven tests
npm run test:data-driven

# Run authentication tests only
npm run test:auth

# Run module tests
npm run test:modules

# Run with browser visible (helpful for debugging)
npm run test:headed

# Debug mode (interactive inspector)
npm run test:debug

# View test report
npm run report
```

### 💡 Best Practices

1. **Keep tests independent** - Each test should work alone
2. **Use page objects** - Don't write selectors in tests
3. **Use descriptive names** - Test name should explain what it tests
4. **Use test.step()** - Organize test into logical steps
5. **Log important data** - Help with debugging
6. **Use test-data.json** - Centralize test data, don't hardcode

### 🧬 Example: Writing a New Test

```javascript
const { test, expect } = require("@playwright/test");
const MyPage = require("../pages/my-feature.page");
const config = require("../utils/config-manager");

test.describe("My Feature", () => {
  let myPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page, config);
  });

  test("should do something", async ({ page }) => {
    await test.step("Navigate to feature", async () => {
      await page.goto(`/app/my-feature`);
    });

    await test.step("Perform action", async () => {
      await myPage.doSomething();
    });

    await test.step("Verify result", async () => {
      const result = await page.locator(".result").textContent();
      expect(result).toBe("Expected value");
    });
  });
});
```

### 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](../../TECHNICAL_GUIDE.md)
- [Test Execution Guide](../../TEST_EXECUTION_GUIDE.md)
