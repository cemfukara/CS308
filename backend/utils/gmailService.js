// backend/utils/gmailService.js
// Email service using Gmail SMTP (free alternative to Mailjet)

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { formatPrice } from '../../frontend/online-store/src/utils/formatPrice.js';

dotenv.config();

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Fix for self-signed certificate errors (common in university networks)
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

/**
 * Send invoice email with PDF attachment via Gmail SMTP
 * @param {string} customerEmail - Customer's email address
 * @param {number} orderId - Order ID
 * @param {Buffer} pdfBuffer - PDF invoice buffer
 * @param {Object} orderDetails - Order details for email content
 * @returns {Promise<Object>} - Email send result
 */
export async function sendInvoiceEmail(
  customerEmail,
  orderId,
  pdfBuffer,
  orderDetails = {}
) {
  const senderName = process.env.SENDER_NAME || 'Online Store';
  const senderEmail = process.env.GMAIL_USER;

  // Get customer name and currency
  const customerName = orderDetails.customerName || 'Customer';
  // const currencySymbol = orderDetails.currency === 'TRY' ? '₺' : '$'; // Unused, keeping for reference

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: customerEmail,
    subject: `Order Confirmation - Invoice #${orderId}`,
    text: `
Dear ${customerName},

Thank you for your order!

Order ID: ${orderId}
Total: ${formatPrice(orderDetails.totalPrice, orderDetails.currency)}

Your invoice is attached to this email as a PDF document.

If you have any questions about your order, please contact our support team.

Best regards,
${senderName}
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-details { background-color: white; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>We're pleased to confirm that we've received your order. Your invoice is attached to this email.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total:</strong> ${formatPrice(orderDetails.totalPrice, orderDetails.currency)}</p>
                <p><strong>Status:</strong> Processing</p>
              </div>
              
              <p>If you have any questions about your order, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>${senderName}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: `invoice-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail: Email sent successfully to:', customerEmail);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Gmail: Error sending email:', error.message);
    throw error;
  }
}

/**
 * Send verification code email for profile updates
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @param {string} firstName - User's first name
 * @returns {Promise<Object>} - Email send result
 */
export async function sendVerificationEmail(email, code, firstName = 'User') {
  const senderName = process.env.SENDER_NAME || 'TechZone';
  const senderEmail = process.env.GMAIL_USER;

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject: 'Verify Your Profile Update',
    text: `
Dear ${firstName},

You have requested to update your profile information.

Your verification code is: ${code}

This code will expire in 15 minutes.

If you did not request this change, please ignore this email.

Best regards,
${senderName}
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .code-box { 
              background-color: white; 
              padding: 20px; 
              margin: 20px 0; 
              border: 2px dashed #4CAF50; 
              text-align: center;
              border-radius: 5px;
            }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #4CAF50; 
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
            .warning { color: #ff6b6b; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Profile Update Verification</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName},</p>
              <p>You have requested to update your profile information. Please use the verification code below to confirm your changes:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p><strong>Important:</strong> This code will expire in 15 minutes.</p>
              
              <p class="warning">If you did not request this change, please ignore this email and your account will remain secure.</p>
              
              <p>Best regards,<br>${senderName}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail: Verification email sent to:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Gmail: Error sending verification email:', error.message);
    throw error;
  }
}

/**
 * Send account deletion verification code email
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 * @param {string} firstName - User's first name
 * @returns {Promise<Object>} - Email send result
 */
export async function sendAccountDeletionEmail(
  email,
  code,
  firstName = 'User'
) {
  const senderName = process.env.SENDER_NAME || 'TechZone';
  const senderEmail = process.env.GMAIL_USER;

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject: 'Account Deletion Confirmation',
    text: `
Dear ${firstName},

You have requested to DELETE your account.

Your verification code is: ${code}

This code will expire in 15 minutes.

⚠️ WARNING: This action is IRREVERSIBLE. Once confirmed, all your data will be permanently deleted.

If you did not request this, please ignore this email and contact our support team immediately.

Best regards,
${senderName}
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ff3b3b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .code-box { 
              background-color: white; 
              padding: 20px; 
              margin: 20px 0; 
              border: 2px dashed #ff3b3b; 
              text-align: center;
              border-radius: 5px;
            }
            .code { 
              font-size: 32px; 
              font-weight: bold; 
              color: #ff3b3b; 
              letter-spacing: 5px;
              font-family: 'Courier New', monospace;
            }
            .warning-box {
              background-color: #fff3cd;
              border: 2px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .warning-text {
              color: #856404;
              font-weight: bold;
            }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Account Deletion Request</h1>
            </div>
            <div class="content">
              <p>Dear ${firstName},</p>
              <p>You have requested to <strong>DELETE</strong> your account. Please use the verification code below to confirm this action:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning-box">
                <p class="warning-text">⚠️ WARNING: This action is IRREVERSIBLE!</p>
                <p>Once you confirm, all your data including orders, reviews, and personal information will be permanently deleted from our system.</p>
              </div>
              
              <p><strong>This code will expire in 15 minutes.</strong></p>
              
              <p style="color: #ff3b3b;">If you did not request this action, please ignore this email and contact our support team immediately to secure your account.</p>
              
              <p>Best regards,<br>${senderName}</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Gmail: Account deletion email sent to:', email);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error(
      '❌ Gmail: Error sending account deletion email:',
      error.message
    );
    throw error;
  }
}

/**
 * Send refund approval email
 * @param {string} email - Customer's email
 * @param {number} amount - Refund amount
 * @param {string} currency - Currency code
 * @param {string} productName - Name of product being refunded
 */
export async function sendRefundApprovedEmail(email, amount, currency, productName) {
  const senderName = process.env.SENDER_NAME || 'Online Store';
  const senderEmail = process.env.GMAIL_USER;
  
  const formattedAmount = formatPrice(amount, currency);

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: email,
    subject: 'Refund Approved',
    text: `
Dear Customer,

Your refund request for "${productName}" has been approved.

Refund Amount: ${formattedAmount}

The amount has been credited back to your original payment method.

Best regards,
${senderName}
    `.trim(),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
           <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .amount { font-size: 24px; font-weight: bold; color: #4CAF50; margin: 15px 0;}
           </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Refund Approved</h1>
            </div>
            <div class="content">
              <p>Dear Customer,</p>
              <p>Your refund request for <strong>${productName}</strong> has been processed and approved.</p>
              
              <div class="amount">Refund Amount: ${formattedAmount}</div>
              
              <p>The amount has been credited back to your original payment method.</p>
              
              <br>
              <p>Best regards,<br>${senderName}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Refund email sent to ${email}`);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Gmail: Error sending refund email:', error.message);
    // Don't throw, just log
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP configuration error:', error.message);
    return false;
  }
}