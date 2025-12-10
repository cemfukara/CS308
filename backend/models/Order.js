// backend/app/models/Order.js

import { db } from '../app/config/db.js';
import { decrypt, encrypt } from '../utils/encrypter.js';

// --------------------------------------------------
// Helper mapping function (decrypts shipping address)
// --------------------------------------------------
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

// --------------------------------------------------
// Get ALL non-cart orders (PM view) WITH products & quantities
// --------------------------------------------------
export async function getAllOrders() {
  // 1) Fetch all orders
  const [orders] = await db.query(
    `
      SELECT
        o.order_id,
        o.user_id,
        o.status,
        o.total_price,
        o.shipping_address_encrypted,
        o.created_at,
        o.order_date,
        u.email AS customer_email
      FROM orders o
      JOIN users u ON u.user_id = o.user_id
      WHERE o.status != 'cart'
      ORDER BY o.created_at DESC
    `
  );

  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.order_id);

  // 2) Fetch all items for these orders
  const [items] = await db.query(
    `
      SELECT
        oi.order_id,
        oi.product_id,
        p.name AS product_name,
        oi.quantity
      FROM order_items oi
      JOIN products p ON p.product_id = oi.product_id
      WHERE oi.order_id IN ( ${orderIds.map(() => '?').join(',')} )
    `,
    orderIds
  );

  // 3) Group by order_id
  const itemsByOrder = {};
  for (const it of items) {
    if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
    itemsByOrder[it.order_id].push({
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
    });
  }

  // 4) Final merged result
  return orders.map((order) => ({
    order_id: order.order_id,
    user_id: order.user_id,
    status: order.status,
    total_price: order.total_price,
    created_at: order.created_at,
    order_date: order.order_date,
    customer_email: order.customer_email,

    // decrypt() is your existing function — keep it
    shipping_address: decrypt(order.shipping_address_encrypted),

    products: itemsByOrder[order.order_id] || [],
  }));
}

// --------------------------------------------------
// Change order status (MAIN FIX HERE)
// --------------------------------------------------
export async function updateOrderStatus(orderId, newStatus) {
  // MUST WAIT for DB response — earlier version forgot "await"
  const [result] = await db.query(
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

  // result.affectedRows is the only truth
  return result.affectedRows > 0;
}

// --------------------------------------------------
// Get user orders (customer side)
// --------------------------------------------------
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

// --------------------------------------------------
// Get items inside an order
// --------------------------------------------------
export async function getOrderItems(orderId, userId) {
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
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.order_id = ?
        AND o.user_id = ?
    `,
    [orderId, userId]
  );

  return rows;
}

// --------------------------------------------------
// Get single order by ID
// --------------------------------------------------
export async function getOrderById(orderId, userId) {
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
        AND o.user_id = ?
    `,
    [orderId, userId]
  );

  if (!rows.length) return null;
  return mapOrderRow(rows[0]);
}

// --------------------------------------------------
// Create new order
// --------------------------------------------------
export async function createOrder({
  userId,
  items,
  shippingAddress,
  totalPrice,
}) {
  const encryptedAddress = shippingAddress ? encrypt(shippingAddress) : null;

  const [orderResult] = await db.query(
    `
      INSERT INTO orders (user_id, status, total_price, shipping_address_encrypted, order_date)
      VALUES (?, 'processing', ?, ?, NOW())
    `,
    [userId, totalPrice, encryptedAddress]
  );

  const orderId = orderResult.insertId;

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
  }

  return { order_id: orderId };
}
