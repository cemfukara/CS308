// backend/app/controllers/orderController.js
// Logic for handling orders (listing, details, status updates).

import {
  getUserOrders,
  getOrderItems,
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../../models/Order.js';

// ==========================================================
// GET /api/orders
//  - Get orders for the logged-in customer
// ==========================================================
export async function getOrders(req, res) {
  try {
    const userId = req.user.user_id;

    const orders = await getUserOrders(userId);

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// GET /api/orders/:id
//  - Get the items inside a specific order
// ==========================================================
export async function getOrderDetails(req, res) {
  try {
    const user = req.user;
    const orderId = req.params.id;

    const [order, items] = await Promise.all([
      getOrderById(orderId, user.user_id),
      getOrderItems(orderId, user.user_id),
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      order,
      items,
    });
  } catch (err) {
    console.error('❌ Error fetching order items:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}

// ==========================================================
// POST /api/orders
//  - Create new order
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
    console.error('❌ Error creating order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

/*
---------------------------------------------------
--------------- Product Manager Controllers --------
---------------------------------------------------
*/

// ==========================================================
// GET /deliveries  (Product Manager)
// ==========================================================
export const getDeliveries = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.status(200).json({ orders });
  } catch (error) {
    console.error('❌ Error loading deliveries:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Allowed statuses
const ALLOWED_STATUS_SET = new Set([
  'processing',
  'in-transit',
  'delivered',
  'cancelled',
  'refunded'
]);

Object.freeze(ALLOWED_STATUS_SET);

// ==========================================================
// PATCH /deliveries/:id/status
// ==========================================================
export const updateOrderStatusController = async (req, res) => {
  try {
    const status = req.body.status?.toLowerCase();
    const order_id = parseInt(req.params.id);

    if (!ALLOWED_STATUS_SET.has(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (isNaN(order_id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const updated = await updateOrderStatus(order_id, status);

    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Delivery status updated' });
  } catch (err) {
    console.error('❌ Status update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};