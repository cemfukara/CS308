// backend/models/discountModel.js
import { db } from '../app/config/db.js';

// Helper for DB queries
async function query(sql, params = []) {
  const [rows] = await db.pool.query(sql, params);
  return rows;
}

/**
 * Apply discount by updating only the price.
 * list_price stays the same, discount_ratio is auto-calculated.
 */
export async function applyDiscount(productId, discountPercent) {
  // Get original list_price to calculate new price
  const product = await query(
    `SELECT price, list_price FROM products WHERE product_id = ?`,
    [productId]
  );

  if (!product.length) {
    throw new Error("Product not found");
  }

  const { list_price } = product[0];

  if (!list_price || list_price <= 0) {
    throw new Error("list_price must be set before applying discount");
  }

  // Calculate discounted price
  const newPrice = list_price - (list_price * (discountPercent / 100));

  // Update product price
  const sql = `
    UPDATE products
    SET price = ?
    WHERE product_id = ?
  `;
  await query(sql, [newPrice, productId]);

  // Return updated product
  const updated = await query(`SELECT * FROM products WHERE product_id = ?`, [productId]);
  return updated[0];
}

/**
 * Get all users who have this product in their wishlist.
 */
export async function getWishlistedUsers(productId) {
  const sql = `SELECT user_id FROM wishlists WHERE product_id = ?`;
  return query(sql, [productId]);
}

/**
 * Insert notifications for all users.
 */
export async function notifyUsers(userIds, productId, discountPercent) {
  if (!userIds.length) return;

  const values = userIds.map(uid => [
    uid.user_id,
    productId,
    `The product you wishlisted just dropped to ${discountPercent}% off!`
  ]);

  const sql = `
    INSERT INTO notifications (user_id, product_id, message)
    VALUES ?
  `;

  await db.pool.query(sql, [values]);
}
