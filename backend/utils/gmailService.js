// backend/utils/gmailService.js
// Email service using Gmail SMTP (free alternative to Mailjet)

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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
  const senderName = process.env.MAILJET_SENDER_NAME || 'Online Store';
  const senderEmail = process.env.GMAIL_USER;

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: customerEmail,
    subject: `Order Confirmation - Invoice #${orderId}`,
    text: `
Thank you for your order!

Order ID: ${orderId}
Total: $${orderDetails.totalPrice || 'N/A'}

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
              <p>Dear Customer,</p>
              <p>We're pleased to confirm that we've received your order. Your invoice is attached to this email.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Total:</strong> $${orderDetails.totalPrice || 'N/A'}</p>
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
