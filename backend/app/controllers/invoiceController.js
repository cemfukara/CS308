import { generateInvoicePDF as generateProfessionalInvoice } from '../../utils/pdfGenerator.js';
import { findById as findUserById } from '../../models/User.js';
import {
  getInvoicesByDateRange as modelGetInvoicesByDateRange,
  getInvoiceById as modelGetInvoiceById,
  getInvoiceItems as modelGetInvoiceItems,
  getRevenueProfitBetweenDates as modelGetRevenueProfitBetweenDates,
  getRevenueProfitChart as modelGetRevenueProfitChart,
} from '../../models/Invoice.js';
import logger from '../../utils/logger.js';

//------------------------------------------------------
// Utility to parse & validate date query params
//------------------------------------------------------
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
// GET /api/invoices/range
// -----------------------------------------------
export async function getInvoicesByDateRange(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const invoices = await modelGetInvoicesByDateRange(start, end);

    logger.info('Invoices fetched by date range', {
      start,
      end,
      count: invoices.length,
    });

    res.json(invoices);
  } catch (err) {
    logger.error('Error fetching invoices by date range', {
      query: req.query ?? null,
      error: err,
    });

    res.status(err.status || 500).json({
      message: err.status ? err.message : 'Internal server error',
    });
  }
}

// -----------------------------------------------
// GET /api/invoices/:orderId/pdf
// -----------------------------------------------
export async function generateInvoicePDF(req, res) {
  try {
    const orderId = parseInt(req.params.orderId, 10);

    if (!orderId) {
      logger.warn('Generate invoice PDF failed: invalid orderId', {
        orderId: req.params.orderId,
      });

      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const invoice = await modelGetInvoiceById(orderId);

    if (!invoice) {
      logger.warn('Invoice PDF generation failed: invoice not found', {
        orderId,
      });

      return res.status(404).json({ message: 'Invoice/order not found' });
    }

    const items = await modelGetInvoiceItems(orderId);

    let userInfo = null;
    if (invoice.user_id) {
      try {
        userInfo = await findUserById(invoice.user_id);
      } catch (err) {
        logger.warn('Failed to fetch user info for invoice PDF', {
          orderId,
          userId: invoice.user_id,
          error: err.message,
        });
      }
    }

    const customerName = userInfo
      ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() ||
        'Customer'
      : 'Customer';

    const pdfBuffer = await generateProfessionalInvoice(
      {
        order_id: orderId,
        customer_email: invoice.user_email,
        customer_name: customerName,
        customer_tax_id: userInfo?.tax_id || null,
        customer_address: userInfo?.address || null,
        shipping_address: invoice.shipping_address || null,
        status: invoice.status,
        total_price: invoice.total_price,
        order_date: invoice.order_date,
        currency: invoice.currency || 'TRY',
      },
      items
    );

    logger.info('Invoice PDF generated', {
      orderId,
      itemCount: items.length,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${orderId}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    logger.error('Invoice PDF generation error', {
      orderId: req.params?.orderId ?? null,
      error: err,
    });

    res.status(err.status || 500).json({
      message: err.status ? err.message : 'Internal server error',
    });
  }
}

// -----------------------------------------------
// GET /api/invoices/revenue?start=YYYY-MM-DD&end=YYYY-MM-DD
// -----------------------------------------------
export async function getRevenueProfit(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const totals = await modelGetRevenueProfitBetweenDates(start, end);

    logger.info('Revenue & profit calculated', {
      start,
      end,
    });

    res.json({
      revenue: Number(totals.total_revenue || 0),
      cost: Number(totals.total_cost || 0),
      profit: Number(totals.total_profit || 0),
    });
  } catch (err) {
    logger.error('Error calculating revenue & profit', {
      query: req.query ?? null,
      error: err,
    });

    res.status(500).json('Internal Server Error');
  }
}

// -----------------------------------------------
// GET /api/invoices/chart?start=YYYY-MM-DD&end=YYYY-MM-DD
// -----------------------------------------------
export async function getRevenueProfitChartController(req, res) {
  try {
    const { start, end } = parseDateRange(req.query);
    const rows = await modelGetRevenueProfitChart(start, end);

    logger.info('Revenue/profit chart data fetched', {
      start,
      end,
      days: rows.length,
    });

    const chartData = rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue || 0),
      cost: Number(r.cost || 0),
      profit: Number(r.profit || 0),
    }));

    res.json(chartData);
  } catch (err) {
    logger.error('Error fetching revenue/profit chart data', {
      query: req.query ?? null,
      error: err,
    });

    res.status(err.status || 500).json({
      message: err.status ? err.message : 'Internal server error',
    });
  }
}

// -----------------------------------------------
// GET /api/invoices/:orderId/json
// -----------------------------------------------
export async function getInvoiceJson(req, res) {
  try {
    const orderId = parseInt(req.params.orderId, 10);

    if (!orderId) {
      logger.warn('Get invoice JSON failed: invalid orderId', {
        orderId: req.params.orderId,
      });

      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const invoice = await modelGetInvoiceById(orderId);

    if (!invoice) {
      logger.warn('Get invoice JSON failed: invoice not found', {
        orderId,
      });

      return res.status(404).json({ message: 'Invoice/order not found' });
    }

    // Get line items
    const items = await modelGetInvoiceItems(orderId);

    logger.info('Invoice JSON fetched', {
      orderId,
      itemCount: items.length,
    });

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
    logger.error('Error fetching invoice JSON', {
      orderId: req.params?.orderId ?? null,
      error: err,
    });

    res.status(500).json({ message: 'Failed to load invoice' });
  }
}
