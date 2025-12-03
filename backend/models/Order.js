// backend/models/Order.js
// Data access helpers for orders & order items.

import { db } from '../app/config/db.js';
import { decrypt, encrypt } from '../utils/encrypter.js';

// Helper to map a DB row into a safer JS object (decrypts shipping address)
function mapOrderRow(row) {
  return {
    order_id: row.order_id,
    user_id: row.user_id,
    status: row.status,
    total_price: row.total_price,
    created_at: row.created_at,
    order_date: row.order_date,
    customer_email: row.customer_email || null,
    item_count: row.item_count ?? null,
    shipping_address: row.shipping_address_encrypted
      ? decrypt(row.shipping_address_encrypted)
      : null,
  };
}

// ------------------------------------------------------
// Get all orders for ONE user (customer "My Orders" view)
// ------------------------------------------------------
export async function getUserOrders(userId) {
  const [rows] = await db.query(
    `
      SELECT
        o.order_id,
        o.user_id,
        o.status,
        o.total_price,
        o.shipping_address_encrypted,
        o.created_at,
        o.order_date,
        COUNT(oi.order_item_id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.user_id = ?
        AND o.status != 'cart'
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `,
    [userId]
  );

  return rows.map(mapOrderRow);
}

// ------------------------------------------------------
// Get ALL non-cart orders (for PM / dev / sales manager)
// ------------------------------------------------------
export async function getAllOrders() {
  const [rows] = await db.query(
    `
      SELECT
        o.order_id,
        o.user_id,
        o.status,
        o.total_price,
        o.shipping_address_encrypted,
        o.created_at,
        o.order_date,
        u.email AS customer_email,
        COUNT(oi.order_item_id) AS item_count
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.status != 'cart'
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `
  );

  return rows.map(mapOrderRow);
}

// ------------------------------------------------------
// Get items inside a specific order
// ------------------------------------------------------
export async function getOrderItems(orderId) {
  const [rows] = await db.query(
    `
      SELECT
        oi.order_item_id,
        oi.quantity,
        oi.price_at_purchase,
        p.product_id,
        p.name,
        p.model
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `,
    [orderId]
  );
  return rows;
}

// ------------------------------------------------------
// Change order status (processing, in-transit, delivered, cancelled)
// ------------------------------------------------------
export async function updateOrderStatus(orderId, newStatus) {
  return db.query(
    `
      UPDATE orders
         SET status = ?,
             order_date = CASE
               WHEN ? IN ('processing', 'in-transit', 'delivered')
               THEN NOW()
               ELSE order_date
             END
       WHERE order_id = ?
    `,
    [newStatus, newStatus, orderId]
  );
}

// ------------------------------------------------------
// Get a single order with metadata (for details page)
// ------------------------------------------------------
export async function getOrderById(orderId) {
  const [rows] = await db.query(
    `
      SELECT
        o.order_id,
        o.user_id,
        o.status,
        o.total_price,
        o.shipping_address_encrypted,
        o.created_at,
        o.order_date,
        u.email AS customer_email,
        NULL AS item_count
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      WHERE o.order_id = ?
    `,
    [orderId]
  );

  if (!rows.length) return null;
  return mapOrderRow(rows[0]);
}

// ------------------------------------------------------
// Create a new order + order_items (and update stock)
// ------------------------------------------------------
export async function createOrder({
  userId,
  items,
  shippingAddress,
  totalPrice,
}) {
  // items: [{ product_id, quantity, price }]
  const encryptedAddress = shippingAddress ? encrypt(shippingAddress) : null;

  // 1) Insert into orders
  const [orderResult] = await db.query(
    `
      INSERT INTO orders (user_id, status, total_price, shipping_address_encrypted, order_date)
      VALUES (?, 'processing', ?, ?, NOW())
    `,
    [userId, totalPrice, encryptedAddress]
  );

  const orderId = orderResult.insertId;

  // 2) Insert order_items if any
  if (items.length > 0) {
    const values = items.map((it) => [
      orderId,
      it.product_id,
      it.quantity || 1,
      it.price ?? 0,
    ]);

    await db.query(
      `
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES ?
      `,
      [values]
    );

    // 3) (Optional) Decrease stock for each product
    for (const it of items) {
      await db.query(
        `
          UPDATE products
             SET quantity_in_stock = GREATEST(quantity_in_stock - ?, 0)
           WHERE product_id = ?
        `,
        [it.quantity || 1, it.product_id]
      );
    }
  }

  return { order_id: orderId };
}
