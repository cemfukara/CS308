// This file defines logic for handling orders (create order, get order history, etc.).
import {
    getUserOrders,
    getOrderItems,
    updateOrderStatus,
} from '../../models/order.js';

// ===================================================================
// GET all user orders (except carts)
// ===================================================================
export async function getOrders(req, res) {
    try {
        const userId = req.user.id; // assuming JWT middleware sets req.user
        const orders = await getUserOrders(userId);

        res.status(200).json({
            success: true,
            orders,
        });
    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ===================================================================
// GET items inside a specific order
// ===================================================================
export async function getOrderDetails(req, res) {
    try {
        const orderId = req.params.orderId;

        const items = await getOrderItems(orderId);

        res.status(200).json({
            success: true,
            orderId,
            items,
        });
    } catch (err) {
        console.error('Error fetching order items:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// ===================================================================
// CHECKOUT — change order status from 'cart' to new status
// ===================================================================
export async function checkoutOrder(req, res) {
    try {
        const orderId = req.params.orderId;
        const { status } = req.body; // e.g. "completed", "pending_payment" etc.

        if (!status) {
            return res
                .status(400)
                .json({ success: false, message: 'Missing status field' });
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
