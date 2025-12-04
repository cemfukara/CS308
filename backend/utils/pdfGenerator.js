// Helper to generate PDF invoices for orders.

import PDFDocument from 'pdfkit';

/**
 * Generate a PDF invoice for an order
 * @param {Object} orderData - Order information
 * @param {number} orderData.order_id - Order ID
 * @param {string} orderData.order_date - Order date
 * @param {number} orderData.total_price - Total price
 * @param {string} orderData.shipping_address - Shipping address
 * @param {string} orderData.customer_email - Customer email
 * @param {Array} items - Array of order items
 * @param {number} items[].product_id - Product ID
 * @param {string} items[].name - Product name
 * @param {string} items[].model - Product model
 * @param {number} items[].quantity - Quantity ordered
 * @param {number} items[].price_at_purchase - Price at purchase
 * @returns {Promise<Buffer>} - PDF as Buffer
 */
export function generateInvoicePDF(orderData, items) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            // Collect PDF data into buffers
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // ===== HEADER =====
            doc
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('INVOICE', { align: 'center' });

            doc.moveDown(0.5);

            // Company/Store info (you can customize this)
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('Online Store', { align: 'center' })
                .text('www.yourstore.com', { align: 'center' })
                .text('support@yourstore.com', { align: 'center' });

            doc.moveDown(1.5);

            // Line separator
            doc
                .strokeColor('#aaaaaa')
                .lineWidth(1)
                .moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .stroke();

            doc.moveDown(1);

            // ===== ORDER INFO =====
            const infoY = doc.y;

            // Left column - Order details
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Invoice Number:', 50, infoY)
                .font('Helvetica')
                .text(`#${orderData.order_id}`, 150, infoY);

            doc
                .font('Helvetica-Bold')
                .text('Order Date:', 50, infoY + 20)
                .font('Helvetica')
                .text(
                    new Date(orderData.order_date).toLocaleDateString(),
                    150,
                    infoY + 20
                );

            doc
                .font('Helvetica-Bold')
                .text('Customer Email:', 50, infoY + 40)
                .font('Helvetica')
                .text(orderData.customer_email || 'N/A', 150, infoY + 40);

            // Right column - Shipping address
            if (orderData.shipping_address) {
                doc
                    .font('Helvetica-Bold')
                    .text('Shipping Address:', 320, infoY)
                    .font('Helvetica')
                    .text(orderData.shipping_address, 320, infoY + 15, {
                        width: 230,
                        align: 'left',
                    });
            }

            doc.moveDown(4);

            // ===== ITEMS TABLE =====
            const tableTop = doc.y + 20;
            const itemCodeX = 50;
            const descriptionX = 150;
            const quantityX = 350;
            const priceX = 420;
            const totalX = 490;

            // Table header
            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Product', itemCodeX, tableTop)
                .text('Description', descriptionX, tableTop)
                .text('Qty', quantityX, tableTop)
                .text('Price', priceX, tableTop)
                .text('Total', totalX, tableTop);

            // Header line
            doc
                .strokeColor('#aaaaaa')
                .lineWidth(1)
                .moveTo(50, tableTop + 15)
                .lineTo(550, tableTop + 15)
                .stroke();

            // Items
            doc.font('Helvetica');
            let yPosition = tableTop + 25;

            items.forEach((item, index) => {
                const itemTotal = item.quantity * item.price_at_purchase;

                doc
                    .fontSize(9)
                    .text(`#${item.product_id}`, itemCodeX, yPosition)
                    .text(
                        `${item.name}${item.model ? ' - ' + item.model : ''}`,
                        descriptionX,
                        yPosition,
                        {
                            width: 180,
                        }
                    )
                    .text(item.quantity.toString(), quantityX, yPosition)
                    .text(`$${item.price_at_purchase.toFixed(2)}`, priceX, yPosition)
                    .text(`$${itemTotal.toFixed(2)}`, totalX, yPosition);

                yPosition += 25;

                // Add page break if needed
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }
            });

            // Bottom line
            doc
                .strokeColor('#aaaaaa')
                .lineWidth(1)
                .moveTo(50, yPosition)
                .lineTo(550, yPosition)
                .stroke();

            yPosition += 15;

            // ===== TOTALS =====
            const subtotal = items.reduce(
                (sum, item) => sum + item.quantity * item.price_at_purchase,
                0
            );

            doc
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Subtotal:', 420, yPosition)
                .text(`$${subtotal.toFixed(2)}`, totalX, yPosition, { align: 'right' });

            yPosition += 20;

            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('TOTAL:', 420, yPosition)
                .text(`$${orderData.total_price.toFixed(2)}`, totalX, yPosition, {
                    align: 'right',
                });

            // ===== FOOTER =====
            doc
                .fontSize(8)
                .font('Helvetica')
                .text(
                    'Thank you for your business!',
                    50,
                    doc.page.height - 50,
                    {
                        align: 'center',
                        width: 500,
                    }
                );

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}
