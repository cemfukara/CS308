import express from 'express';
import {
  getInvoicesByDateRange,
  generateInvoicePDF,
  getRevenueProfit,
  getRevenueProfitChartController
} from '../app/controllers/invoiceController.js';

const router = express.Router();

// View invoices in a date range
// GET /api/invoices/range?start=2025-01-01&end=2025-01-31
router.get('/range', getInvoicesByDateRange);

// Download single invoice as PDF
// GET /api/invoices/:orderId/pdf
router.get('/:orderId/pdf', generateInvoicePDF);

// Revenue / cost / profit aggregate
// GET /api/invoices/revenue?start=2025-01-01&end=2025-01-31
router.get('/revenue', getRevenueProfit);

// Daily chart data
// GET /api/invoices/chart?start=2025-01-01&end=2025-01-31
router.get('/chart', getRevenueProfitChartController);

export default router;
