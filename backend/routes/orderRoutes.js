// backend/routes/orderRoutes.js
// Defines routes for order handling (/api/orders, /api/orders/:id).

import express from 'express';
import {
  getOrders,
  getOrderDetails,
  createOrderController,
  cancelOrderController,
  refundOrderController,
} from '../app/controllers/orderController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get orders customer's orders
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
 * @route   POST /api/orders
 * @desc    Create a new order from cart items
 * @access  Private
 */
router.post('/', authenticate, createOrderController);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order (only if status is 'processing')
 * @access  Private
 */
router.post('/:id/cancel', authenticate, cancelOrderController);

/**
 * @route   POST /api/orders/:id/refund
 * @desc    Refund an order (only if status is 'delivered')
 * @access  Private
 */
router.post('/:id/refund', authenticate, refundOrderController);

export default router;
