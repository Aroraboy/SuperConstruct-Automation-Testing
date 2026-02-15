/**
 * Quick script to scan inbox for invite emails and extract links
 */
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
require('dotenv').config();

async function checkInbox() {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.TEST_GMAIL_USER,
      pass: process.env.TEST_GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  await client.connect();
  const mailbox = await client.getMailboxLock('INBOX');

  try {
    // Search ALL recent emails (last 2 days), including read ones
    const since = new Date();
    since.setDate(since.getDate() - 2);

    const messages = [];
    for await (const msg of client.fetch({ since }, { source: true, uid: true })) {
      messages.push(msg);
    }

    console.log('Total recent emails:', messages.length);

    // Show last 15
    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 15); i--) {
      const parsed = await simpleParser(messages[i].source);
      const to = parsed.to ? parsed.to.text : 'N/A';
      const from = parsed.from ? parsed.from.text : 'N/A';
      const subject = parsed.subject || 'no subject';
      console.log(`\n--- Email #${i} (uid:${messages[i].uid}) ---`);
      console.log(`  To: ${to}`);
      console.log(`  From: ${from}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Date: ${parsed.date || 'N/A'}`);

      const body = (parsed.html || parsed.text || '').toLowerCase();
      if (body.includes('invite') || body.includes('invitation') || (subject && subject.toLowerCase().includes('invite'))) {
        console.log('  ** INVITE EMAIL FOUND **');
        // Extract ALL links from HTML
        const html = parsed.html || '';
        const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
        let match;
        const links = [];
        while ((match = linkRegex.exec(html)) !== null) {
          links.push(match[1]);
        }
        console.log(`  Links found: ${links.length}`);
        links.forEach((l, idx) => console.log(`    [${idx}] ${l}`));

        // Also print text preview
        const textBody = (parsed.text || '').substring(0, 2000);
        console.log(`  Text preview:\n${textBody}`);
      }
    }
  } finally {
    mailbox.release();
    await client.logout();
  }
}

checkInbox().catch(e => console.error(e.message));
