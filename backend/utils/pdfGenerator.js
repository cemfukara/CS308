// backend/utils/pdfGenerator.js
// Helper to generate professional PDF invoices for orders using PDFKit

import PDFDocument from 'pdfkit';
import { formatPrice } from '../../frontend/online-store/src/utils/formatPrice.js';
import {
  INVOICE_CONFIG,
  getFormattedAddress,
  calculateVATBreakdown,
  formatInvoiceNumber,
} from '../config/invoiceConfig.js';

/**
 * Generate a professional PDF invoice buffer from order data
 * @param {Object} orderData - Order information
 * @param {number} orderData.order_id - Order ID
 * @param {string} orderData.customer_email - Customer email
 * @param {string} orderData.customer_name - Customer name
 * @param {string} orderData.customer_tax_id - Customer tax ID (optional)
 * @param {string} orderData.customer_address - Customer billing address (optional)
 * @param {string} orderData.status - Order status
 * @param {number} orderData.total_price - Total price (VAT inclusive)
 * @param {string} orderData.order_date - Order date
 * @param {string} orderData.shipping_address - Shipping address
 * @param {Array} items - Array of order items
 * @returns {Promise<Buffer>} - PDF buffer
 */
export function generateInvoicePDF(orderData, items) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with professional margins
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
      });

      // Buffer to store PDF data
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#2563eb'; // Blue
      const secondaryColor = '#64748b'; // Gray
      const darkColor = '#1e293b';
      const lightGray = '#f1f5f9';

      // Calculate VAT breakdown
      const vatBreakdown = calculateVATBreakdown(orderData.total_price);
      const invoiceNumber = formatInvoiceNumber(orderData.order_id);
      const invoiceDate = orderData.order_date
        ? new Date(orderData.order_date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

      // ===== HEADER SECTION =====
      // Store name
      doc
        .fillColor(primaryColor)
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(INVOICE_CONFIG.storeName, 50, 50);

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font('Helvetica')
        .text(INVOICE_CONFIG.storeTagline, 50, 82);

      // Invoice title on the right
      doc
        .fillColor(darkColor)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('INVOICE', 400, 50, { align: 'right' });

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font('Helvetica')
        .text(invoiceNumber, 400, 78, { align: 'right' });

      // Horizontal line
      doc
        .strokeColor(lightGray)
        .lineWidth(2)
        .moveTo(50, 110)
        .lineTo(545, 110)
        .stroke();

      doc.moveDown(3);

      // ===== INVOICE INFO SECTION =====
      const leftCol = 50;
      const rightCol = 350;
      let yPos = 140;

      // Left column - Bill To
      doc
        .fillColor(darkColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BILL TO:', leftCol, yPos);

      yPos += 18;
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .font('Helvetica')
        .text(orderData.customer_name || 'Customer', leftCol, yPos);

      yPos += 14;
      doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .text(orderData.customer_email, leftCol, yPos);

      // Customer Tax ID
      if (orderData.customer_tax_id) {
        yPos += 14;
        doc
          .fillColor(secondaryColor)
          .text(`Tax ID: ${orderData.customer_tax_id}`, leftCol, yPos);
      }

      // Customer Address (prefer customer's address over shipping address)
      const billingAddress = orderData.customer_address || orderData.shipping_address;
      if (billingAddress) {
        yPos += 14;
        const addressLines = billingAddress.split('\n');
        addressLines.forEach((line) => {
          doc
            .fillColor(secondaryColor)
            .text(line, leftCol, yPos);
          yPos += 12;
        });
      }

      // Right column - Invoice details
      yPos = 140;
      doc
        .fillColor(darkColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('INVOICE DETAILS:', rightCol, yPos);

      yPos += 18;
      doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Invoice Date:', rightCol, yPos);
      doc
        .fillColor(darkColor)
        .text(invoiceDate, rightCol + 100, yPos);

      yPos += 14;
      doc
        .fillColor(secondaryColor)
        .text('Order ID:', rightCol, yPos);
      doc
        .fillColor(darkColor)
        .text(`#${orderData.order_id}`, rightCol + 100, yPos);

      yPos += 14;
      doc
        .fillColor(secondaryColor)
        .text('Status:', rightCol, yPos);
      doc
        .fillColor(darkColor)
        .text(orderData.status || 'Processing', rightCol + 100, yPos);

      // Store information box
      yPos += 30;
      doc
        .fillColor(lightGray)
        .rect(rightCol, yPos, 195, 80)
        .fill();

      yPos += 10;
      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(INVOICE_CONFIG.storeName, rightCol + 10, yPos);

      yPos += 14;
      doc
        .fillColor(darkColor)
        .fontSize(8)
        .font('Helvetica')
        .text(getFormattedAddress(), rightCol + 10, yPos);

      yPos += 36;
      doc.text(`Tax ID: ${INVOICE_CONFIG.taxId}`, rightCol + 10, yPos);

      // ===== ITEMS TABLE =====
      yPos = 320;

      // Table header with background
      doc
        .fillColor(primaryColor)
        .rect(50, yPos, 495, 25)
        .fill();

      doc
        .fillColor('#ffffff')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('PRODUCT', 60, yPos + 8, { width: 220, align: 'left' })
        .text('QTY', 290, yPos + 8, { width: 50, align: 'center' })
        .text('UNIT PRICE', 350, yPos + 8, { width: 80, align: 'right' })
        .text('AMOUNT', 440, yPos + 8, { width: 95, align: 'right' });

      yPos += 30;

      // Table rows
      doc.fillColor(darkColor).font('Helvetica');

      items.forEach((item, index) => {
        const unitPrice = Number(item.price_at_purchase || 0);
        const quantity = Number(item.quantity || 1);
        const lineTotal = unitPrice * quantity;
        const productName = item.name || 'Unknown Product';

        // Alternating row background
        if (index % 2 === 0) {
          doc
            .fillColor('#f8fafc')
            .rect(50, yPos - 5, 495, 20)
            .fill();
        }

        doc
          .fillColor(darkColor)
          .fontSize(9)
          .text(productName, 60, yPos, { width: 220, align: 'left' })
          .text(`${quantity}`, 290, yPos, { width: 50, align: 'center' })
          .text(formatPrice(unitPrice, orderData.currency, false), 350, yPos, { width: 80, align: 'right' })
          .text(formatPrice(lineTotal, orderData.currency, false), 440, yPos, { width: 95, align: 'right' });

        yPos += 20;
      });

      // Add some spacing before totals
      yPos += 20;

      // ===== TOTALS SECTION =====
      const totalsX = 350;

      // Subtotal
      doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', totalsX, yPos, { width: 80, align: 'left' });
      doc
        .fillColor(darkColor)
        .text(formatPrice(vatBreakdown.subtotal, orderData.currency, false), 440, yPos, { width: 95, align: 'right' });

      yPos += 18;

      // VAT
      doc
        .fillColor(secondaryColor)
        .text(`VAT (${vatBreakdown.vatRate * 100}%):`, totalsX, yPos, { width: 80, align: 'left' });
      doc
        .fillColor(darkColor)
        .text(formatPrice(vatBreakdown.vat, orderData.currency, false), 440, yPos, { width: 95, align: 'right' });

      yPos += 18;

      // Line above total
      doc
        .strokeColor(primaryColor)
        .lineWidth(1)
        .moveTo(totalsX, yPos)
        .lineTo(545, yPos)
        .stroke();

      yPos += 10;

      // Total
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('TOTAL:', totalsX, yPos, { width: 80, align: 'left' });
      doc
        .text(formatPrice(vatBreakdown.total, orderData.currency, false), 440, yPos, { width: 95, align: 'right' });

      // ===== FOOTER =====
      yPos += 60;

      // Payment terms
      doc
        .fillColor(secondaryColor)
        .fontSize(8)
        .font('Helvetica')
        .text(INVOICE_CONFIG.paymentTerms, 50, yPos, { align: 'center', width: 495 });

      yPos += 15;

      // Thank you message
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(INVOICE_CONFIG.thankYouMessage, 50, yPos, { align: 'center', width: 495 });

      yPos += 20;

      // Footer note
      doc
        .fillColor(secondaryColor)
        .fontSize(7)
        .font('Helvetica')
        .text(INVOICE_CONFIG.footerNote, 50, yPos, { align: 'center', width: 495 });

      yPos += 12;

      // Contact information
      doc.text(
        `${INVOICE_CONFIG.email} | ${INVOICE_CONFIG.website}`,
        50,
        yPos,
        { align: 'center', width: 495 }
      );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
