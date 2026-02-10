## Utils Folder - Helper Functions & Utilities

This folder contains reusable helper functions and managers used across the test suite.

### 📁 Files

| File                  | Purpose                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **config-manager.js** | Loads and manages test configuration from `config/test.config.json`<br>Provides dot-notation access to nested config values                                                  |
| **test-helper.js**    | Smart element finding and interaction<br>Includes retry logic and multiple selector strategies<br>Methods: `findElement()`, `smartClick()`, `smartFill()`, `elementExists()` |
| **otp-reader.js**     | Reads OTP (One-Time Password) from Gmail inbox<br>Used for two-factor authentication in login flow<br>Requires Gmail app password                                            |
| **constants.js**      | Centralized constants for the entire test suite<br>Includes timeouts, module paths, project IDs<br>Reduces magic numbers throughout codebase                                 |

### 🔧 Usage Examples

#### ConfigManager

```javascript
const config = require("../utils/config-manager");

config.get("app.webUrl"); // Get app base URL
config.getAppUrl(); // Same as above
config.getTestUser(); // Get test user credentials
config.get("timeouts.short"); // Get timeout value
config.get("testData.sovTestData"); // Get test data
```

#### TestHelper

```javascript
const TestHelper = require("../utils/test-helper");
const helper = new TestHelper(page, config);

await helper.findElement("button.submit"); // Find element
await helper.smartClick('button[type="submit"]'); // Click with retry
await helper.smartFill('input[name="email"]', "test@example.com"); // Fill input
await helper.elementExists("div.error-message"); // Check element exists
```

#### Constants

```javascript
const { TIMEOUTS, MODULES, PROJECT_IDS } = require("../utils/constants");

TIMEOUTS.LONG; // 30000ms
MODULES.RFI; // '/tools/rfi'
PROJECT_IDS.TEST_PROJECT; // '24939171-2ea4-4f4f-b283-3462b4e4b307'
```

### 📋 Notes

- **config-manager.js** is a singleton - loaded once at startup
- **test-helper.js** is instantiated per page object
- **otp-reader.js** requires valid Gmail app password in config
- **constants.js** is imported as needed for centralized values
