// backend/utils/emailService.js
// Email service using Gmail SMTP (Mailjet removed)

// Re-export Gmail service functions
export {
  sendInvoiceEmail,
  testEmailConfig,
  sendVerificationEmail,
  sendAccountDeletionEmail,
  sendRefundApprovedEmail,
  sendRefundRejectedEmail,
} from './gmailService.js';
