const InvoiceModel = require('../models/Invoice.js');
const PDFDocument = require('pdfkit');

// Utility to parse & validate date query params
function parseDateRange(query) {
  const { start, end } = query;
  if (!start || !end) {
    const err = new Error('Both start and end query parameters are required, e.g. ?start=2025-01-01&end=2025-01-31');
    err.status = 400;
    throw err;
  }
  // Basic validation - you may want more robust validation in production
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    const err = new Error('Invalid date format. Use YYYY-MM-DD or an ISO date.');
    err.status = 400;
    throw err;
  }
  return { start: start, end: end };
}

module.exports = {
  // GET /api/invoices/range?start=YYYY-MM-DD&end=YYYY-MM-DD
  async getInvoicesByDateRange(req, res, next) {
    try {
      const { start, end } = parseDateRange(req.query);
      const invoices = await InvoiceModel.getInvoicesByDateRange(start, end);
      res.json(invoices);
    } catch (err) {
      next(err);
    }
  },

  // GET /api/invoices/:orderId/pdf
  async generateInvoicePDF(req, res, next) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (!orderId) {
        return res.status(400).json({ message: 'Invalid order ID' });
      }

      const invoice = await InvoiceModel.getInvoiceById(orderId);
      if (!invoice) return res.status(404).json({ message: 'Invoice/order not found' });

      const items = await InvoiceModel.getInvoiceItems(orderId);

      // Build PDF
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
      doc.pipe(res);

      // Header
      doc.fontSize(20).text('INVOICE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${invoice.order_id}`);
      doc.text(`Customer Email: ${invoice.user_email}`);
      doc.text(`Status: ${invoice.status}`);
      doc.text(`Order Date: ${invoice.order_date ? new Date(invoice.order_date).toLocaleString() : 'N/A'}`);
      doc.moveDown();

      // Items table
      doc.fontSize(14).text('Items:');
      doc.moveDown(0.5);

      items.forEach(i => {
        const line = `${i.product_name} (x${i.quantity}) — $${Number(i.price_at_purchase).toFixed(2)} each`;
        doc.fontSize(12).text(line);
      });

      doc.moveDown();
      doc.fontSize(14).text(`Total: $${Number(invoice.total_price || 0).toFixed(2)}`, { bold: true });

      doc.end();
      // no res.json because streaming pdf
    } catch (err) {
      next(err);
    }
  },

  // GET /api/invoices/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD
  async getRevenueProfit(req, res, next) {
    try {
      const { start, end } = parseDateRange(req.query);
      const totals = await InvoiceModel.getRevenueProfitBetweenDates(start, end);
      // Normalize numbers to float
      res.json({
        revenue: Number(totals.total_revenue || 0),
        cost: Number(totals.total_cost || 0),
        profit: Number(totals.total_profit || 0)
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/invoices/chart?start=YYYY-MM-DD&end=YYYY-MM-DD
  async getRevenueProfitChart(req, res, next) {
    try {
      const { start, end } = parseDateRange(req.query);
      const rows = await InvoiceModel.getRevenueProfitChart(start, end);
      // Format: [{ day: '2025-10-01', revenue: 100, cost: 50, profit: 50}, ...]
      const chartData = rows.map(r => ({
        day: r.day,
        revenue: Number(r.revenue || 0),
        cost: Number(r.cost || 0),
        profit: Number(r.profit || 0)
      }));
      res.json(chartData);
    } catch (err) {
      next(err);
    }
  }
};

// backend/controllers/invoiceController.js
const PDFDocument = require('pdfkit');
const invoiceModel = require('../models/invoice');

exports.getInvoicePdf = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await invoiceModel.getInvoiceById(orderId);
    const items = await invoiceModel.getInvoiceItems(orderId);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Start PDF
    const doc = new PDFDocument({ margin: 30 });

    // Setup headers for file download in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

    // Pipe to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text(`Invoice #${orderId}`, { align: 'center' });
    doc.moveDown();

    // Basic info
    doc.fontSize(12)
      .text(`Customer: ${invoice.user_email}`)
      .text(`Date: ${invoice.order_date}`)
      .text(`Status: ${invoice.status}`);
      
    doc.moveDown();

    // Table header
    doc.text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Items list
    items.forEach(i => {
      doc.text(`${i.product_name} - Qty: ${i.quantity} - Price: \$${i.price_at_purchase}`);
    });

    doc.moveDown();

    // Total
    doc.fontSize(14).text(`Total: $${invoice.total_price}`, { align: 'right' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
};

