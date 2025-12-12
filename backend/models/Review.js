import { db } from '../app/config/db.js'; // adjust path if different

// 1. Get all reviews for a product (uses stored procedure)
export const getProductReviews = async (productId) => {
  const [resultSets] = await db.query('CALL sp_GetProductReviews(?);', [
    productId,
  ]);

  // to get rid of bottom sql info
  const rows = resultSets[0] || [];

  return rows;
};

// Check if user purchased product (status must be delivered)
export async function hasUserPurchasedProduct(user_id, product_id) {
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

// 2. Get average rating + review count for a product
export const getProductAverageRating = async (productId) => {
  const [resultSets] = await db.query('CALL sp_GetProductAverageRating(?);', [
    productId,
  ]);

  const rows = Array.isArray(resultSets) ? resultSets : [];
  return rows[0] || { average_rating: 0, review_count: 0 };
};

// 3. Get all reviews made by a specific user
export const getUserReviews = async (userId) => {
  const [resultSets] = await db.query('CALL sp_GetUserReviews(?);', [userId]);

  // to get rid of bottom sql info
  const rows = resultSets[0] || [];
  return rows;
};

// 4. Create a new review
export const createReview = async ({
  userId,
  productId,
  rating,
  commentText,
}) => {
  try {
    const [result] = await db.query(
      `
      INSERT INTO reviews (product_id, user_id, rating, comment_text)
      VALUES (?, ?, ?, ?)
      `,
      [productId, userId, rating, commentText || null]
    );

    return {
      review_id: result.insertId,
      product_id: productId,
      user_id: userId,
      rating,
      comment_text: commentText || null,
    };
  } catch (err) {
    // Handle "user can only review a product once" constraint
    if (err.code === 'ER_DUP_ENTRY') {
      const error = new Error('You have already reviewed this product.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

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
    SET rating = ?, comment_text = ?
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

// 6. Delete a review (only by its owner)
export const deleteReview = async ({ reviewId, userId }) => {
  const [result] = await db.query(
    `
    DELETE FROM reviews
    WHERE review_id = ? AND user_id = ?
    `,
    [reviewId, userId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Review not found or not owned by user.');
    error.statusCode = 404;
    throw error;
  }

  return { success: true };
};

// 7. Get all pending comments (for Product Manager moderation)
export const getPendingComments = async () => {
  const [rows] = await db.query(
    `
    SELECT
      r.review_id,
      r.product_id,
      p.name AS product_name,
      r.user_id,
      u.email AS user_email,
      r.rating,
      r.comment_text,
      r.created_at,
      r.status
    FROM reviews r
    JOIN products p ON r.product_id = p.product_id
    JOIN users u ON r.user_id = u.user_id
    WHERE
      r.comment_text IS NOT NULL
      AND r.status = 'pending'
    ORDER BY r.created_at DESC
    `
  );

  return rows || [];
};

// 8. Update comment status (approve / reject)
export const setReviewStatus = async ({ reviewId, status }) => {
  const allowed = ['pending', 'approved', 'rejected'];
  if (!allowed.includes(status)) {
    const err = new Error('Invalid review status');
    err.statusCode = 400;
    throw err;
  }

  // tiny safety: make sure reviewId is an integer
  const id = Number(reviewId);
  if (!id || Number.isNaN(id)) {
    const err = new Error('Invalid review id');
    err.statusCode = 400;
    throw err;
  }

  console.log('[setReviewStatus] updating review_id =', id, 'to', status);

  let query;
  let params;

  if (status === 'rejected') {
    // keep rating but remove comment text
    query = `
      UPDATE reviews
      SET
        status       = 'rejected',
        comment_text = NULL
      WHERE review_id = ?
    `;
    params = [id];
  } else {
    query = `
      UPDATE reviews
      SET status = ?
      WHERE review_id = ?
    `;
    params = [status, id];
  }

  const [result] = await db.query(query, params);

  console.log('[setReviewStatus] affectedRows =', result.affectedRows);

  if (!result || result.affectedRows === 0) {
    const error = new Error('Review not found');
    error.statusCode = 404;
    throw error;
  }

  return { success: true };
};
