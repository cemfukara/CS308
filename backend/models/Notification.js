import { db } from '../app/config/db.js';

export async function notifyWishlistUsers(productId, message) {
    // Get users who have this in wishlist
    const [users] = await db.pool.query(`
        SELECT user_id 
        FROM wishlists
        WHERE product_id = ?
    `, [productId]);

    if (users.length === 0) return 0;

    const values = users.map(u => [u.user_id, productId, message]);

    await db.pool.query(`
        INSERT INTO notifications (user_id, product_id, message)
        VALUES ?
    `, [values]);

    return users.length;
}