import { db } from '../app/config/db.js';

// Helper for DB queries
async function query(sql, params = []) {
  const [rows] = await db.pool.query(sql, params);
  return rows;
}

export async function applyDiscount(productId, discountRate) {
  // Calculate new price inside SQL
  const sql = `
    UPDATE products
    SET discount_rate = ?,
        price = price - (price * (? / 100))
    WHERE product_id = ?
  `;
  await query(sql, [discountRate, discountRate, productId]);

  const updated = await query(`SELECT * FROM products WHERE product_id = ?`, [productId]);
  return updated[0];
}

// Users who have the discounted product in their wishlist
export async function getWishlistedUsers(productId) {
  const sql = `
    SELECT user_id
    FROM wishlist
    WHERE product_id = ?
  `;
  return query(sql, [productId]);
}

// Insert notifications
export async function notifyUsers(userIds, productId, discountRate) {
  if (userIds.length === 0) return;

  const sql = `
    INSERT INTO notifications (user_id, message, seen)
    VALUES ?
  `;

  const values = userIds.map(uid => [
    uid.user_id,
    `Product ID ${productId} is now ${discountRate}% off!`,
    0
  ]);

  await db.pool.query(sql, [values]);
}
