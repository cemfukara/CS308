// This file defines logic for handling orders

import {
  getOrCreateCart,
  getCartItems,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItemQuantity,
} from '../../models/Cart.js';

import logger from '../../utils/logger.js';

//------------------------------------------------------
// GET /cart  →  Get user's active cart + items
//------------------------------------------------------
export async function getCart(req, res) {
  try {
    const userId = req.user.user_id;

    // Find or create a cart (status = 'cart')
    const cart = await getOrCreateCart(userId);

    // Fetch cart items
    const items = await getCartItems(cart.order_id);

    logger.info('Cart fetched', {
      userId,
      orderId: cart.order_id,
      itemCount: items.length,
    });

    res.status(200).json({
      success: true,
      cart,
      items,
    });
  } catch (error) {
    logger.error('Error getting cart', {
      userId,
      error,
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

//------------------------------------------------------
// POST /cart/add  →  Add product to cart
//------------------------------------------------------
export async function addItemToCart(req, res) {
  try {
    const userId = req.user.user_id;
    const { productId, quantity } = req.body;

    if (!productId) {
      logger.warn('Add to cart failed: missing productId', { userId });
      return res
        .status(400)
        .json({ success: false, message: 'productId required' });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Add item to cart
    const result = await addToCart(cart.order_id, productId, quantity ?? 1);

    // Check if there was a stock error
    if (result && result.stockError) {
      logger.warn('Stock error while adding to cart', {
        userId,
        productId,
        availableStock: result.availableStock,
        currentCartQuantity: result.currentCartQuantity,
      });
      return res.status(400).json({
        success: false,
        message: result.error,
        stockError: true,
        availableStock: result.availableStock,
        currentCartQuantity: result.currentCartQuantity,
      });
    }

    logger.info('Item added to cart', {
      userId,
      productId,
      quantity: quantity ?? 1,
      orderId: cart.order_id,
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
    });
  } catch (error) {
    logger.error('Error adding item to cart', {
      userId,
      productId,
      error,
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

//------------------------------------------------------
// DELETE /cart/items/:productId → Remove a single item
//------------------------------------------------------
export async function deleteCartItem(req, res) {
  try {
    const user = req.user;
    const { productId } = req.params;

    if (!productId) {
      logger.warn('Delete cart item failed: missing productId', { userId });
      return res.status(400).json({
        success: false,
        message: 'productId required',
      });
    }

    const [result] = await removeFromCart(user.user_id, productId);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart',
      });
    }

    logger.info('Item removed from cart', {
      userId,
      productId,
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    logger.error('Error removing cart item', {
      userId,
      productId,
      error,
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

//------------------------------------------------------
// PATCH /cart/items/:productId  → Update item quantity
//------------------------------------------------------
export async function updateCartItem(req, res) {
  try {
    const userId = req.user.user_id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId || !quantity) {
      logger.warn('Update cart item failed: missing data', {
        userId,
        productId,
        quantity,
      });
      return res.status(400).json({
        success: false,
        message: 'productId and quantity required',
      });
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Update item quantity
    const result = await updateCartItemQuantity(
      cart.order_id,
      productId,
      quantity
    );

    // Check if there was a stock error
    if (result && result.stockError) {
      logger.warn('Stock error while updating cart item', {
        userId,
        productId,
        requestedQuantity: quantity,
        availableStock: result.availableStock,
      });
      return res.status(400).json({
        success: false,
        message: result.error,
        stockError: true,
        availableStock: result.availableStock,
      });
    }

    logger.info('Cart item updated', {
      userId,
      productId,
      quantity,
      orderId: cart.order_id,
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
    });
  } catch (error) {
    logger.error('Error updating cart item', {
      userId,
      productId,
      quantity,
      error,
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

//------------------------------------------------------
// DELETE /cart/clear  → Remove all items from current cart
//------------------------------------------------------
export async function clearUserCart(req, res) {
  try {
    const userId = req.user.user_id;

    const cart = await getOrCreateCart(userId);

    await clearCart(cart.order_id);

    logger.info('Cart cleared', {
      userId,
      orderId: cart.order_id,
    });

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    logger.error('Error clearing cart', {
      userId,
      error,
    });
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
