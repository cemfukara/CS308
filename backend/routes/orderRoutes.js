// backend/routes/orderRoutes.js
// Defines routes for order handling (/api/orders, /api/orders/:id).

import express from 'express';
import {
  getOrders,
  getOrderDetails,
  createOrderController,
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
 * @route   DELETE /api/orders/:id
 * @desc    Cancel an order (future implementation)
 * @access  Private
 */
router.delete('/:id', authenticate, (req, res) => {
  res.status(501).json({ message: 'Cancel order not implemented yet' });
});

/**
 * @route   POST /api/orders
 * @desc    Create a new order from cart items
 * @access  Private
 */
router.post('/', authenticate, createOrderController);

export default router;
