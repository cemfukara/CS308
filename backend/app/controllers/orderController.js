// backend/app/controllers/orderController.js
// Logic for handling orders (listing, details, status updates).

import {
  getUserOrders,
  getAllOrders,
  getOrderItems,
  updateOrderStatus,
} from '../../models/Order.js';

const MANAGER_ROLES = ['product manager', 'dev', 'sales manager'];

// ==========================================================
// GET /api/orders
//  - customer → only their orders
//  - PM / dev / sales manager → ALL non-cart orders
// ==========================================================
export async function getOrders(req, res) {
  try {
    const userId = req.user.user_id; // JWT payload: { user_id, role, ... }
    const role = req.user.role;

    const isManager = MANAGER_ROLES.includes(role);

    const orders = isManager
      ? await getAllOrders()
      : await getUserOrders(userId);

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

    const items = await getOrderItems(orderId);

    res.status(200).json({
      success: true,
      order_id: orderId,
      items,
    });
  } catch (err) {
    console.error('Error fetching order items:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// ==========================================================
// PUT /api/orders/:id/status
//  - update order status (processing, in-transit, delivered, cancelled)
// ==========================================================
export async function updateOrderStatusController(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowed = ['processing', 'in-transit', 'delivered', 'cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing status field',
      });
    }

    await updateOrderStatus(orderId, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
