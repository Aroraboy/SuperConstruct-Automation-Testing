## PROJECT STRUCTURE

A clean, readable organization for the SuperConstruct test automation framework.

```
SuperConstruct/
│
├── ### README.md                    ← START HERE (Project overview)
├── ### package.json                 ← Dependencies & NPM scripts
├── ### playwright.config.js         ← Playwright configuration
├── ### .env.example                 ← Environment variables template
├── ### .gitignore                   ← Git ignore rules
│
├── ### config/
│   └── test.config.json            ← Test configuration (URLs, credentials, test data)
│
├── ### tests/                       ← All test files
│   ├── ### README.md                ← Test suite documentation
│   ├── ### global-setup.js          ← Global setup (runs once before all tests)
│   ├── ### smoke-test.spec.js       ← Smoke tests (14 modules, ~2 min)
│   ├── ### data-driven-tests.spec.js ← Data-driven tests (39 tests, ~4 min)
│   ├── ### comprehensive-functional.spec.js ← Full end-to-end tests
│   ├── ### test-data.json           ← Test data for all modules
│   ├── ### auth/                    ← Authentication tests
│   │   ├── login.spec.js
│   │   └── signup.spec.js
│   ├── ### modules/                 ← Individual module tests
│   │   ├── rfi.spec.js
│   │   ├── submittal.spec.js
│   │   ├── inspection.spec.js
│   │   ├── sov.spec.js
│   │   ├── change-request.spec.js
│   │   └── users.spec.js
│   └── ### comprehensive/           ← Advanced test scenarios
│
├── ### pages/                       ← Page Objects (POM pattern)
│   ├── ### README.md                ← Page object documentation
│   ├── ### base.page.js             ← Base class (common functionality)
│   ├── ### login.page.js            ← Login & authentication
│   ├── ### signup.page.js           ← User registration
│   ├── ### dashboard.page.js        ← Project dashboard
│   └── ### create-module.page.js    ← Generic module creation
│
├── ### utils/                       ← Helper utilities
│   ├── ### README.md                ← Utils documentation
│   ├── ### config-manager.js        ← Configuration loader
│   ├── ### test-helper.js           ← Smart element interactions
│   ├── ### otp-reader.js            ← Gmail OTP reader
│   └── ### constants.js             ← Centralized constants
│
├── ### scripts/
│   └── setup.js                    ← Initial setup script
│
├── ### reports/                     ← Test results (generated)
│   ├── html-report/                ← HTML report with screenshots
│   ├── test-results.json           ← JSON results for CI/CD
│   ├── screenshots/                ← Failure screenshots
│   ├── videos/                     ← Test recordings
│   └── traces/                     ← Playwright traces
│
├── ### test-results/                ← Detailed test artifacts (generated)
│
├── ### screenshots/                 ← Additional screenshots
│
├── ### .auth/                       ← Authentication state (git ignored)
│   └── user.json                   ← Session cookies (DO NOT COMMIT)
│
└── ### .github/
    └── workflows/                  ← CI/CD workflows
        └── tests.yml               ← GitHub Actions configuration
```

## ### Quick Reference

### What Each Folder Does

| Folder       | Purpose             | Frequency      | Notes                                   |
| ------------ | ------------------- | -------------- | --------------------------------------- |
| **config/**  | Configuration files | Edit as needed | Contains URLs, credentials, test data   |
| **tests/**   | Test suites         | Most important | Main test files - modify for new tests  |
| **pages/**   | Page objects        | Modify often   | Reduce duplication, improve readability |
| **utils/**   | Helper functions    | Reference only | Reusable utilities for all tests        |
| **scripts/** | Setup scripts       | Run once       | Initial environment setup               |
| **reports/** | Test artifacts      | Auto-generated | Created after test runs                 |
| **.auth/**   | Session state       | Auto-generated | Created by global-setup                 |

### File Purposes

| File                        | Type     | Purpose                                |
| --------------------------- | -------- | -------------------------------------- |
| `package.json`              | Config   | NPM dependencies and scripts           |
| `playwright.config.js`      | Config   | Browser setup, reporters, timeouts     |
| `.env.example`              | Template | Environment variables template         |
| `test.config.json`          | Config   | App URLs, test credentials, test data  |
| `global-setup.js`           | Setup    | Login once, save session for all tests |
| `smoke-test.spec.js`        | Test     | Quick health check (2 min)             |
| `data-driven-tests.spec.js` | Test     | Comprehensive testing (4 min)          |
| `test-data.json`            | Data     | Test scenarios for all modules         |
| `base.page.js`              | Code     | Base class for all page objects        |
| `login.page.js`             | Code     | Login and OTP flow                     |
| `config-manager.js`         | Code     | Configuration loader                   |
| `test-helper.js`            | Code     | Smart element interactions             |
| `constants.js`              | Code     | Centralized constants                  |

## ### Where to Start

1. **First time?** → Read [README.md](../README.md)
2. **Setting up?** → Read [tests/README.md](../tests/README.md)
3. **Adding tests?** → Read [pages/README.md](../pages/README.md) & [utils/README.md](../utils/README.md)
4. **Running tests?** → Use `npm run test:smoke` or `npm run test:data-driven`
5. **Debugging?** → Run `npm run test:headed` or `npm run test:debug`

## ### Finding Things

- **Need to add/edit test?** → Look in `tests/` folder
- **Need to update login?** → Edit `pages/login.page.js`
- **Need to update test data?** → Edit `tests/test-data.json`
- **Need app URLs?** → Check `config/test.config.json`
- **Need reusable function?** → Check `utils/test-helper.js`
- **Need helper constant?** → Check `utils/constants.js`

## ### Code Quality

- ✅ No AI branding in code
- ✅ Clear variable names
- ✅ JSDoc comments on key files
- ✅ Logical folder structure
- ✅ Page Object Pattern (DRY principle)
- ✅ Centralized constants
- ✅ Professional naming conventions

