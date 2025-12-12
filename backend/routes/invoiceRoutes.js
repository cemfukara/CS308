import express from 'express';
import {
  getInvoicesByDateRange,
  generateInvoicePDF,
  getRevenueProfit,
  getRevenueProfitChartController,
  getInvoiceJson,
} from '../app/controllers/invoiceController.js';

import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

const router = express.Router();

// View invoices in a date range
// GET /api/invoice/range?start=2025-01-01&end=2025-01-31
router.get(
  '/range',
  authenticate,
  authorizeRoles('sales manager'),
  getInvoicesByDateRange
);

// Get single invoice as JSON (used by SMInvoices "View" modal)
// GET /api/invoice/:orderId/json
router.get(
  '/:orderId/json',
  authenticate,
  authorizeRoles('sales manager'),
  getInvoiceJson
);

// Download single invoice as PDF
// GET /api/invoice/:orderId/pdf
/* TODO This route does not check for any privileged role. Anyone with valid token can access any invoice
Possible fix: Only return user's orders if role is customer, return any order if role is a privileged role*/
router.get('/:orderId/pdf', authenticate, generateInvoicePDF);

// Revenue / cost / profit aggregate
// GET /api/invoice/revenue?start=2025-01-01&end=2025-01-31
router.get(
  '/revenue',
  authenticate,
  authorizeRoles('sales manager'),
  getRevenueProfit
);

// Daily chart data
// GET /api/invoice/chart?start=2025-01-01&end=2025-01-31
router.get(
  '/chart',
  authenticate,
  authorizeRoles('sales manager'),
  getRevenueProfitChartController
);

export default router;
