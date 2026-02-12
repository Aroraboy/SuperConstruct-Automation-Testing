const BasePage = require('./base.page');
const OTPReader = require('../utils/otp-reader');

class LoginPage extends BasePage {
  constructor(page, config) {
    super(page, config);
    
    // Multiple selector strategies for robustness
    this.selectors = {
      emailInput: [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email"]',
        'input[placeholder*="email" i]',
        '#email',
        '[data-testid="email-input"]'
      ],
      passwordInput: [
        'input[type="password"]',
        'input[name="password"]',
        'input[id*="password"]',
        '[data-testid="password-input"]'
      ],
      otpInput: [
        'input[name="otp"]',
        'input[id*="otp"]',
        'input[placeholder*="otp" i]',
        'input[placeholder*="code" i]',
        '[data-testid="otp-input"]',
        'input[maxlength="6"]'
      ],
      otpSubmitButton: [
        'button:has-text("Verify")',
        'button:has-text("Submit")',
        'button:has-text("Confirm")',
        'button[type="submit"]',
        '[data-testid="verify-button"]'
      ],
      loginButton: [
        'button[type="submit"]',
        'button:has-text("Log in")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        '[data-testid="login-button"]',
        '.login-button',
        '#login-button'
      ],
      signUpLink: [
        'a:has-text("Sign up")',
        'a:has-text("Register")',
        'a:has-text("Create account")',
        '[data-testid="signup-link"]'
      ],
      errorMessage: [
        '.error-message',
        '.alert-danger',
        '[role="alert"]',
        '.error',
        '[data-testid="error-message"]'
      ]
    };
  }

  async goto() {
    await this.navigate('/login');
  }

  async login(email, password) {
    // Fill email
    await this.helper.smartFill(this.selectors.emailInput, email, {
      role: 'textbox',
      name: /email/i
    });

    // Fill password
    await this.helper.smartFill(this.selectors.passwordInput, password, {
      role: 'textbox',
      name: /password/i
    });

    // Click login button
    await this.helper.smartClick(this.selectors.loginButton, {
      role: 'button',
      name: /log in|sign in|login/i
    });

    // Wait for navigation or dashboard
    await this.waitForPageLoad();
  }

  async loginWithTestUser() {
    const user = this.config.getTestUser();
    await this.login(user.email, user.password);
  }

  async isLoggedIn() {
    // Check for common logged-in indicators
    const indicators = [
      'button:has-text("Logout")',
      'button:has-text("Log out")',
      'a:has-text("Logout")',
      '[data-testid="user-menu"]',
      '.user-profile',
      '.logout-button'
    ];

    return await this.helper.elementExists(indicators);
  }

  /**
   * Check if OTP input screen is visible
   */
  async isOTPScreenVisible() {
    return await this.helper.elementExists(this.selectors.otpInput, { timeout: 5000 });
  }

  /**
   * Manual OTP entry - user types it when prompted
   */
  async submitOTPManual() {
    console.log('\n' + '='.repeat(60));
    console.log('[LOCK] OTP VERIFICATION REQUIRED');
    console.log('='.repeat(60));
    console.log('\n[EMAIL] An OTP has been sent to your email');
    console.log('[CAMERA] Screenshot of OTP screen saved to: reports/screenshots/');
    console.log('\n⏳ Waiting for your input...');
    console.log('Please enter the OTP you received in your email inbox');
    console.log('='.repeat(60) + '\n');

    // Wait for user input - simple approach
    // In real scenario, you'd enter via CLI or automated system
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Enter OTP (6 digits): ', async (otpCode) => {
        rl.close();
        await this.submitOTP(otpCode.trim());
        resolve(true);
      });
    });
  }

  /**
   * Login with OTP - tries automatic then falls back to manual
   */
  async loginWithOTPAuto(email, password, gmailAppPassword) {
    console.log('[LOCK] Starting login with OTP verification...');

    // Step 1: Enter credentials and submit
    await this.login(email, password);

    // Step 2: Check if OTP screen appears
    const otpScreenVisible = await this.isOTPScreenVisible();

    if (!otpScreenVisible) {
      console.log('✅ No OTP required - login successful');
      return true;
    }

    console.log('[PHONE] OTP screen detected');

    // Take screenshot for user reference
    await this.takeScreenshot('otp-screen');

    // Try automatic reading first
    if (gmailAppPassword && gmailAppPassword !== 'YOUR_GMAIL_APP_PASSWORD_HERE') {
      try {
        console.log('[EMAIL] Attempting to read OTP from Gmail...');
        const OTPReader = require('../utils/otp-reader');
        const otpReader = new OTPReader(email, gmailAppPassword);
        const otp = await otpReader.waitForOTP(3, 2000);

        if (otp) {
          console.log(`✅ OTP read successfully: ${otp}`);
          await this.submitOTP(otp);
          return true;
        }
      } catch (error) {
        console.warn('⚠️  Automatic OTP reading failed, falling back to manual input');
      }
    }

    // Fallback: Manual entry
    console.log('\n⚠️  Could not read OTP automatically');
    return await this.submitOTPManual();
  }

  async getErrorMessage() {
    try {
      return await this.helper.getTextContent(this.selectors.errorMessage);
    } catch {
      return null;
    }
  }

  async clickSignUp() {
    await this.helper.smartClick(this.selectors.signUpLink);
  }
}

module.exports = LoginPage;



