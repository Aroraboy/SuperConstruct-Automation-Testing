/**
 * Gmail Invite Link Reader
 * 
 * Reads invitation emails from Gmail and extracts:
 *   - The invite/accept link (token URL)
 *   - The OTP code embedded in the email body
 * Uses the same IMAP setup as gmail-otp-reader.js.
 *
 * Email format from SuperConstruct:
 *   Subject: "Welcome to <Company> on SuperConstruct"
 *   Body contains: OTP code + Accept Invitation link
 *   Link format: https://beta.superconstruct.io/auth/register/otp?token=<token>
 */

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const GMAIL_USER = process.env.TEST_GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.TEST_GMAIL_APP_PASSWORD || '';

async function connectToGmail() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
    logger: false,
  });
  await client.connect();
  return client;
}

/**
 * Wait for and extract invitation data from Gmail for a specific +alias address.
 * Returns both the invite link (token URL) and the OTP code.
 * Searches unread emails only and marks them as read after extraction.
 *
 * @param {string} aliasEmail - The full +alias email (e.g. aroradivyansh995+projectmgr47@gmail.com)
 * @param {number} maxWaitTime - Max wait time in ms (default 60s)
 * @returns {Promise<{link: string, otp: string}>} The invitation link URL and OTP code
 */
async function getInviteDataFromGmail(aliasEmail, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  let client;

  console.log(`[GMAIL] Looking for invitation email...`);
  console.log(`   To: ${aliasEmail}`);
  console.log(`   Max wait: ${maxWaitTime / 1000} seconds`);

  try {
    client = await connectToGmail();
    let pollCount = 0;

    while (Date.now() - startTime < maxWaitTime) {
      pollCount++;
      console.log(`   [POLL] #${pollCount}`);

      const mailbox = await client.getMailboxLock('INBOX');

      try {
        // Search by 'to' address — read or unread
        const searchCriteria = {
          to: aliasEmail,
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
          // Check each message (most recent first) for an invite link
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const parsed = await simpleParser(msg.source);

            console.log(`   [EMAIL] Found email:`);
            console.log(`      From: ${parsed.from?.text || 'unknown'}`);
            console.log(`      Subject: ${parsed.subject || 'no subject'}`);

            // Only process invitation emails
            const subject = parsed.subject || '';
            if (!subject.includes('Welcome to') && !subject.toLowerCase().includes('invit')) {
              continue;
            }

            const htmlBody = parsed.html || '';
            const textBody = parsed.text || '';

            const link = extractInviteLink(htmlBody, textBody);
            const otp = extractOTPFromBody(textBody || htmlBody);

            if (link) {
              // Mark as read so we don't re-process
              await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']);
              console.log(`   [OK] Invite link: ${link}`);
              console.log(`   [OK] OTP: ${otp || 'not found'}`);
              return { link, otp };
            } else {
              console.log(`   [WARNING] Email found but no invite link matched`);
            }
          }
        }
      } finally {
        mailbox.release();
      }

      if (Date.now() - startTime + pollInterval < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Timeout: Invitation email not received within ${maxWaitTime / 1000} seconds`);
  } finally {
    if (client) {
      await client.logout().catch(() => {});
    }
  }
}

/**
 * Convenience wrapper that returns just the link (backward compat)
 */
async function getInviteLinkFromGmail(aliasEmail, maxWaitTime = 60000) {
  const data = await getInviteDataFromGmail(aliasEmail, maxWaitTime);
  return data.link;
}

/**
 * Decode HTML entities in URLs (e.g. &#x3D; -> =)
 */
function decodeHtmlEntities(str) {
  return str
    .replace(/&#x3D;/gi, '=')
    .replace(/&amp;/gi, '&')
    .replace(/&#x26;/gi, '&')
    .replace(/&#x3F;/gi, '?')
    .replace(/&#x2F;/gi, '/');
}

/**
 * Extract invitation link from email body.
 * The link format is: https://beta.superconstruct.io/auth/register/otp?token=<token>
 * HTML emails may have HTML-encoded entities (&#x3D; for =).
 *
 * @param {string} htmlBody - Email HTML body
 * @param {string} textBody - Email text body
 * @returns {string|null} The invite link URL or null
 */
function extractInviteLink(htmlBody, textBody) {
  // Strategy 1: Extract from plain text body (cleanest)
  if (textBody) {
    const textPattern = /(https?:\/\/[^\s]*superconstruct[^\s]*token[^\s]*)/gi;
    const match = textPattern.exec(textBody);
    if (match) {
      // Clean trailing brackets or punctuation
      let url = match[1].replace(/[\]\)>]+$/, '');
      console.log(`   [OK] Found invite link (text body): ${url}`);
      return url;
    }
  }

  // Strategy 2: Extract from HTML href and decode entities
  if (htmlBody) {
    const hrefPattern = /href=["'](https?:\/\/[^"']*token[^"']*)["']/gi;
    let match;
    while ((match = hrefPattern.exec(htmlBody)) !== null) {
      let url = decodeHtmlEntities(match[1]);
      if (url.includes('superconstruct')) {
        console.log(`   [OK] Found invite link (html href): ${url}`);
        return url;
      }
    }
  }

  // Strategy 3: Look for any superconstruct register link
  const combined = textBody || htmlBody || '';
  const fallbackPattern = /(https?:\/\/[^\s"'<>]*superconstruct[^\s"'<>]*register[^\s"'<>]*)/gi;
  const fbMatch = fallbackPattern.exec(combined);
  if (fbMatch) {
    let url = decodeHtmlEntities(fbMatch[1]);
    console.log(`   [OK] Found invite link (fallback): ${url}`);
    return url;
  }

  // Debug
  const cleanBody = (textBody || htmlBody || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`   [DEBUG] Body preview: ${cleanBody.substring(0, 500)}`);

  return null;
}

/**
 * Extract OTP code from the email body.
 * The email contains "Here's your OTP to complete the registration:\n\n<6-digit-code>"
 *
 * @param {string} body - Email body (text or HTML)
 * @returns {string|null} The OTP code or null
 */
function extractOTPFromBody(body) {
  // Look for 6-digit code after "OTP" keyword
  const otpPattern = /OTP[^\d]*(\d{6})/i;
  const match = otpPattern.exec(body);
  if (match) return match[1];

  // Fallback: look for standalone 6-digit number
  const digitPattern = /\b(\d{6})\b/;
  const dMatch = digitPattern.exec(body);
  if (dMatch) return dMatch[1];

  return null;
}

module.exports = {
  getInviteDataFromGmail,
  getInviteLinkFromGmail,
  extractInviteLink,
  extractOTPFromBody,
};
