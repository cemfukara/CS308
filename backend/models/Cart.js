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
      p.quantity_in_stock,

      -- image
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

// --------------------------------------------
// Add product to cart
// --------------------------------------------
export async function addToCart(orderId, productId, quantity = 1) {
  // Fetch product info including stock
  const [[product]] = await db.query(
    `SELECT price, quantity_in_stock FROM products WHERE product_id = ?`,
    [productId]
  );

  if (!product) {
    return { error: 'Product not found', stockError: true };
  }

  // Check if item already exists in cart
  const [rows] = await db.query(
    `SELECT * FROM order_items
         WHERE order_id = ? AND product_id = ?`,
    [orderId, productId]
  );

  const currentCartQuantity = rows.length > 0 ? rows[0].quantity : 0;
  const newTotalQuantity = currentCartQuantity + quantity;

  // Validate stock
  if (newTotalQuantity > product.quantity_in_stock) {
    return {
      error: `Insufficient stock. Available: ${product.quantity_in_stock}, In cart: ${currentCartQuantity}`,
      stockError: true,
      availableStock: product.quantity_in_stock,
      currentCartQuantity: currentCartQuantity,
    };
  }

  if (rows.length > 0) {
    // Increase quantity
    return db.query(
      `UPDATE order_items 
             SET quantity = quantity + ?
             WHERE order_id = ? AND product_id = ?`,
      [quantity, orderId, productId]
    );
  }

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
export async function removeFromCart(userId, productId) {
  return db.query(
    `
    DELETE oi
    FROM order_items oi
    INNER JOIN orders o
      ON oi.order_id = o.order_id
    WHERE o.user_id = ?
      AND o.status = 'cart'
      AND oi.product_id = ?
    `,
    [userId, productId]
  );
}

// --------------------------------------------
// Clear cart (delete all items)
// --------------------------------------------
export async function clearCart(orderId) {
  return db.query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
}

// --------------------------------------------
// Update cart item quantity
// --------------------------------------------
export async function updateCartItemQuantity(orderId, productId, newQuantity) {
  // Validate newQuantity
  if (newQuantity < 1) {
    return { error: 'Quantity must be at least 1' };
  }

  // Fetch product info including stock
  const [[product]] = await db.query(
    `SELECT price, quantity_in_stock FROM products WHERE product_id = ?`,
    [productId]
  );

  if (!product) {
    return { error: 'Product not found', stockError: true };
  }

  // Validate stock
  if (newQuantity > product.quantity_in_stock) {
    return {
      error: `Insufficient stock. Available: ${product.quantity_in_stock}`,
      stockError: true,
      availableStock: product.quantity_in_stock,
    };
  }

  // Update the quantity directly
  return db.query(
    `UPDATE order_items 
     SET quantity = ?
     WHERE order_id = ? AND product_id = ?`,
    [newQuantity, orderId, productId]
  );
}

