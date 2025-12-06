// This file defines logic for handling orders

import {
  getOrCreateCart,
  getCartItems,
  addToCart,
  removeFromCart,
  clearCart,
} from '../../models/Cart.js';

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

    res.status(200).json({
      success: true,
      cart,
      items,
    });
  } catch (error) {
    console.error('Error getting cart:', error);
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

    if (!productId)
      return res
        .status(400)
        .json({ success: false, message: 'productId required' });

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Add item to cart
    await addToCart(cart.order_id, productId, quantity ?? 1);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
    });
  } catch (error) {
    console.error('Error adding item:', error);
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

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
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

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
