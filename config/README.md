# Configuration Setup

## Setup Instructions

1. **Copy the example config:**

   ```bash
   cp config/test.config.example.json config/test.config.json
   ```

2. **Edit `config/test.config.json` with your credentials:**

   ```json
   {
     "testUser": {
       "email": "your-test-email@gmail.com",
       "password": "your-test-password",
       "gmailAppPassword": "your-gmail-app-password"
     }
   }
   ```

3. **Get Gmail App Password:**
   - Enable 2FA on your Google Account
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
   - Replace spaces with spaces in config (it's already formatted)

4. **Never commit `test.config.json`:**
   - ✓ It's in `.gitignore` - automatically excluded
   - ✓ Only `test.config.example.json` is committed
   - ✓ Keep your credentials safe!

## Security Best Practices

- ✅ Add credentials to `config/test.config.json` (local only)
- ✅ Commit only `test.config.example.json` (template)
- ✅ Add `.env` or config files to `.gitignore`
- ❌ Never commit passwords or API keys to GitHub
- ❌ Never share credentials in commits or PRs

## For CI/CD (GitHub Actions, Jenkins)

Use **repository secrets** instead of config files:

```yaml
# In GitHub Actions
env:
  TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
  TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
```

Then read from environment variables in your tests.
