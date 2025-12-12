// backend/utils/emailService.js
// Email service using Mailjet for sending invoices and notifications

import Mailjet from 'node-mailjet';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Mailjet client
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

export async function sendEmail({
  to,
  toName = '',
  subject,
  textContent,
  htmlContent,
  attachments = [],
}) {
  try {
    const senderEmail = process.env.MAILJET_SENDER_EMAIL;
    const senderName = process.env.MAILJET_SENDER_NAME || 'Online Store';

    if (!senderEmail) {
      throw new Error('MAILJET_SENDER_EMAIL is not configured');
    }

    const messageData = {
      From: {
        Email: senderEmail,
        Name: senderName,
      },
      To: [
        {
          Email: to,
          Name: toName || to.split('@')[0], // Use email username if no name provided
        },
      ],
      Subject: subject,
      TextPart: textContent,
      HTMLPart: htmlContent,
      // Add custom headers to improve deliverability
      CustomID: `order-${Date.now()}`,
      // Enable tracking (optional - can help with deliverability reputation)
      TrackOpens: 'enabled',
      TrackClicks: 'enabled',
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      messageData.Attachments = attachments.map((att) => ({
        ContentType: att.contentType || 'application/pdf',
        Filename: att.filename,
        Base64Content: att.content.toString('base64'),
      }));
    }

    // For testing: Enable sandbox mode if configured
    const sandboxMode = process.env.MAILJET_SANDBOX_MODE === 'true';
    if (sandboxMode) {
      messageData.SandboxMode = true;
      console.log('🧪 Sandbox mode enabled - email will not be actually sent');
    }

    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [messageData],
    });

    const result = await request;
    console.log('✅ Email sent successfully to:', to);
    if (result.body && result.body.Messages) {
      console.log('📊 Email status:', result.body.Messages[0].Status);
    }
    return result.body;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    if (error.response) {
      console.error('Mailjet error details:', error.response.body);
    }
    throw error;
  }
}

/**
 * Send invoice email with PDF attachment
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
  const subject = `Order Confirmation - Invoice #${orderId}`;

  const textContent = `
Thank you for your order!

Order ID: ${orderId}
Total: $${orderDetails.totalPrice || 'N/A'}

Your invoice is attached to this email as a PDF document.

If you have any questions about your order, please contact our support team.

Best regards,
${process.env.MAILJET_SENDER_NAME || 'Online Store'}
  `.trim();

  const htmlContent = `
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
            
            <p>Best regards,<br>${process.env.MAILJET_SENDER_NAME || 'Online Store'}</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  return sendEmail({
    to: customerEmail,
    subject,
    textContent,
    htmlContent,
    attachments: [
      {
        filename: `invoice-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
