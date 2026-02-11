const axios = require('axios');
const { createWorker } = require('tesseract.js');

require('dotenv').config();

// MailSlurp API configuration
const apiKey = process.env.MAILSLURP_API_KEY;
if (!apiKey) {
  throw new Error('MAILSLURP_API_KEY not found in environment variables. Check your .env file.');
}

const mailslurpAPI = axios.create({
  baseURL: 'https://api.mailslurp.com',
  params: {
    apiKey: apiKey
  }
});

console.log('✅ MailSlurp REST API initialized');

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
    
    // Download attachment using correct API
    const attachmentData = await mailslurp.downloadAttachment(attachment.id, email.id);

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
 * Wait for OTP email and extract OTP from email body
 * @param {string} inboxId - MailSlurp inbox ID
 * @param {number} maxWaitTime - Max wait time in milliseconds (default 60s)
 * @returns {Promise<string>} - OTP code
 */
async function getOTPFromEmail(inboxId, maxWaitTime = 60000) {
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds

  console.log('⏳ Waiting for OTP email...');
  console.log(`   Inbox ID: ${inboxId}`);
  console.log(`   Max wait: ${maxWaitTime / 1000} seconds`);

  let pollCount = 0;
  while (Date.now() - startTime < maxWaitTime) {
    try {
      pollCount++;
      console.log(`   📍 Poll #${pollCount}`);
      
      // Get emails from inbox using REST API
      const response = await mailslurpAPI.get(`/inboxes/${inboxId}/emails`, {
        params: {
          size: 10,
          sort: 'DESC'
        }
      });

      const emails = response.data;
      console.log(`   📬 Found ${emails ? emails.length : 0} emails`);

      if (emails && emails.length > 0) {
        const latestEmail = emails[0];
        console.log(`   📧 Latest email:`);
        console.log(`      From: ${latestEmail.from}`);
        console.log(`      Subject: ${latestEmail.subject}`);

        try {
          // Get full email content
          const emailResponse = await mailslurpAPI.get(`/emails/${latestEmail.id}`);
          const fullEmail = emailResponse.data;
          
          const bodyText = fullEmail.text || '';
          const bodyHtml = fullEmail.html || '';
          const body = fullEmail.body || '';
          
          console.log(`   📝 Email fields - text: ${bodyText ? 'yes' : 'no'}, html: ${bodyHtml ? 'yes' : 'no'}, body: ${body ? 'yes' : 'no'}`);
          console.log(`   📄 Full email object keys: ${Object.keys(fullEmail).join(', ')}`);
          
          // Try different field names that might contain the body
          const contentToSearch = bodyText || bodyHtml || body || fullEmail.textHtml || '';
          
          if (contentToSearch) {
            console.log(`   📝 Email body found, searching for OTP...`);
            console.log(`      Content preview: ${contentToSearch.substring(0, 300)}`);
            
            // Try to extract OTP from body text or HTML
            const otp = extractOTPFromText(contentToSearch);
            
            if (otp) {
              console.log(`   ✅ OTP extracted: ${otp}`);
              return otp;
            } else {
              console.log(`   ⚠️  No OTP pattern found in email`);
            }
          } else {
            console.log(`   ⚠️  Email body is empty`);
          }
        } catch (error) {
          console.log(`   ⚠️  Error fetching full email: ${error.message}`);
        }
      } else {
        console.log(`   ⏳ No emails yet, waiting...`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
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
    const response = await mailslurpAPI.post(`/inboxes`);
    const inbox = response.data;
    console.log(`✅ Temporary inbox created: ${inbox.emailAddress}`);
    return inbox;
  } catch (error) {
    console.error('❌ Error creating inbox:', error.message);
    throw error;
  }
}

/**
 * Get full email content
 * @param {string} emailId - Email ID
 * @returns {Promise<Object>} - Full email object
 */
async function getEmail(emailId) {
  try {
    return await mailslurp.getEmail(emailId);
  } catch (error) {
    console.error('Error getting email:', error.message);
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
      const emails = await mailslurp.getEmails(inboxId, {
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
  // Remove HTML tags and decode HTML entities for easier parsing
  let cleanBody = emailBody
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')  // Replace nbsp
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (match, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (match, code) => String.fromCharCode(parseInt(code, 16)));

  // Common OTP patterns - CHECK 6 DIGITS FIRST, THEN 4 DIGITS
  const patterns = [
    /verification\s+code\s+is[:\s]+(\d{6})/i,  // "verification code is: 123456"
    /verification[:\s]+(\d{6})/i,              // 6-digit verification code
    /otp[:\s]+(\d{6})/i,                       // 6-digit OTP
    /code[:\s]+(\d{6})/i,                      // 6-digit code
    /(\d{6})/,                                 // Any 6 consecutive digits
    /verification\s+code\s+is[:\s]+(\d{4})/i,  // "verification code is: 1234"
    /verification[:\s]+(\d{4})/i,              // 4-digit verification code
    /otp[:\s]+(\d{4})/i,                       // 4-digit OTP
    /code[:\s]+(\d{4})/i,                      // 4-digit code
    /(\d{4})/,                                 // Any 4 consecutive digits
  ];

  for (const pattern of patterns) {
    const match = cleanBody.match(pattern);
    if (match) {
      const otp = match[1];
      console.log(`   ✅ Pattern matched: ${pattern.toString()}`);
      console.log(`   ✅ Extracted OTP: ${otp}`);
      return otp;
    }
  }

  console.log(`   ❌ No OTP pattern matched in body`);
  console.log(`   📄 Cleaned body preview: ${cleanBody.substring(0, 500)}`);
  return null;
}

/**
 * Delete inbox after tests
 * @param {string} inboxId - MailSlurp inbox ID
 */
async function deleteInbox(inboxId) {
  try {
    await mailslurpAPI.delete(`/inboxes/${inboxId}`);
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
