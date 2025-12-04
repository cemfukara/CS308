const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoiceController');

// View invoices in date range
// Example: GET /api/invoices/range?start=2025-01-01&end=2025-01-31
router.get('/range', controller.getInvoicesByDateRange);

// Download/Print single invoice as PDF
// Example: GET /api/invoices/123/pdf
router.get('/:orderId/pdf', controller.generateInvoicePDF);

// Get revenue/cost/profit totals between dates
// Example: GET /api/invoices/revenue?start=2025-01-01&end=2025-01-31
router.get('/revenue', controller.getRevenueProfit);

// Get daily chart data between dates
// Example: GET /api/invoices/chart?start=2025-01-01&end=2025-01-31
router.get('/chart', controller.getRevenueProfitChart);

//Get pdf
//
router.get('/:orderId/pdf', invoiceController.getInvoicePdf);

module.exports = router;
