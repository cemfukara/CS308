// backend/routes/orderRoutes.js
// Defines routes for order handling (/api/orders, /api/orders/:id).

import express from 'express';
import {
  getOrders,
  getOrderDetails,
  updateOrderStatusController,
} from '../app/controllers/orderController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get orders:
 *          - customer → own orders
 *          - PM/dev/sales manager → all non-cart orders (deliveries)
 * @access  Private
 */
router.get('/', authenticate, getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details (items inside)
 * @access  Private
 */
router.get('/:id', authenticate, getOrderDetails);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (processing, in-transit, delivered, cancelled)
 * @access  Private
 */
router.put('/:id/status', authenticate, updateOrderStatusController);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel an order (future implementation)
 * @access  Private
 */
router.delete('/:id', authenticate, (req, res) => {
  res.status(501).json({ message: 'Cancel order not implemented yet' });
});

export default router;
