import PDFDocument from 'pdfkit';
import {
  getInvoicesByDateRange as modelGetInvoicesByDateRange,
  getInvoiceById as modelGetInvoiceById,
  getInvoiceItems as modelGetInvoiceItems,
  getRevenueProfitBetweenDates as modelGetRevenueProfitBetweenDates,
  getRevenueProfitChart as modelGetRevenueProfitChart,
} from '../../models/Invoice.js';

// Utility to parse & validate date query params
function parseDateRange(query) {
  const { start, end } = query;
  if (!start || !end) {
    const err = new Error(
      'Both start and end query parameters are required, e.g. ?start=2025-01-01&end=2025-01-31'
    );
    err.status = 400;
    throw err;
  }

  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) {
    const err = new Error('Invalid date format. Use YYYY-MM-DD or ISO date.');
    err.status = 400;
    throw err;
  }

  return { start, end };
}

// -----------------------------------------------
// GET /api/invoices/range?start=YYYY-MM-DD&end=YYYY-MM-DD
// -----------------------------------------------
export async function getInvoicesByDateRange(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const invoices = await modelGetInvoicesByDateRange(start, end);
    res.json(invoices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// -----------------------------------------------
// GET /api/invoices/:orderId/pdf
// -----------------------------------------------
export async function generateInvoicePDF(req, res) {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    if (!orderId) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const invoice = await modelGetInvoiceById(orderId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice/order not found' });
    }

    const items = await modelGetInvoiceItems(orderId);

    // Create the PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${orderId}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { underline: true });
    doc.moveDown();

    // Invoice details
    doc.fontSize(12).text(`Order ID: ${invoice.order_id}`);
    doc.text(`Customer Email: ${invoice.user_email}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(
      `Order Date: ${
        invoice.order_date
          ? new Date(invoice.order_date).toLocaleString()
          : 'N/A'
      }`
    );

    doc.moveDown();

    // Items
    doc.fontSize(14).text('Items:');
    doc.moveDown(0.5);

    items.forEach((i) => {
      doc
        .fontSize(12)
        .text(
          `${i.product_name} (x${i.quantity}) — $${Number(
            i.price_at_purchase
          ).toFixed(2)} each`
        );
    });

    doc.moveDown();
    doc
      .fontSize(14)
      .text(`Total: $${Number(invoice.total_price || 0).toFixed(2)}`);

    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// -----------------------------------------------
// GET /api/invoices/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD
// -----------------------------------------------
export async function getRevenueProfit(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const totals = await modelGetRevenueProfitBetweenDates(start, end);

    res.json({
      revenue: Number(totals.total_revenue || 0),
      cost: Number(totals.total_cost || 0),
      profit: Number(totals.total_profit || 0),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// -----------------------------------------------
// GET /api/invoices/chart?start=YYYY-MM-DD&end=YYYY-MM-DD
// -----------------------------------------------
export async function getRevenueProfitChartController(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const rows = await modelGetRevenueProfitChart(start, end);

    const chartData = rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue || 0),
      cost: Number(r.cost || 0),
      profit: Number(r.profit || 0),
    }));

    res.json(chartData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// -----------------------------------------------
// GET /api/invoices/:orderId/json
// -----------------------------------------------
export async function getInvoiceJson(req, res) {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    if (!orderId) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    // Get main invoice data
    const invoice = await modelGetInvoiceById(orderId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice/order not found' });
    }

    // Get line items
    const items = await modelGetInvoiceItems(orderId);

    // Format response exactly how the frontend expects
    return res.json({
      invoice: {
        order_id: invoice.order_id,
        customer_email: invoice.user_email,
        shipping_address: invoice.shipping_address || null,
        status: invoice.status,
        total_price: invoice.total_price,
        order_date: invoice.order_date,
      },
      items: items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price_at_purchase: i.price_at_purchase,
      })),
    });
  } catch (err) {
    console.error('getInvoiceJson error:', err);
    return res.status(500).json({ message: 'Failed to load invoice' });
  }
}
