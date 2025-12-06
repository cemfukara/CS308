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
 * @route   POST /api/cart/items
 * @desc    Add product to cart
 * @access  Private
 */
router.post('/items', authenticate, addItemToCart);

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Update quantity of item in cart (optional future feature)
 * @access  Private
 */
router.put('/items/:productId', (req, res) => {
  res.status(501).json({
    message: 'Update cart quantity not implemented yet',
  });
});

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Remove a single item from cart
 * @access  Private
 */
router.delete('/items/:productId', authenticate, deleteCartItem);

/**
 * @route   DELETE /api/cart//items
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/items', authenticate, clearUserCart);

export default router;
