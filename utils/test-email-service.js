const MailSlurp = require('mailslurp-client').default;
const { createWorker } = require('tesseract.js');
const axios = require('axios');

require('dotenv').config();

const mailslurp = new MailSlurp({
  apiKey: process.env.MAILSLURP_API_KEY
});

/**
 * Extract OTP from image using Tesseract.js OCR
 * @param {Buffer} imageBuffer - Image buffer containing OTP
 * @returns {Promise<string>} - Extracted OTP digits
 */
async function extractOTPFromImage(imageBuffer) {
  console.log('🔍 Starting OCR analysis on OTP image...');
  
  try {
    const worker = await createWorker('eng');
    const result = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    // Extract only digits and take first 6 characters
    const otp = result.data.text.replace(/\D/g, '').substring(0, 6);
    
    if (!otp || otp.length < 4) {
      throw new Error(`Invalid OTP extracted: "${otp}". Expected 4-6 digits.`);
    }
    
    console.log(`✅ OCR Success - OTP Extracted: ${otp}`);
    console.log(`   Confidence: ${(result.data.confidence * 100).toFixed(2)}%`);
    
    return otp;
  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    throw error;
  }
}

/**
 * Download and extract OTP from email attachment image
 * @param {Object} email - Email object from MailSlurp
 * @returns {Promise<string>} - Extracted OTP
 */
async function extractOTPFromEmailAttachment(email) {
  try {
    if (!email.attachments || email.attachments.length === 0) {
      throw new Error('No attachments found in email');
    }

    const attachment = email.attachments[0];
    console.log(`📎 Found attachment: ${attachment.filename}`);
    
    // Download attachment
    const attachmentData = await mailslurp.emailControllerApi.downloadAttachment(
      attachment.id,
      email.id
    );

    // Convert to buffer
    const imageBuffer = Buffer.from(attachmentData);
    
    // Extract OTP using OCR
    const otp = await extractOTPFromImage(imageBuffer);
    return otp;
  } catch (error) {
    console.error('❌ Error extracting OTP from attachment:', error.message);
    throw error;
  }
}

/**
 * Wait for OTP email and extract OTP from image
 * @param {string} inboxId - MailSlurp inbox ID
 * @param {number} maxWaitTime - Max wait time in milliseconds (default 60s)
 * @returns {Promise<string>} - OTP code
 */
async function getOTPFromEmail(inboxId, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 2000; // Check every 2 seconds

  console.log('⏳ Waiting for OTP email with image attachment...');

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const emails = await mailslurp.emailControllerApi.getEmails(inboxId, {
        size: 1,
        sort: 'DESC'
      });

      if (emails && emails.length > 0) {
        const latestEmail = emails[0];
        
        // Check if email has attachments
        if (latestEmail.attachments && latestEmail.attachments.length > 0) {
          console.log(`📧 Email received with ${latestEmail.attachments.length} attachment(s)`);
          
          const otp = await extractOTPFromEmailAttachment(latestEmail);
          return otp;
        }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('Error polling emails:', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`⏰ Timeout: OTP email not received within ${maxWaitTime / 1000} seconds`);
}

/**
 * Create a temporary email inbox
 * @returns {Promise<Object>} - Inbox object with id and email address
 */
async function createTemporaryInbox() {
  try {
    const inbox = await mailslurp.inboxControllerApi.createInbox();
    console.log(`✅ Temporary inbox created: ${inbox.emailAddress}`);
    return inbox;
  } catch (error) {
    console.error('❌ Error creating inbox:', error.message);
    throw error;
  }
}

/**
 * Get OTP email content as text
 * @param {string} inboxId - MailSlurp inbox ID
 * @param {number} maxWaitTime - Max wait time in milliseconds
 * @returns {Promise<Object>} - Email object
 */
async function getLatestEmail(inboxId, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 2000;

  console.log('⏳ Waiting for email...');

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const emails = await mailslurp.emailControllerApi.getEmails(inboxId, {
        size: 1,
        sort: 'DESC'
      });

      if (emails && emails.length > 0) {
        const email = emails[0];
        console.log(`📧 Email received from: ${email.from}`);
        console.log(`   Subject: ${email.subject}`);
        return email;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('Error fetching email:', error.message);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`⏰ Timeout: Email not received within ${maxWaitTime / 1000} seconds`);
}

/**
 * Extract OTP from email body text (fallback if image fails)
 * @param {string} emailBody - Email body text
 * @returns {string|null} - OTP if found
 */
function extractOTPFromText(emailBody) {
  // Common OTP patterns
  const patterns = [
    /\b(\d{4})\b/, // 4 digits
    /\b(\d{6})\b/, // 6 digits
    /code[:\s]+(\d{4,6})/i,
    /otp[:\s]+(\d{4,6})/i,
    /verification[:\s]+(\d{4,6})/i
  ];

  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Delete inbox after tests
 * @param {string} inboxId - MailSlurp inbox ID
 */
async function deleteInbox(inboxId) {
  try {
    await mailslurp.inboxControllerApi.deleteInbox(inboxId);
    console.log(`✅ Temporary inbox deleted: ${inboxId}`);
  } catch (error) {
    console.error('⚠️  Error deleting inbox:', error.message);
  }
}

module.exports = {
  createTemporaryInbox,
  getOTPFromEmail,
  getLatestEmail,
  extractOTPFromImage,
  extractOTPFromEmailAttachment,
  extractOTPFromText,
  deleteInbox
};
