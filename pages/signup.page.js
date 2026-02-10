const BasePage = require('./base.page');

class SignUpPage extends BasePage {
  constructor(page, config) {
    super(page, config);
    
    this.selectors = {
      firstNameInput: [
        'input[name="firstName"]',
        'input[name="first_name"]',
        'input[id*="first" i]',
        'input[placeholder*="first name" i]',
        '[data-testid="firstname-input"]'
      ],
      lastNameInput: [
        'input[name="lastName"]',
        'input[name="last_name"]',
        'input[id*="last" i]',
        'input[placeholder*="last name" i]',
        '[data-testid="lastname-input"]'
      ],
      emailInput: [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email"]',
        '[data-testid="email-input"]'
      ],
      passwordInput: [
        'input[type="password"][name*="password"]:not([name*="confirm"])',
        'input[name="password"]',
        'input[id="password"]',
        '[data-testid="password-input"]'
      ],
      confirmPasswordInput: [
        'input[name*="confirm" i][type="password"]',
        'input[name="confirmPassword"]',
        'input[name="password_confirmation"]',
        '[data-testid="confirm-password-input"]'
      ],
      signUpButton: [
        'button[type="submit"]',
        'button:has-text("Sign up")',
        'button:has-text("Register")',
        'button:has-text("Create Account")',
        '[data-testid="signup-button"]'
      ],
      termsCheckbox: [
        'input[type="checkbox"]',
        'input[name*="terms" i]',
        'input[name*="agree" i]',
        '[data-testid="terms-checkbox"]'
      ]
    };
  }

  async goto() {
    await this.navigate('/signup');
  }

  async signUp(userData) {
    // Fill first name
    await this.helper.smartFill(this.selectors.firstNameInput, userData.firstName);

    // Fill last name
    await this.helper.smartFill(this.selectors.lastNameInput, userData.lastName);

    // Fill email
    await this.helper.smartFill(this.selectors.emailInput, userData.email);

    // Fill password
    await this.helper.smartFill(this.selectors.passwordInput, userData.password);

    // Fill confirm password if exists
    if (await this.helper.elementExists(this.selectors.confirmPasswordInput, { timeout: 2000 })) {
      await this.helper.smartFill(this.selectors.confirmPasswordInput, userData.password);
    }

    // Check terms checkbox if exists
    if (await this.helper.elementExists(this.selectors.termsCheckbox, { timeout: 2000 })) {
      const checkbox = await this.helper.findElement(this.selectors.termsCheckbox);
      if (!(await checkbox.isChecked())) {
        await checkbox.check();
      }
    }

    // Click sign up button
    await this.helper.smartClick(this.selectors.signUpButton);

    // Wait for success
    await this.waitForPageLoad();
  }

  async signUpWithNewUser() {
    const user = this.config.getNewUser();
    // Add timestamp to make email unique
    const uniqueEmail = user.email.replace('@', `+${Date.now()}@`);
    await this.signUp({
      ...user,
      email: uniqueEmail
    });
  }
}

module.exports = SignUpPage;


