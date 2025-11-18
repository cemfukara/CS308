// This Sequelize model defines the Order table schema (id, userId, total, status, etc.).

import { db } from '../app/config/db.js';

// Get all orders except carts
export async function getUserOrders(userId) {
    const [rows] = await db.query(
        `SELECT * FROM orders 
         WHERE user_id = ? AND status != 'cart'
         ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

// Get items inside a specific order
export async function getOrderItems(orderId) {
    const [rows] = await db.query(
        `SELECT oi.order_item_id, oi.quantity, oi.price_at_purchase,
                p.name, p.model
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
        [orderId]
    );
    return rows;
}

// Change order status (checkout)
export async function updateOrderStatus(orderId, newStatus) {
    return db.query(
        `UPDATE orders SET status = ?, order_date = NOW()
         WHERE order_id = ?`,
        [newStatus, orderId]
    );
}
