import { db } from '../app/config/db.js'; // adjust path if different

// 1. Get all reviews for a product (uses stored procedure)
export const getProductReviews = async (productId) => {
  const [resultSets] = await db.query('CALL sp_GetProductReviews(?);', [
    productId,
  ]);

  // mysql2 + CALL returns [ [rows], ... ]
  const rows = Array.isArray(resultSets) ? resultSets : [];
  return rows;
};

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
  const rows = Array.isArray(resultSets) ? resultSets : [];
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
