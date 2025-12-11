// routes/cartRoutes.js
import express from 'express';
import {
  getCart,
  addItemToCart,
  deleteCartItem,
  clearUserCart,
} from '../app/controllers/cartController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's current cart
 * @access  Private
 */
router.get('/', authenticate, getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart
 * @access  Private
 */
router.post('/add', authenticate, addItemToCart);

/**
 * @route   PUT /api/cart/update
 * @desc    Update quantity of item in cart (optional future feature)
 * @access  Private
 */
router.put('/update', (req, res) => {
  res.status(501).json({
    message: 'Update cart quantity not implemented yet',
  });
});

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Remove a single item from cart
 * @access  Private
 */
// TODO decrease quantity instead of deleting whole product
router.delete('/remove/:productId', authenticate, deleteCartItem);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear all items from cart
 * @access  Private
 */
// TODO return proper response to deleting already deleted cart instead of returning true
router.delete('/clear', authenticate, clearUserCart);

export default router;
