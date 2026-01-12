<<<<<<< HEAD
// backend/models/Refund.js
// Model for handling refund requests and processing

import { db } from '../app/config/db.js';

/**
 * Request a refund for an order item
 * @param {number} userId - User ID requesting the refund
 * @param {number} orderItemId - Order item ID to refund
 * @param {number} quantity - Quantity to refund
 * @param {string} reason - Reason for refund
 * @returns {Promise<Object>} Created refund record
 */
export async function requestRefund(userId, orderItemId, quantity, reason) {
  // 1) Get order item details and validate ownership
  const [itemRows] = await db.query(
    `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price_at_purchase,
        o.user_id,
        o.status,
        o.order_date
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE oi.order_item_id = ?
    `,
    [orderItemId]
  );

  if (itemRows.length === 0) {
    throw new Error('Order item not found');
  }

  const item = itemRows[0];

  // 2) Validate ownership
  if (item.user_id !== userId) {
    throw new Error('This order does not belong to you');
  }

  // 3) Validate order status is 'delivered'
  if (item.status !== 'delivered') {
    throw new Error(
      `Cannot request refund. Order status is '${item.status}', but must be 'delivered' to request a refund.`
    );
  }

  // 4) Validate 30-day return window
  const orderDate = new Date(item.order_date);
  const now = new Date();
  const daysSincePurchase = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

  if (daysSincePurchase > 30) {
    throw new Error(
      `Cannot request refund. This order was placed ${daysSincePurchase} days ago. Refunds must be requested within 30 days of purchase.`
    );
  }

  // 5) Validate quantity
  if (quantity <= 0 || quantity > item.quantity) {
    throw new Error(
      `Invalid quantity. You can refund between 1 and ${item.quantity} items.`
    );
  }

  // 6) Calculate refund amount (using price at purchase to honor discounts)
  const refundAmount = item.price_at_purchase * quantity;

  // 7) Insert refund request
  const [result] = await db.query(
    `
      INSERT INTO refunds (
        order_item_id,
        order_id,
        user_id,
        quantity,
        refund_amount,
        status,
        reason
      )
      VALUES (?, ?, ?, ?, ?, 'requested', ?)
    `,
    [orderItemId, item.order_id, userId, quantity, refundAmount, reason]
  );

  // 8) Return the created refund
  const [refundRows] = await db.query(
    `
      SELECT * FROM refunds WHERE refund_id = ?
    `,
    [result.insertId]
  );

  return refundRows[0];
}

/**
 * Get all pending refund requests
 * @returns {Promise<Array>} List of pending refunds with details
 */
export async function getPendingRefunds() {
  const [rows] = await db.query(
    `
      SELECT 
        r.refund_id,
        r.order_item_id,
        r.order_id,
        r.user_id,
        r.quantity,
        r.refund_amount,
        r.status,
        r.reason,
        r.requested_at,
        u.email AS customer_email,
        p.product_id,
        p.name AS product_name,
        p.model AS product_model,
        p.currency,
        oi.price_at_purchase,
        o.order_date
      FROM refunds r
      JOIN users u ON r.user_id = u.user_id
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON r.order_id = o.order_id
      WHERE r.status = 'requested'
      ORDER BY r.requested_at ASC
    `
  );

  return rows;
}

/**
 * Process a refund request (approve or reject)
 * @param {number} refundId - Refund ID to process
 * @param {string} decision - 'approved' or 'rejected'
 * @param {number} decidedBy - User ID of the sales manager making the decision
 * @returns {Promise<Object>} Updated refund record with customer details
 */
export async function processRefund(refundId, decision, decidedBy) {
  // 1) Validate decision
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error("Decision must be either 'approved' or 'rejected'");
  }

  // 2) Get refund details
  const [refundRows] = await db.query(
    `
      SELECT 
        r.*,
        oi.product_id,
        u.email AS customer_email,
        p.name AS product_name,
        p.model AS product_model,
        p.currency
      FROM refunds r
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN users u ON r.user_id = u.user_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE r.refund_id = ?
    `,
    [refundId]
  );

  if (refundRows.length === 0) {
    throw new Error('Refund request not found');
  }

  const refund = refundRows[0];

  // 3) Validate refund is still pending
  if (refund.status !== 'requested') {
    throw new Error(
      `This refund has already been processed with status: '${refund.status}'`
    );
  }

  // 4) Update refund status
  await db.query(
    `
      UPDATE refunds
      SET status = ?,
          decided_at = NOW(),
          decided_by = ?
      WHERE refund_id = ?
    `,
    [decision, decidedBy, refundId]
  );

  // 5) If approved, increment product stock
  if (decision === 'approved') {
    await db.query(
      `
        UPDATE products
        SET quantity_in_stock = quantity_in_stock + ?
        WHERE product_id = ?
      `,
      [refund.quantity, refund.product_id]
    );
  }

  // 6) Return updated refund with customer details for email notification
  return {
    refund_id: refund.refund_id,
    order_id: refund.order_id,
    customer_email: refund.customer_email,
    product_name: refund.product_name,
    product_model: refund.product_model,
    quantity: refund.quantity,
    refund_amount: refund.refund_amount,
    currency: refund.currency,
    decision,
  };
}

/**
 * Get refund requests for a specific user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} List of user's refund requests
 */
export async function getUserRefunds(userId) {
  const [rows] = await db.query(
    `
      SELECT 
        r.refund_id,
        r.order_item_id,
        r.order_id,
        r.quantity,
        r.refund_amount,
        r.status,
        r.reason,
        r.requested_at,
        r.decided_at,
        p.product_id,
        p.name AS product_name,
        p.model AS product_model,
        p.currency
      FROM refunds r
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE r.user_id = ?
      ORDER BY r.requested_at DESC
    `,
    [userId]
  );

  return rows;
}
=======
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
>>>>>>> a53fc339d42534d0784c53bda5f20306552af8f2
