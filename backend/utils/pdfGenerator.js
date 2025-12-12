// backend/utils/pdfGenerator.js
// Helper to generate PDF invoices for orders using PDFKit

import PDFDocument from 'pdfkit';
import {formatPrice} from '../../frontend/online-store/src/utils/formatPrice.js';

/**
 * Generate a PDF invoice buffer from order data
 * @param {Object} orderData - Order information
 * @param {number} orderData.order_id - Order ID
 * @param {string} orderData.customer_email - Customer email
 * @param {string} orderData.status - Order status
 * @param {number} orderData.total_price - Total price
 * @param {string} orderData.order_date - Order date
 * @param {Array} items - Array of order items
 * @returns {Promise<Buffer>} - PDF buffer
 */
export function generateInvoicePDF(orderData, items) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({ margin: 40 });

      // Buffer to store PDF data
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Determine currency symbol
      // Note: PDFKit's default font doesn't support ₺ symbol, so we use "TL" for Turkish Lira
      const currencySymbol = orderData.currency === 'TRY' ? 'TL' : '$';

      // Header
      doc.fontSize(24).text('INVOICE', { align: 'center', underline: true });
      doc.moveDown(1.5);

      // Company/Store info (optional - customize as needed)
      doc
        .fontSize(10)
        .text(`Invoice Date: ${new Date().toLocaleDateString()}`, {
          align: 'right',
        });
      doc.moveDown(0.5);

      // Divider line
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(570, doc.y)
        .stroke();
      doc.moveDown();

      // Invoice details section
      doc.fontSize(12).fillColor('#000000').text('Invoice Details:', {
        underline: true,
      });
      doc.moveDown(0.5);

      doc.fontSize(10);
      doc.text(`Order ID: ${orderData.order_id}`);
      doc.text(`Customer: ${orderData.customer_name || 'Customer'}`);
      doc.text(`Email: ${orderData.customer_email}`);
      doc.text(`Status: ${orderData.status || 'Processing'}`);
      doc.text(
        `Order Date: ${
          orderData.order_date
            ? new Date(orderData.order_date).toLocaleString()
            : 'N/A'
        }`
      );

      doc.moveDown(1.5);

      // Items section
      doc.fontSize(14).text('Order Items:', { underline: true });
      doc.moveDown(0.5);

      // Table header
      const tableTop = doc.y;
      doc.fontSize(10).fillColor('#555555');
      doc.text('Product', 40, tableTop, { width: 250 });
      doc.text('Quantity', 300, tableTop, { width: 80, align: 'center' });
      doc.text('Unit Price', 390, tableTop, { width: 80, align: 'right' });
      doc.text('Subtotal', 480, tableTop, { width: 90, align: 'right' });

      // Draw line under header
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(40, tableTop + 15)
        .lineTo(570, tableTop + 15)
        .stroke();

      doc.moveDown(1.2);

      // Table rows
      doc.fillColor('#000000');
      items.forEach((item) => {
        const itemY = doc.y;
        const unitPrice = Number(item.price_at_purchase || 0);
        const quantity = Number(item.quantity || 1);
        const subtotal = unitPrice * quantity;
        
        // Use item.name which comes from the products table join
        const productName = item.name || 'Unknown Product';

        doc.text(productName, 40, itemY, { width: 250 });
        doc.text(`${quantity}`, 300, itemY, { width: 80, align: 'center' });
        doc.text(`${formatPrice(unitPrice, orderData.currency,false)}`, 390, itemY, {
          width: 80,
          align: 'right',
        });
        doc.text(`${formatPrice(subtotal, orderData.currency,false)}`, 480, itemY, {
          width: 90,
          align: 'right',
        });

        doc.moveDown(0.8);
      });

      doc.moveDown(0.5);

      // Total section
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(390, doc.y)
        .lineTo(570, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .fillColor('#000000')
        .text('Total:', 390, doc.y, { width: 80, align: 'right' });
      doc.text(
        `${formatPrice(orderData.total_price, orderData.currency,false)}`,
        480,
        doc.y - 14,
        { width: 90, align: 'right' }
      );

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(9)
        .fillColor('#777777')
        .text('Thank you for your purchase!', { align: 'center' });
      doc.text('If you have any questions, please contact our support team.', {
        align: 'center',
      });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
