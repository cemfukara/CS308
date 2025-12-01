// Wishlist related query models

import { db } from '../app/config/db.js';

// Get wishlist item IDs by user ID
export async function getWishlistByUserId(user_id) {
  const [rows] = await db.query(
    `SELECT product_id FROM wishlists WHERE user_id = ?`,
    [user_id]
  );
  return rows.map((row) => row.product_id);
}

// Insert product with product_id into user's wishlist by user_id
export async function addToWishlist(user_id, product_id) {
  const [result] = await db.query(
    `INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`,
    [user_id, product_id]
  );
  return result.insertId;
}

export async function deleteFromWishlist(user_id, product_id) {
  const [result] = await db.query(
    `DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`,
    [user_id, product_id]
  );
  // Return number of affected rows
  return result.affectedRows;
}

export async function clearWishlistByID(user_id) {
  const [result] = await db.query(`DELETE FROM wishlists WHERE user_id = ?`, [
    user_id,
  ]);

  // Number of deleted items
  return result.affectedRows;
}
