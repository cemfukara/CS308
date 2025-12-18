// backend/config/invoiceConfig.js
// Configuration for invoice generation - store/business information

/**
 * Store and business information for invoice generation
 * These values are used in PDF invoices sent to customers
 */
export const INVOICE_CONFIG = {
  // Store Information
  storeName: 'TechZone',
  storeTagline: 'Online Electronics Store',

  // Tax Information
  taxId: '735 5608 031',
  vatRate: 0.20, // 20% VAT (Turkey standard rate)

  // Contact Information
  address: {
    street: 'Orta Mahalle, Üniversite Caddesi No:27',
    district: 'Tuzla',
    postalCode: '34956',
    city: 'İstanbul',
    country: 'Turkey',
  },

  // Contact details
  email: process.env.GMAIL_USER || 'support@techzone.com',
  phone: '+90 (216) 555-0100', // Optional placeholder
  website: 'www.techzone.com',

  // Invoice Settings
  invoicePrefix: 'INV', // Prefix for invoice numbers (e.g., INV-123)
  currency: 'TRY',
  currencySymbol: '₺',

  // Footer text
  paymentTerms: 'Payment is due upon receipt.',
  thankYouMessage: 'Thank you for shopping with TechZone!',
  footerNote: 'This is a computer-generated invoice and does not require a signature.',
};

/**
 * Format address for display on invoice
 * @returns {string} Formatted address
 */
export function getFormattedAddress() {
  const { address } = INVOICE_CONFIG;
  return `${address.street}\n${address.district}, ${address.postalCode} ${address.city}\n${address.country}`;
}

/**
 * Calculate VAT breakdown from total price (VAT-inclusive)
 * @param {number} totalPrice - Total price including VAT
 * @param {number} vatRate - VAT rate (default from config)
 * @returns {Object} { subtotal, vat, total }
 */
export function calculateVATBreakdown(totalPrice, vatRate = INVOICE_CONFIG.vatRate) {
  const total = Number(totalPrice);
  const subtotal = total / (1 + vatRate);
  const vat = total - subtotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100,
    vatRate: vatRate,
  };
}

/**
 * Format invoice number with prefix
 * @param {number} orderId - Order ID
 * @returns {string} Formatted invoice number
 */
export function formatInvoiceNumber(orderId) {
  return `${INVOICE_CONFIG.invoicePrefix}-${orderId}`;
}
