// routes/cartRoutes.js
import express from 'express';
import {
    getCart,
    addItemToCart,
    deleteCartItem,
    clearUserCart,
} from '../controllers/cartController.js';

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get user's current cart
 * @access  Private
 */
router.get('/', getCart);

/**
 * @route   POST /api/cart/add
 * @desc    Add product to cart
 * @access  Private
 */
router.post('/add', addItemToCart);

/**
 * @route   PUT /api/cart/update
 * @desc    Update quantity of item in cart (optional future feature)
 * @access  Private
 */
router.put('/update', (req, res) => {
    res.status(501).json({
        message: 'Update cart quantity not implemented yet'
    });
});

/**
 * @route   DELETE /api/cart/remove/:orderItemId
 * @desc    Remove a single item from cart
 * @access  Private
 */
router.delete('/remove/:orderItemId', deleteCartItem);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/clear', clearUserCart);

export default router;
