<<<<<<< HEAD
// backend/routes/refundRoutes.js
// Routes for refund requests and processing

import express from 'express';
import {
  requestRefundController,
  getPendingRefundsController,
  processRefundController,
  getMyRefundsController,
} from '../app/controllers/refundController.js';
import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/refund/request
 * @desc    Customer requests a refund for an order item
 * @access  Private (Customer)
 */
router.post('/request', authenticate, requestRefundController);

/**
 * @route   GET /api/refund/pending
 * @desc    Get all pending refund requests
 * @access  Private (Sales Manager, Product Manager)
 */
router.get(
  '/pending',
  authenticate,
  authorizeRoles(['sales manager', 'product manager']),
  getPendingRefundsController
);

/**
 * @route   PUT /api/refund/process
 * @desc    Approve or reject a refund request
 * @access  Private (Sales Manager only)
 */
router.put(
  '/process',
  authenticate,
  authorizeRoles(['sales manager']),
  processRefundController
);

/**
 * @route   GET /api/refund/my-refunds
 * @desc    Get customer's own refund requests
 * @access  Private (Customer)
 */
router.get('/my-refunds', authenticate, getMyRefundsController);

export default router;
=======
import express from 'express';
import { authenticate } from '../app/middlewares/authMiddleware.js';
import { requestRefund } from '../app/controllers/refundController.js';

const router = express.Router();

// POST /api/refunds/request
router.post('/request', authenticate, requestRefund);

export default router;
>>>>>>> a53fc339d42534d0784c53bda5f20306552af8f2
