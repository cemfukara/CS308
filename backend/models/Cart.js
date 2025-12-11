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

// --------------------------------------------------
// Get items inside cart (with product image)
// --------------------------------------------------
export async function getCartItems(orderId) {
  const [rows] = await db.query(
    `
    SELECT 
      oi.order_item_id,
      oi.quantity,
      oi.price_at_purchase,

      p.product_id,
      p.name,
      p.model,
      p.price,

      -- Best image
      (
        SELECT image_url
        FROM product_images 
        WHERE product_id = p.product_id
        ORDER BY is_primary DESC, display_order ASC, image_id ASC
        LIMIT 1
      ) AS image_url,

      (
        SELECT alt_text
        FROM product_images
        WHERE product_id = p.product_id
        ORDER BY is_primary DESC, display_order ASC, image_id ASC
        LIMIT 1
      ) AS alt_text

    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    WHERE oi.order_id = ?
    `,
    [orderId]
  );

  return rows;
}

// --------------------------------------------------
// Add product to cart (with stock management)
// --------------------------------------------------
export async function addToCart(orderId, productId, quantity = 1) {
  try {
    await db.beginTransaction();

    // Check if item exists
    const [[existingItem]] = await db.query(
      `SELECT quantity FROM order_items
       WHERE order_id = ? AND product_id = ?`,
      [orderId, productId]
    );

    // Lock product row for stock check (FOR UPDATE)
    const [[product]] = await db.query(
      `SELECT quantity_in_stock, price
       FROM products
       WHERE product_id = ? FOR UPDATE`,
      [productId]
    );

    if (!product) {
      await db.rollback();
      return { status: 404, message: 'Product not found' };
    }

    let requiredDecrease = quantity;

    if (existingItem) {
      // If item already exists, user wants to add +quantity more
      requiredDecrease = quantity;

      if (product.quantity_in_stock < requiredDecrease) {
        await db.rollback();
        return { status: 400, message: 'Not enough stock' };
      }

      await db.query(
        `UPDATE order_items
         SET quantity = quantity + ?
         WHERE order_id = ? AND product_id = ?`,
        [quantity, orderId, productId]
      );
    } else {
      // New cart line
      if (product.quantity_in_stock < quantity) {
        await db.rollback();
        return { status: 400, message: 'Not enough stock' };
      }

      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES (?, ?, ?, ?)`,
        [orderId, productId, quantity, product.price]
      );
    }

    // Decrease stock
    await db.query(
      `UPDATE products
       SET quantity_in_stock = quantity_in_stock - ?
       WHERE product_id = ?`,
      [requiredDecrease, productId]
    );

    await db.commit();
    return { success: true };
  } catch (err) {
    await db.rollback();
    throw err;
  }
}

// --------------------------------------------------
// Remove item from cart (restore stock)
// --------------------------------------------------
export async function removeFromCart(userId, productId) {
  try {
    await db.beginTransaction();

    // Get cart item with quantity
    const [[item]] = await db.query(
      `SELECT oi.order_id, oi.quantity
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.order_id
       WHERE o.user_id = ?
         AND o.status = 'cart'
         AND oi.product_id = ?`,
      [userId, productId]
    );

    if (!item) {
      await db.rollback();
      return { status: 404, message: 'Item not found in cart' };
    }

    // Restore stock
    await db.query(
      `UPDATE products
       SET quantity_in_stock = quantity_in_stock + ?
       WHERE product_id = ?`,
      [item.quantity, productId]
    );

    // Remove cart row
    await db.query(
      `DELETE FROM order_items
       WHERE order_id = ? AND product_id = ?`,
      [item.order_id, productId]
    );

    await db.commit();
    return { success: true };
  } catch (err) {
    await db.rollback();
    throw err;
  }
}

// --------------------------------------------------
// Clear entire cart (restore stock)
// --------------------------------------------------
export async function clearCart(orderId) {
  try {
    await db.beginTransaction();

    // Get all cart items
    const [items] = await db.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    // Restore stock
    for (const item of items) {
      await db.query(
        `UPDATE products
         SET quantity_in_stock = quantity_in_stock + ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    // Delete all items
    await db.query(
      `DELETE FROM order_items
       WHERE order_id = ?`,
      [orderId]
    );

    await db.commit();
    return { success: true };
  } catch (err) {
    await db.rollback();
    throw err;
  }
}
