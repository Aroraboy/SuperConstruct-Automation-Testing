/**
 * Gmail Invite Link Reader
 * 
 * Reads invitation emails from Gmail and extracts the invite/accept link.
 * Uses the same IMAP setup as gmail-otp-reader.js.
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
 * Wait for and extract an invitation link from Gmail for a specific +alias address
 * @param {string} aliasEmail - The full +alias email (e.g. aroradivyansh995+projectmgr47@gmail.com)
 * @param {number} maxWaitTime - Max wait time in ms (default 60s)
 * @returns {Promise<string>} The invitation link URL
 */
async function getInviteLinkFromGmail(aliasEmail, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  let client;

  console.log(`[GMAIL] Waiting for invitation email...`);
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
        const searchCriteria = {
          to: aliasEmail,
          seen: false,
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

            const body = parsed.html || parsed.text || '';
            const link = extractInviteLink(body);

            if (link) {
              // Mark as read
              await client.messageFlagsAdd({ uid: msg.uid }, ['\\Seen']);
              console.log(`   [OK] Invite link extracted: ${link}`);
              return link;
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
 * Extract invitation link from email body
 * Looks for links containing invite/accept/join patterns from superconstruct.io
 * @param {string} body - Email body (HTML or text)
 * @returns {string|null} The invite link URL or null
 */
function extractInviteLink(body) {
  // Look for href links in HTML
  const hrefPattern = /href=["'](https?:\/\/[^"']*(?:invite|accept|join|register|signup)[^"']*?)["']/gi;
  let match;
  while ((match = hrefPattern.exec(body)) !== null) {
    const url = match[1];
    if (url.includes('superconstruct')) {
      console.log(`   [OK] Found invite link (href): ${url}`);
      return url;
    }
  }

  // Fallback: look for any superconstruct link in the body
  const linkPattern = /(https?:\/\/[^\s"'<>]*superconstruct[^\s"'<>]*)/gi;
  while ((match = linkPattern.exec(body)) !== null) {
    const url = match[1];
    // Skip unsubscribe, logo, and other non-invite links
    if (url.includes('unsubscribe') || url.includes('logo') || url.includes('.png') || url.includes('.jpg')) continue;
    console.log(`   [OK] Found superconstruct link: ${url}`);
    return url;
  }

  // Last resort: look for any link with token/invite in it
  const tokenPattern = /href=["'](https?:\/\/[^"']*(?:token|invitation)[^"']*?)["']/gi;
  while ((match = tokenPattern.exec(body)) !== null) {
    console.log(`   [OK] Found token link: ${match[1]}`);
    return match[1];
  }

  // Debug: print a preview of the body
  const cleanBody = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(`   [DEBUG] Body preview: ${cleanBody.substring(0, 500)}`);

  return null;
}

module.exports = {
  getInviteLinkFromGmail,
  extractInviteLink,
};
