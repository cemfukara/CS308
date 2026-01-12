import { db } from '../app/config/db.js';

export async function createRefundRequest({
  order_item_id,
  order_id,
  user_id,
  quantity,
  refund_amount,
  reason,
}) {
  const [result] = await db.query(
    `
    INSERT INTO refunds 
    (order_item_id, order_id, user_id, quantity, refund_amount, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'requested')
    `,
    [order_item_id, order_id, user_id, quantity, refund_amount, reason]
  );
  return result.insertId;
}

export async function getRefundById(refundId) {
  const [rows] = await db.query(
    `SELECT * FROM refunds WHERE refund_id = ?`,
    [refundId]
  );
  return rows[0] || null;
}

export async function getPendingRefunds() {
  // Join with products and users to show details to Sales Manager
  const [rows] = await db.query(`
    SELECT 
      r.*,
      p.name AS product_name,
      u.email AS customer_email
    FROM refunds r
    JOIN order_items oi ON r.order_item_id = oi.order_item_id
    JOIN products p ON oi.product_id = p.product_id
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status = 'requested'
    ORDER BY r.requested_at ASC
  `);
  return rows;
}

export async function updateRefundStatus(refundId, status, decidedByUserId) {
  const [result] = await db.query(
    `
    UPDATE refunds 
    SET status = ?, decided_at = NOW(), decided_by = ?
    WHERE refund_id = ?
    `,
    [status, decidedByUserId, refundId]
  );
  return result.affectedRows > 0;
}

// Check if a refund already exists for this item to prevent duplicates
export async function getRefundByOrderItemId(orderItemId) {
  const [rows] = await db.query(
    `SELECT * FROM refunds WHERE order_item_id = ?`,
    [orderItemId]
  );
  return rows[0] || null;
}