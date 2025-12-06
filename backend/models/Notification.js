import { db } from '../app/config/db.js';

// Helper for DB queries
async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

/**
 * Insert notifications for all users.
 */
export async function notifyUsers(userIds, productId, discountPercent) {
  if (!userIds.length) return;

  const values = userIds.map((uid) => [
    uid.user_id,
    productId,
    `The product you wishlisted just dropped to ${discountPercent}% off!`,
  ]);

  const sql = `
    INSERT INTO notifications (user_id, product_id, message)
    VALUES ?
  `;

  await db.query(sql, [values]);
}
