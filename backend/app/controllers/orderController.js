// backend/app/controllers/orderController.js
// Logic for handling orders (listing, details, status updates).

import {
  getUserOrders,
  getOrderItems,
  createOrder,
  getOrderById,
} from '../../models/Order.js';

// ==========================================================
// GET /api/orders
//  customers cart
// ==========================================================
export async function getOrders(req, res) {
  try {
    const userId = req.user.user_id; // JWT payload: { user_id, role, ... }

    // get orders
    const orders = await getUserOrders(userId);

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// GET /api/orders/:id
//  - returns items inside a specific order
// ==========================================================
export async function getOrderDetails(req, res) {
  try {
    const orderId = req.params.id;

    const [order, items] = await Promise.all([
      getOrderById(orderId),
      getOrderItems(orderId),
    ]);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      order,
      items,
    });
  } catch (err) {
    console.error('Error fetching order items:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// POST /api/orders
//  - Create new order from cart items
// ==========================================================
export async function createOrderController(req, res) {
  try {
    const userId = req.user.user_id;
    const { items, address, payment } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const normalizedItems = items.map((it) => ({
      product_id: it.product_id,
      quantity: it.quantity || 1,
      price: Number(it.price) || 0,
    }));

    const totalPrice = normalizedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const { order_id } = await createOrder({
      userId,
      items: normalizedItems,
      shippingAddress: address,
      totalPrice,
    });

    res.status(201).json({
      success: true,
      order_id,
      total_price: totalPrice,
      payment: payment || null,
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
