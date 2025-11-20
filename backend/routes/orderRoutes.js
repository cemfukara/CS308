// Defines routes for order handling (/api/orders, /api/orders/:id).
import express from 'express';
import {
    getOrders,
    getOrderDetails,
    checkoutOrder,
} from '../app/controllers/orderController.js';
import { authenticateToken } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/orders
 * @desc    Get all orders for logged-in user (except carts)
 * @access  Private
 */
router.get('/', authenticateToken, getOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID (items inside)
 * @access  Private
 */
router.get('/:id', getOrderDetails);

/**
 * @route   POST /api/orders
 * @desc    Checkout current cart → create order / update status
 * @access  Private
 */
router.post('/', checkoutOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (e.g., shipped, delivered)
 * @access  Private/Admin
 */
router.patch('/:id/status', checkoutOrder); // same controller can be used

/**
 * @route   DELETE /api/orders/:id
 * @desc    Cancel an order (future implementation)
 * @access  Private
 */
router.delete('/:id', (req, res) => {
    res.status(501).json({ message: 'Cancel order not implemented yet' });
});

export default router;
