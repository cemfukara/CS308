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
    currency: row.currency || 'TL',
    exchange_rate: row.exchange_rate || 1.0,
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
        o.currency,
        o.exchange_rate,
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
               -- Spec: order_date is set when status changes from 'cart' to 'processing'
               WHEN status = 'cart' AND ? = 'processing'
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
        o.currency,
        o.exchange_rate,
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
        p.model,
        p.currency
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
        o.currency,
        o.exchange_rate,
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
  currency = 'TL',
  exchangeRate = 1.0,
}) {
  const encryptedAddress = shippingAddress ? encrypt(shippingAddress) : null;

  // 1) Try to reuse the latest 'cart' order for this user
  const [existingCartRows] = await db.query(
    `
      SELECT order_id
      FROM orders
      WHERE user_id = ?
        AND status = 'cart'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId]
  );

  let orderId;

  if (existingCartRows.length > 0) {
    // Reuse existing cart row → convert it to a real order
    orderId = existingCartRows[0].order_id;

    await db.query(
      `
        UPDATE orders
           SET status = 'processing',
               total_price = ?,
               currency = ?,
               exchange_rate = ?,
               shipping_address_encrypted = ?,
               order_date = CASE
                 WHEN order_date IS NULL THEN NOW()
                 ELSE order_date
               END
         WHERE order_id = ?
      `,
      [totalPrice, currency, exchangeRate, encryptedAddress, orderId]
    );

    // Optional safety: clear any old cart items for this order
    await db.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
  } else {
    // No cart row in DB → create a fresh processing order as fallback
    const [orderResult] = await db.query(
      `
        INSERT INTO orders (user_id, status, total_price, currency, exchange_rate, shipping_address_encrypted, order_date)
        VALUES (?, 'processing', ?, ?, ?, ?, NOW())
      `,
      [userId, totalPrice, currency, exchangeRate, encryptedAddress]
    );
    orderId = orderResult.insertId;
  }

  // 2) Validate stock for all items before processing
  if (items.length > 0) {
    // Fetch current stock for all products
    const productIds = items.map((it) => it.product_id);
    const [stockRows] = await db.query(
      `SELECT product_id, name, quantity_in_stock 
       FROM products 
       WHERE product_id IN (?)`,
      [productIds]
    );

    // Create a map for easy lookup
    const stockMap = {};
    for (const row of stockRows) {
      stockMap[row.product_id] = row;
    }

    // Validate each item
    const stockErrors = [];
    for (const it of items) {
      const product = stockMap[it.product_id];
      if (!product) {
        stockErrors.push(`Product ID ${it.product_id} not found`);
        continue;
      }

      const requestedQty = it.quantity || 1;
      if (requestedQty > product.quantity_in_stock) {
        stockErrors.push(
          `${product.name}: requested ${requestedQty}, but only ${product.quantity_in_stock} in stock`
        );
      }
    }

    // If any stock errors, throw to prevent order creation
    if (stockErrors.length > 0) {
      const error = new Error('Insufficient stock for one or more items');
      error.stockErrors = stockErrors;
      throw error;
    }

    // 3) Insert order_items
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

    // 4) Decrease stock for each product
    for (const it of items) {
      const qty = it.quantity || 1;

      await db.query(
        `
          UPDATE products
             SET quantity_in_stock = GREATEST(quantity_in_stock - ?, 0)
           WHERE product_id = ?
        `,
        [qty, it.product_id]
      );

      await db.query(
        `
          UPDATE products
             SET order_count = order_count + ?
           WHERE product_id = ?
        `,
        [qty, it.product_id]
      );
    }
  }

  return { order_id: orderId };
}

// --------------------------------------------------
// Cancel an order (only if status is 'processing')
// --------------------------------------------------
export async function cancelOrder(orderId, userId) {
  // 1) Get the order and verify it belongs to the user
  const [orderRows] = await db.query(
    `
      SELECT order_id, user_id, status
      FROM orders
      WHERE order_id = ?
        AND user_id = ?
    `,
    [orderId, userId]
  );

  if (orderRows.length === 0) {
    return { success: false, message: 'Order not found' };
  }

  const order = orderRows[0];

  // 2) Check if the order can be cancelled (must be in 'processing' status)
  if (order.status !== 'processing') {
    return {
      success: false,
      message: `Cannot cancel order. Order status is '${order.status}', but must be 'processing' to cancel.`,
    };
  }

  // 3) Get the order items to restore stock
  const [items] = await db.query(
    `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = ?
    `,
    [orderId]
  );

  // 4) Restore stock for each product
  for (const item of items) {
    // Increase quantity_in_stock
    await db.query(
      `
        UPDATE products
        SET quantity_in_stock = quantity_in_stock + ?
        WHERE product_id = ?
      `,
      [item.quantity, item.product_id]
    );

    // Decrease order_count
    await db.query(
      `
        UPDATE products
        SET order_count = GREATEST(order_count - ?, 0)
        WHERE product_id = ?
      `,
      [item.quantity, item.product_id]
    );
  }

  // 5) Update order status to 'cancelled'
  const [result] = await db.query(
    `
      UPDATE orders
      SET status = 'cancelled'
      WHERE order_id = ?
    `,
    [orderId]
  );

  if (result.affectedRows > 0) {
    return { success: true, message: 'Order cancelled successfully' };
  }

  return { success: false, message: 'Failed to cancel order' };
}

// --------------------------------------------------
// Refund an order (only if status is 'delivered')
// --------------------------------------------------
export async function refundOrder(orderId, userId) {
  // 1) Get the order and verify it belongs to the user
  const [orderRows] = await db.query(
    `
      SELECT order_id, user_id, status
      FROM orders
      WHERE order_id = ?
        AND user_id = ?
    `,
    [orderId, userId]
  );

  if (orderRows.length === 0) {
    return { success: false, message: 'Order not found' };
  }

  const order = orderRows[0];

  // 2) Check if the order can be refunded (must be in 'delivered' status)
  if (order.status !== 'delivered') {
    return {
      success: false,
      message: `Cannot refund order. Order status is '${order.status}', but must be 'delivered' to refund.`,
    };
  }

  // 3) Get the order items to restore stock
  const [items] = await db.query(
    `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = ?
    `,
    [orderId]
  );

  // 4) Restore stock for each product
  for (const item of items) {
    // Increase quantity_in_stock
    await db.query(
      `
        UPDATE products
        SET quantity_in_stock = quantity_in_stock + ?
        WHERE product_id = ?
      `,
      [item.quantity, item.product_id]
    );

    // Decrease order_count
    await db.query(
      `
        UPDATE products
        SET order_count = GREATEST(order_count - ?, 0)
        WHERE product_id = ?
      `,
      [item.quantity, item.product_id]
    );
  }

  // 5) Update order status to 'refunded'
  const [result] = await db.query(
    `
      UPDATE orders
      SET status = 'refunded'
      WHERE order_id = ?
    `,
    [orderId]
  );

  if (result.affectedRows > 0) {
    return { success: true, message: 'Order refunded successfully' };
  }

  return { success: false, message: 'Failed to refund order' };
}
