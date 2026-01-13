import { db } from '../app/config/db.js';

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
