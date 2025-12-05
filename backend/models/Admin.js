// all admin related models

import { db } from '../app/config/db.js';
import { decrypt } from '../utils/encrypter.js';

/*---------------Product Manager Models--------------*/
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
