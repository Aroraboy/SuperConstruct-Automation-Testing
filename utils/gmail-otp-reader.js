/**
 * Gmail IMAP OTP Reader
 * 
 * Reads OTP codes from a dedicated Gmail account using IMAP.
 * Uses Gmail + aliases (e.g. testaccount+timestamp@gmail.com) for infinite
 * unique email addresses that all arrive in the same inbox.
 * 
 * Setup:
 *   1. Create a dedicated Gmail account for testing
 *   2. Enable 2-Step Verification in Google Account settings
 *   3. Generate an App Password: Google Account -> Security -> App Passwords
 *   4. Set TEST_GMAIL_USER and TEST_GMAIL_APP_PASSWORD in .env
 */

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const GMAIL_USER = process.env.TEST_GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.TEST_GMAIL_APP_PASSWORD || '';

/**
 * Generate a unique email address using Gmail + alias
 * Each call produces a unique address that maps to the same inbox
 * @returns {string} Unique email like testaccount+1739456789@gmail.com
 */
function generateTestEmail() {
  const timestamp = Date.now();
  const [localPart, domain] = GMAIL_USER.split('@');
  const email = `${localPart}+${timestamp}@${domain}`;
  console.log(`[EMAIL] Generated test email: ${email}`);
  return email;
}

/**
 * Connect to Gmail via IMAP
 * @returns {ImapFlow} Connected IMAP client
 */
async function connectToGmail() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    logger: false, // Suppress IMAP debug logs
  });

  await client.connect();
  return client;
}

/**
 * Wait for and extract OTP from Gmail for a specific + alias address
 * Polls the inbox until an email matching the alias is found
 * 
 * @param {string} aliasEmail - The full +alias email (e.g. test+123@gmail.com)
 * @param {number} maxWaitTime - Max wait time in milliseconds (default 60s)
 * @returns {Promise<string>} The extracted OTP code
 */
async function getOTPFromGmail(aliasEmail, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  let client;

  console.log(`[GMAIL] Waiting for OTP email...`);
  console.log(`   To: ${aliasEmail}`);
  console.log(`   Max wait: ${maxWaitTime / 1000} seconds`);

  try {
    client = await connectToGmail();
    let pollCount = 0;

    while (Date.now() - startTime < maxWaitTime) {
      pollCount++;
      console.log(`   [POLL] #${pollCount}`);

      // Open INBOX (reselect each poll to see new messages)
      const mailbox = await client.getMailboxLock('INBOX');

      try {
        // Search for recent emails sent to our specific alias
        // Gmail stores the full To address including the + alias
        const searchCriteria = {
          to: aliasEmail,
          seen: false, // Only unread emails
        };

        const messages = [];
        for await (const message of client.fetch(searchCriteria, {
          source: true,
          uid: true,
          envelope: true,
        })) {
          messages.push(message);
        }

        if (messages.length > 0) {
          // Get the most recent message
          const latest = messages[messages.length - 1];
          const parsed = await simpleParser(latest.source);

          console.log(`   [EMAIL] Found email:`);
          console.log(`      From: ${parsed.from?.text || 'unknown'}`);
          console.log(`      Subject: ${parsed.subject || 'no subject'}`);

          // Extract OTP from the email body
          const body = parsed.html || parsed.text || '';
          const otp = extractOTP(body);

          if (otp) {
            // Mark the email as read
            await client.messageFlagsAdd({ uid: latest.uid }, ['\\Seen']);
            console.log(`   [OK] OTP extracted: ${otp}`);
            return otp;
          } else {
            console.log(`   [WARNING] Email found but no OTP pattern matched`);
          }
        }
      } finally {
        mailbox.release();
      }

      // Wait before next poll
      if (Date.now() - startTime + pollInterval < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Timeout: OTP email not received within ${maxWaitTime / 1000} seconds`);
  } finally {
    if (client) {
      await client.logout().catch(() => {});
    }
  }
}

/**
 * Extract OTP code from email body (HTML or plain text)
 * Supports 4-digit and 6-digit OTP codes
 * @param {string} body - Email body (HTML or text)
 * @returns {string|null} OTP code or null
 */
function extractOTP(body) {
  // Strip HTML tags for pattern matching
  const cleanBody = body
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  // OTP patterns - 6-digit first, then 4-digit
  const patterns = [
    /verification\s+code\s+is[:\s]+(\d{6})/i,
    /otp[:\s]+(\d{6})/i,
    /code[:\s]+(\d{6})/i,
    /(\d{6})/,
    /verification\s+code\s+is[:\s]+(\d{4})/i,
    /otp[:\s]+(\d{4})/i,
    /code[:\s]+(\d{4})/i,
    /(\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = cleanBody.match(pattern);
    if (match) {
      console.log(`   [OK] Pattern matched: ${pattern.toString()}`);
      return match[1];
    }
  }

  console.log(`   [ERROR] No OTP pattern matched`);
  console.log(`   [BODY] Preview: ${cleanBody.substring(0, 300)}`);
  return null;
}

/**
 * Delete all test emails from the inbox (cleanup)
 * Removes emails sent to +alias addresses to prevent inbox buildup
 * @param {number} olderThanHours - Delete emails older than this many hours (default 24)
 */
async function cleanupTestEmails(olderThanHours = 24) {
  let client;
  try {
    client = await connectToGmail();
    const mailbox = await client.getMailboxLock('INBOX');

    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - olderThanHours);

      // Search for old emails from SuperConstruct
      const searchCriteria = {
        from: 'superconstruct',
        before: cutoff,
      };

      let deleted = 0;
      for await (const message of client.fetch(searchCriteria, { uid: true })) {
        await client.messageDelete({ uid: message.uid });
        deleted++;
      }

      console.log(`[CLEANUP] Deleted ${deleted} test emails older than ${olderThanHours} hours`);
    } finally {
      mailbox.release();
    }
  } finally {
    if (client) {
      await client.logout().catch(() => {});
    }
  }
}

module.exports = {
  generateTestEmail,
  getOTPFromGmail,
  cleanupTestEmails,
  extractOTP,
};
