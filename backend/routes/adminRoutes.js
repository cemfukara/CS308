// Defines manager/admin-specific routes (discounts, analytics, etc.).
// app/routes/adminRoutes.js

// ATTENTION, ROUTE URLS ARE NOT CORRECT. CHANGE THEM BEFORE IMPLEMENTATION

import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';
import {
  getDeliveries,
  updateOrderStatusController,
} from '../app/controllers/adminController.js';
import express from 'express';
import { setDiscount } from '../app/controllers/discountController.js';
import { router } from './discountRoutes.js';

const router = express.Router();

// Routes might have different roles allowed on different levels

/*---------------Sales Manager Routes--------------*/

// Set or update product price
// allow: ["sales_manager"]
router.patch('/sales-manager/products/:id/price', (req, res) => {
  res.json({
    message: 'Set/update product price route is not implemented yet',
  });
});

// Sales Manager: Apply discount to a product
// POST /api/discount/apply
router.post('/apply', authenticate, authorizeRoles("sales manager"), setDiscount);

// View invoices in a given date range
// allow: ["sales_manager"]
router.get('/sales-manager/invoices', (req, res) => {
  res.json({ message: 'View invoices route is not implemented yet' });
});

// Export invoice as PDF
// allow: ["sales_manager"]
router.get('/sales-manager/invoices/:id/export', (req, res) => {
  res.json({ message: 'Invoice export route is not implemented yet' });
});

// Calculate revenue and profit/loss
// allow: ["sales_manager"]
router.get('/sales-manager/analytics/revenue', (req, res) => {
  res.json({ message: 'Revenue calculation route is not implemented yet' });
});

// Approve or deny refund
/* allowance
  - sales_manager: full (decides approval)
  - product_manager: restricted (can only act AFTER approval to add stock back)
  - support_agent: readonly (can only view refund status through order history context)
*/
router.patch('/sales-manager/refunds/:id/approve', (req, res) => {
  res.json({ message: 'Approve refund route is not implemented yet' });
});

/*---------------Product Manager Routes--------------*/

// Update stock amount
// allow: ["product_manager"]
router.patch('/product-manager/products/:id/stock', (req, res) => {
  res.json({ message: 'Update stock route is not implemented yet' });
});

// GET /pm/deliveries
// View deliveries (order list)
// allow: ["product_manager" (Finished), "support_agent (partial_read)"]
router.get(
  '/pm/deliveries',
  authenticate,
  authorizeRoles('product manager'),
  getDeliveries
);

// PATCH /pm/deliveries/:id/status
// Update delivery status
// allow: ["product_manager"]
router.patch(
  '/pm/deliveries/:id/status',
  authenticate,
  authorizeRoles('product manager'),
  updateOrderStatusController
);

// PATCH /pm/comments/:id/approve
// Approve/disapprove user comments
// allow: ["product_manager"]
router.patch('/pm/comments/:id/approve', (req, res) => {
  res.json({ message: 'Approve comment route is not implemented yet' });
});

/*---------------Support Agent Routes--------------*/

// Fetch chat queue
// allow: ["support_agent"]
router.get('/support-agent/chat/queue', (req, res) => {
  res.json({ message: 'Chat queue route is not implemented yet' });
});

// Claim chat
// allow: ["support_agent"]
router.patch('/support-agent/chat/:id/claim', (req, res) => {
  res.json({ message: 'Claim chat route is not implemented yet' });
});

// Send a message
// allow: ["support_agent"]
router.post('/support-agent/chat/:id/message', (req, res) => {
  res.json({ message: 'Send chat message route is not implemented yet' });
});

// Send attachment
// allow: ["support_agent"]
router.post('/support-agent/chat/:id/attachment', (req, res) => {
  res.json({ message: 'Send attachment route is not implemented yet' });
});

// View customer context for support
// allow: ["support_agent"]
/*Support agent CANNOT view:
    - credit card numbers
    - full invoices
    - product cost
    - revenue/profit data
    - customer addresses (except shipping city-level metadata)*/
router.get('/support-agent/chat/:id/context', (req, res) => {
  res.json({ message: 'Customer context route is not implemented yet' });
});

export default router;
