// Review models
import { db } from '../app/config/db.js';

// ------------------------
// Insert or update a rating
// ------------------------
export async function createRatingModel({ user_id, product_id, rating }) {
  const sql = `
    INSERT INTO reviews (user_id, product_id, rating, comment_text, approved)
    VALUES (?, ?, ?, NULL, TRUE)
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      approved = TRUE
  `;
  await db.query(sql, [user_id, product_id, rating]);
}

// ------------------------
// Insert or update a review (rating + comment)
// ------------------------
export async function createReviewModel({
  user_id,
  product_id,
  rating,
  comment_text,
}) {
  const sql = `
    INSERT INTO reviews (user_id, product_id, rating, comment_text, approved)
    VALUES (?, ?, ?, ?, FALSE)
    ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      comment_text = VALUES(comment_text),
      approved = FALSE
  `;
  await db.query(sql, [user_id, product_id, rating, comment_text]);
}

// ---------------------------------------------------------------
// Check if user purchased product (status must be delivered)
// ---------------------------------------------------------------
export async function userPurchasedProductModel(user_id, product_id) {
  const sql = `
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.user_id = ?
      AND o.status = 'delivered'
      AND oi.product_id = ?
    LIMIT 1
  `;

  const [rows] = await db.execute(sql, [user_id, product_id]);
  return rows.length > 0; // true if purchased
}

// ---------------------------------------------------------------
// Get approved reviews for a product (Public)
// ---------------------------------------------------------------
export async function getApprovedReviewsModel(product_id) {
  // Another query if frontend does not like stored procedure
  /*const sql = `
    SELECT r.review_id, r.product_id, r.user_id, r.rating, r.comment_text, r.created_at, u.email
    FROM reviews r
    JOIN users u ON u.user_id = r.user_id
    WHERE r.product_id = ? AND r.approved = 1
    ORDER BY r.created_at DESC
  `;*/
  //const [rows] = await db.execute(sql, [product_id]);
  // return rows;

  //stored procedure
  const [rows] = await db.query('CALL sp_GetProductReviews(?)', [product_id]);
  return rows[0];
}

// ---------------------------------------------------------------
// Get pending reviews (for product managers)
// ---------------------------------------------------------------
export async function getPendingReviewsModel() {
  const sql = `
    SELECT r.review_id, r.product_id, r.user_id, r.rating, r.comment_text, r.created_at, u.email
    FROM reviews r
    JOIN users u ON u.user_id = r.user_id
    WHERE r.approved = 0
    ORDER BY r.created_at ASC
  `;
  const [rows] = await db.query(sql);

  return rows;
}

// ---------------------------------------------------------------
// Delete review (user can delete only own)
// ---------------------------------------------------------------
export async function deleteUserReviewModel(review_id, user_id) {
  const sql = `DELETE FROM reviews WHERE review_id = ? AND user_id = ?`;
  const [result] = await db.execute(sql, [review_id, user_id]);
  return result.affectedRows > 0;
}

export async function deleteReviewPMModel(review_id) {
  const sql = `DELETE FROM reviews WHERE review_id = ?`;
  const [result] = await db.execute(sql, [review_id]);
  return result.affectedRows > 0;
}

// ---------------------------------------------------------------
// Get all reviews created by a user (approved + pending)
// ---------------------------------------------------------------
export async function getReviewsByUserModel(user_id) {
  const [rows] = await db.query('CALL sp_GetUserReviews(?)', [user_id]);

  const formatted = rows[0].map(({ approved, ...rest }) => ({
    ...rest,
    status: approved ? 'approved' : 'pending approval',
  }));

  return formatted;
}

// ---------------------------------------------------------------
// Check if review belongs to user
// ---------------------------------------------------------------
export async function reviewBelongsToUserModel(review_id, user_id) {
  const sql = `SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?`;
  const [rows] = await db.execute(sql, [review_id, user_id]);
  return rows.length > 0;
}

// Get average rating
export async function getAverageRatingModel(product_id) {
  const [rows] = await db.query('CALL sp_GetProductAverageRating(?)', [
    product_id,
  ]);
  return rows[0];
}

// ---------------------------------------------------------------
// Approve review
// ---------------------------------------------------------------
export async function approveReviewModel(review_id) {
  const sql = `UPDATE reviews SET approved = 1 WHERE review_id = ?`;
  await db.execute(sql, [review_id]);
}

// 5. Update an existing review (only by its owner)
export const updateReview = async ({
  reviewId,
  userId,
  rating,
  commentText,
}) => {
  const [result] = await db.query(
    `
    UPDATE reviews
    SET rating = ?, comment_text = ?, approved = 0
    WHERE review_id = ? AND user_id = ?
    `,
    [rating, commentText || null, reviewId, userId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Review not found or not owned by user.');
    error.statusCode = 404;
    throw error;
  }

  return {
    review_id: reviewId,
    user_id: userId,
    rating,
    comment_text: commentText || null,
  };
};
