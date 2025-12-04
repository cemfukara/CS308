// Helper function to send emails (for order confirmations, password resets, etc.) using Mailjet.

import Mailjet from 'node-mailjet';

// Lazy initialization - mailjet client is created only when needed
let mailjetClient = null;

function getMailjetClient() {
    if (!mailjetClient) {
        // Only create the client when first needed
        if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_API_SECRET) {
            return null; // Return null if credentials not configured
        }

        mailjetClient = new Mailjet({
            apiKey: process.env.MAILJET_API_KEY,
            apiSecret: process.env.MAILJET_API_SECRET,
        });
    }
    return mailjetClient;
}

/**
 * Send an invoice email with PDF attachment
 * @param {string} recipientEmail - Customer's email address
 * @param {string} recipientName - Customer's name (optional)
 * @param {number} orderId - Order ID for reference
 * @param {Buffer} pdfBuffer - PDF invoice as Buffer
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendInvoiceEmail(
    recipientEmail,
    recipientName,
    orderId,
    pdfBuffer
) {
    try {
        // Get Mailjet client (lazy initialization)
        const mailjet = getMailjetClient();

        // Validate environment variables
        if (!mailjet) {
            console.error('Mailjet API credentials are not configured');
            return {
                success: false,
                error: 'Email service not configured',
            };
        }

        if (!process.env.MAILJET_SENDER_EMAIL) {
            console.error('Mailjet sender email is not configured');
            return {
                success: false,
                error: 'Sender email not configured',
            };
        }

        // Convert PDF buffer to base64 for attachment
        const pdfBase64 = pdfBuffer.toString('base64');

        // Send email using Mailjet
        const request = await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: process.env.MAILJET_SENDER_EMAIL,
                        Name: process.env.MAILJET_SENDER_NAME || 'Online Store',
                    },
                    To: [
                        {
                            Email: recipientEmail,
                            Name: recipientName || 'Valued Customer',
                        },
                    ],
                    Subject: `Order Confirmation - Invoice #${orderId}`,
                    TextPart: `Thank you for your order! Please find attached your invoice for order #${orderId}.`,
                    HTMLPart: `
            <h2>Thank you for your order!</h2>
            <p>Your order has been confirmed and is being processed.</p>
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p>Please find your invoice attached to this email.</p>
            <br>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>${process.env.MAILJET_SENDER_NAME || 'Online Store'}</p>
          `,
                    Attachments: [
                        {
                            ContentType: 'application/pdf',
                            Filename: `invoice-${orderId}.pdf`,
                            Base64Content: pdfBase64,
                        },
                    ],
                },
            ],
        });

        console.log(
            `✓ Invoice email sent successfully to ${recipientEmail} for order #${orderId}`
        );

        return { success: true };
    } catch (error) {
        console.error('Error sending invoice email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email',
        };
    }
}

/**
 * Send a general email (for password resets, notifications, etc.)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendEmail({ to, subject, text, html }) {
    try {
        // Get Mailjet client (lazy initialization)
        const mailjet = getMailjetClient();

        if (!mailjet) {
            console.error('Mailjet API credentials are not configured');
            return {
                success: false,
                error: 'Email service not configured',
            };
        }

        const request = await mailjet.post('send', { version: 'v3.1' }).request({
            Messages: [
                {
                    From: {
                        Email: process.env.MAILJET_SENDER_EMAIL,
                        Name: process.env.MAILJET_SENDER_NAME || 'Online Store',
                    },
                    To: [
                        {
                            Email: to,
                        },
                    ],
                    Subject: subject,
                    TextPart: text,
                    HTMLPart: html,
                },
            ],
        });

        console.log(`✓ Email sent successfully to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email',
        };
    }
}
