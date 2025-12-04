// Quick test to verify PDF generation works correctly
// This can be run independently to test the PDF generator

import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Sample order data
const sampleOrder = {
    order_id: 12345,
    order_date: new Date().toISOString(),
    total_price: 159.97,
    shipping_address: '123 Main Street\nApt 4B\nNew York, NY 10001\nUSA',
    customer_email: 'customer@example.com',
};

// Sample order items
const sampleItems = [
    {
        product_id: 1,
        name: 'Wireless Mouse',
        model: 'MX Master 3',
        quantity: 2,
        price_at_purchase: 49.99,
    },
    {
        product_id: 2,
        name: 'Mechanical Keyboard',
        model: 'K95 RGB',
        quantity: 1,
        price_at_purchase: 59.99,
    },
];

console.log('Testing PDF invoice generation...');

try {
    const pdfBuffer = await generateInvoicePDF(sampleOrder, sampleItems);

    // Save the PDF to a test file
    const outputPath = join(process.cwd(), 'test-invoice.pdf');
    writeFileSync(outputPath, pdfBuffer);

    console.log('✅ PDF generated successfully!');
    console.log(`📄 Saved to: ${outputPath}`);
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    console.log('\nYou can now open test-invoice.pdf to verify the invoice format.');
} catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
}
