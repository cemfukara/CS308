// This Sequelize model defines the Cart table schema, mapping users to products in their carts.

import { db } from '../app/config/db.js';

// --------------------------------------------
// Get or create active cart for user
// --------------------------------------------
export async function getOrCreateCart(userId) {
    // Try to find existing cart
    const [rows] = await db.query(
        `SELECT * FROM orders 
         WHERE user_id = ? AND status = 'cart'`,
        [userId]
    );

    if (rows.length > 0) return rows[0];

    // Otherwise create new
    const [result] = await db.query(
        `INSERT INTO orders (user_id, status) 
         VALUES (?, 'cart')`,
        [userId]
    );

    return { order_id: result.insertId, user_id: userId, status: 'cart' };
}

// --------------------------------------------
// Get items inside cart
// --------------------------------------------
export async function getCartItems(orderId) {
    const [rows] = await db.query(
        `SELECT oi.order_item_id, oi.quantity, oi.price_at_purchase,
                p.name, p.model, p.price
         FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
         WHERE oi.order_id = ?`,
        [orderId]
    );
    return rows;
}

// --------------------------------------------
// Add product to cart
// --------------------------------------------
export async function addToCart(orderId, productId, quantity = 1) {
    // Check if item already exists
    const [rows] = await db.query(
        `SELECT * FROM order_items
         WHERE order_id = ? AND product_id = ?`,
        [orderId, productId]
    );

    if (rows.length > 0) {
        // Increase quantity
        return db.query(
            `UPDATE order_items 
             SET quantity = quantity + ?
             WHERE order_id = ? AND product_id = ?`,
            [quantity, orderId, productId]
        );
    }

    // Fetch current price for price_at_purchase
    const [[product]] = await db.query(
        `SELECT price FROM products WHERE product_id = ?`,
        [productId]
    );

    // Insert new row
    return db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES (?, ?, ?, ?)`,
        [orderId, productId, quantity, product.price]
    );
}

// --------------------------------------------
// Remove item from cart
// --------------------------------------------
export async function removeFromCart(orderItemId) {
    return db.query(
        `DELETE FROM order_items WHERE order_item_id = ?`,
        [orderItemId]
    );
}

// --------------------------------------------
// Clear cart (delete all items)
// --------------------------------------------
export async function clearCart(orderId) {
    return db.query(
        `DELETE FROM order_items WHERE order_id = ?`,
        [orderId]
    );
}
