const nodemailer = require('nodemailer');
const ImapSimple = require('imap-simple');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

/**
 * OTP Reader Utility
 * Reads One-Time Passwords from Gmail inbox
 * Supports both text and image-based OTPs
 */
class OTPReader {
  constructor(email, appPassword) {
    this.email = email;
    this.appPassword = appPassword;
  }

  /**
   * Extract OTP from text
   */
  extractOTPFromText(text) {
    // Pattern 1: Standalone 6-digit number
    const sixDigitMatch = text.match(/\b(\d{6})\b/);
    if (sixDigitMatch) return sixDigitMatch[1];

    // Pattern 2: 4-digit OTP
    const fourDigitMatch = text.match(/\b(\d{4})\b/);
    if (fourDigitMatch) return fourDigitMatch[1];

    // Pattern 3: "OTP is 123456"
    const otpPatternMatch = text.match(/OTP[:\s]+(\d+)/i);
    if (otpPatternMatch) return otpPatternMatch[1];

    // Pattern 4: "Code: 123456"
    const codePatternMatch = text.match(/Code[:\s]+(\d+)/i);
    if (codePatternMatch) return codePatternMatch[1];

    // Pattern 5: "Verification code: 123456"
    const verificationMatch = text.match(/Verification[:\s]+(\d+)/i);
    if (verificationMatch) return verificationMatch[1];

    return null;
  }

  /**
   * Extract OTP from image using Tesseract OCR
   */
  async extractOTPFromImage(imagePath) {
    try {
      console.log('🖼️  Extracting OTP from image using OCR...');
      
      const worker = await createWorker();
      const { data: { text } } = await worker.recognize(imagePath);
      await worker.terminate();

      console.log('📖 OCR Text extracted:', text);
      const otp = this.extractOTPFromText(text);
      
      if (otp) {
        console.log(`✅ OTP extracted from image: ${otp}`);
      }
      
      return otp;
    } catch (error) {
      console.error('❌ Error reading image with OCR:', error.message);
      return null;
    }
  }

  /**
   * Read OTP from Gmail using IMAP
   * Looks for recent emails from SuperConstruct
   * Handles both text and image-based OTPs
   */
  async readOTPFromGmail() {
    try {
      console.log('🔐 Connecting to Gmail to read OTP...');

      const config = {
        imap: {
          user: this.email,
          password: this.appPassword,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          authTimeout: 5000
        }
      };

      const connection = await ImapSimple.connect(config);

      // Search for recent emails (last 10 minutes)
      const searchCriteria = ['UNSEEN'];
      const fetchOptions = { bodies: '' };

      const messages = await connection.search(searchCriteria, fetchOptions);

      if (messages.length === 0) {
        console.log('❌ No recent emails found');
        await connection.end();
        return null;
      }

      // Process most recent email
      const latestMessage = messages[messages.length - 1];
      const parts = ImapSimple.getParts(latestMessage.attributes);

      let otp = null;
      const tempDir = path.join(__dirname, '../temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      for (const part of parts) {
        // Try text first
        if (part.type === 'text' && part.subtype === 'plain') {
          try {
            const text = await connection.getPartData(latestMessage, part, {});
            console.log('📧 Email text content received');
            otp = this.extractOTPFromText(text.toString());

            if (otp) {
              console.log(`✅ OTP extracted from text: ${otp}`);
              break;
            }
          } catch (error) {
            console.warn('Could not extract text:', error.message);
          }
        }

        // If no text OTP, try images
        if (!otp && part.type === 'image') {
          try {
            console.log(`📸 Found image attachment: ${part.filename}`);
            const imageData = await connection.getPartData(latestMessage, part, {});
            const imagePath = path.join(tempDir, part.filename || `image_${Date.now()}.png`);
            
            // Save image
            fs.writeFileSync(imagePath, imageData);
            console.log(`💾 Image saved to: ${imagePath}`);

            // Extract OTP from image using OCR
            otp = await this.extractOTPFromImage(imagePath);

            if (otp) {
              // Clean up temp file
              fs.unlinkSync(imagePath);
              break;
            }
          } catch (error) {
            console.warn('Could not process image:', error.message);
          }
        }
      }

      await connection.end();
      return otp;
    } catch (error) {
      console.error('❌ Error reading Gmail:', error.message);
      return null;
    }
  }

  /**
   * Wait for OTP to arrive in email
   * Retries up to maxAttempts times with delay between attempts
   */
  async waitForOTP(maxAttempts = 5, delayMs = 3000) {
    console.log(`⏳ Waiting for OTP (max ${maxAttempts} attempts)...`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`\nAttempt ${attempt}/${maxAttempts}...`);

      const otp = await this.readOTPFromGmail();

      if (otp) {
        console.log(`✅ OTP found on attempt ${attempt}: ${otp}`);
        return otp;
      }

      if (attempt < maxAttempts) {
        console.log(`⏱️  Waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log('❌ Failed to retrieve OTP after all attempts');
    return null;
  }
}

module.exports = OTPReader;
