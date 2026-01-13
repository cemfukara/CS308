// backend/routes/adminRoutes.js
// Defines manager/admin-specific routes (discounts, analytics, refunds, etc.)

import express from 'express';

// Authentication Import
import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

// Validation Import
import { validateProductInput } from '../app/middlewares/validationMiddleware.js';

// Product Controllers
import {
  setDiscount,
  setListPrice,
  addProduct,
  updateProductDetails,
  removeProduct,
} from '../app/controllers/productController.js';

// Order Controllers
import {
  getDeliveries,
  updateOrderStatusController,
} from '../app/controllers/orderController.js';

// Category Controllers
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reassignAndDeleteCategory,
} from '../app/controllers/categoryController.js';

// Invoice Controllers
import {
  getInvoicesByDateRange,
  generateInvoicePDF,
  getRevenueProfit,
  getRevenueProfitChartController,
} from '../app/controllers/invoiceController.js';

// Review Controllers
import {
  approveReviewCommentController as approveReview,
  getPendingCommentsController as getPendingReviews,
  deleteReviewController as deleteReviewPM,
} from '../app/controllers/reviewController.js';

// Refund Controllers
import {
  getRefundsQueue,
  approveRefund,
  rejectRefund,
} from '../app/controllers/refundController.js';

const router = express.Router();

/* ============================================================
   SALES MANAGER ROUTES
   ============================================================ */

// GET /analytics
/*router.get(
  '/analytics',
  authenticate,
  authorizeRoles('sales manager'),
  (req, res) => {
    res.json({
      message: 'Get sales analytics is not implemented yet',
    });
  }
);*/

// GET /invoices
/*router.get(
  '/invoices',
  authenticate,
  authorizeRoles('sales manager'),
  (req, res) => {
    res.json({ message: 'View invoices is not implemented yet' });
  }
);*/

// GET /invoices/:id/export
/*router.get(
  '/invoices/:id/export',
  authenticate,
  authorizeRoles('sales manager'),
  (req, res) => {
    res.json({ message: 'Export invoice is not implemented yet' });
  }
);*/

// PATCH /products/discount
router.patch(
  '/discount',
  authenticate,
  authorizeRoles('sales manager'),
  setDiscount
);

// GET /refunds/pending
router.get(
  '/refunds/pending',
  authenticate,
  authorizeRoles('sales manager'),
  getRefundsQueue
);

// PATCH /refunds/:id/approve
router.patch(
  '/refunds/:id/approve',
  authenticate,
  authorizeRoles('sales manager'),
  approveRefund
);

// PATCH /refunds/:id/reject
router.patch(
  '/refunds/:id/reject',
  authenticate,
  authorizeRoles('sales manager'),
  rejectRefund
);

// PUT /api/sales/set-list-price
router.put(
  '/sales/set-list-price',
  authenticate,
  authorizeRoles('sales manager'),
  setListPrice
);

/* ============================================================
   PRODUCT MANAGER ROUTES
   ============================================================ */

/* ---------- Delivery Management ---------- */

// GET /deliveries
router.get(
  '/deliveries',
  authenticate,
  authorizeRoles('product manager'),
  getDeliveries
);

// PATCH /deliveries/:id/status
router.patch(
  '/deliveries/:id/status',
  authenticate,
  authorizeRoles('product manager'),
  updateOrderStatusController
);

/* ---------- Product Management ---------- */

// PATCH /products/:id/comments/:commentId/approve
/*router.patch(
  '/products/:id/comments/:commentId/approve',
  authenticate,
  authorizeRoles('product manager'),
  (req, res) => {
    res.json({ message: 'Approve/reject comment not implemented yet' });
  }
);*/

// POST /products
router.post(
  '/products',
  authenticate,
  authorizeRoles('product manager'),
  validateProductInput,
  addProduct
);

// PUT /products/:id
router.put(
  '/products/:id',
  authenticate,
  authorizeRoles('product manager'),
  validateProductInput,
  updateProductDetails
);

// DELETE /products/:id
router.delete(
  '/products/:id',
  authenticate,
  authorizeRoles('product manager'),
  removeProduct
);

/* ---------- Category Management ---------- */

// PUT /categories/:id
router.put(
  '/categories/:id',
  authenticate,
  authorizeRoles('product manager'),
  updateCategory
);

// PUT /categories/:id/reassign
router.put(
  '/categories/:id/reassign',
  authenticate,
  authorizeRoles('product manager'),
  reassignAndDeleteCategory
);

// POST /categories
router.post(
  '/categories',
  authenticate,
  authorizeRoles('product manager'),
  createCategory
);

// DELETE /categories/:id
router.delete(
  '/categories/:id',
  authenticate,
  authorizeRoles('product manager'),
  deleteCategory
);

/* ----------- Review Management ----------- */

// GET api/reviews/pending
/*router.get(
  '/reviews/pending',
  authenticate,
  authorizeRoles('product manager'),
  getPendingReviews
);*/

// PATCH api/reviews/:review_id/approve
/*router.patch(
  '/reviews/:review_id/approve',
  authenticate,
  authorizeRoles('product manager'),
  approveReview
);*/

// DELETE api/admin/reviews/:review_id
/*router.delete(
  '/admin/reviews/:review_id',
  authenticate,
  authorizeRoles('product manager'),
  deleteReviewPM
);*/

/* ============================================================
   SUPPORT AGENT ROUTES
   ============================================================ */

// GET /support/chat/queue
router.get(
  '/support/chat/queue',
  authenticate,
  authorizeRoles('support agent'),
  (req, res) => {
    res.json({ message: 'Chat queue not implemented yet' });
  }
);

// GET /support/chat/:id/context
router.get(
  '/support/chat/:id/context',
  authenticate,
  authorizeRoles('support agent'),
  (req, res) => {
    res.json({ message: 'Chat context not implemented yet' });
  }
);

// POST /support/chat/:id/message
router.post(
  '/support/chat/:id/message',
  authenticate,
  authorizeRoles('support agent'),
  (req, res) => {
    res.json({ message: 'Send message not implemented yet' });
  }
);

// POST /support/chat/:id/attachment
router.post(
  '/support/chat/:id/attachment',
  authenticate,
  authorizeRoles('support agent'),
  (req, res) => {
    res.json({ message: 'Send attachment not implemented yet' });
  }
);

// PATCH /support/chat/:id/claim
router.patch(
  '/support/chat/:id/claim',
  authenticate,
  authorizeRoles('support agent'),
  (req, res) => {
    res.json({ message: 'Claim chat not implemented yet' });
  }
);

export default router;