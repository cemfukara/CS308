// src/api/reviewApi.js
// uses the shared api helper (api.js)
import { api } from './api';

/**
 * Normalize MySQL stored-procedure results into a flat
 * array of review objects.
 *
 * Supports:
 *  - { reviews: [ [rows], OkPacket ] }
 *  - { reviews: [ row1, row2, ... ] }
 *  - [ [rows], OkPacket ]
 *  - [ row1, row2, ... ]
 */
function normalizeReviewList(data) {
  if (!data) return [];

  // Sometimes controller wraps as { reviews: ... }
  const raw = data.reviews ?? data;

  if (Array.isArray(raw)) {
    // Case: [ [rows], OkPacket ]
    if (Array.isArray(raw[0]) && raw[0].length > 0 && typeof raw[0][0] === 'object') {
      return raw[0];
    }

    // Case: [ row1, row2, ... ]
    if (!Array.isArray(raw[0])) {
      return raw;
    }
  }

  return [];
}

/**
 * Normalize rating stats from:
 *  - { average_rating, review_count }
 *  - [ { average_rating, review_count } ]
 *  - [ [ { average_rating, review_count } ], OkPacket ]
 */
function normalizeRatingStats(data) {
  if (!data) {
    return { average_rating: 0, review_count: 0 };
  }

  // Already in object form
  if (
    typeof data === 'object' &&
    !Array.isArray(data) &&
    ('average_rating' in data || 'review_count' in data)
  ) {
    return data;
  }

  // Array shapes
  if (Array.isArray(data)) {
    // [ [ { ... } ], OkPacket ]
    if (Array.isArray(data[0]) && data[0].length > 0 && typeof data[0][0] === 'object') {
      return data[0][0];
    }

    // [ { ... } ]
    if (data[0] && typeof data[0] === 'object') {
      return data[0];
    }
  }

  return { average_rating: 0, review_count: 0 };
}

// ===============================
//  PRODUCT REVIEWS
// ===============================

// GET all reviews for a product
export const fetchProductReviews = async productId => {
  const data = await api.get(`/reviews/product/${productId}`);
  return normalizeReviewList(data);
};

// GET average rating + review count for a product
export const fetchProductRatingStats = async productId => {
  const data = await api.get(`/reviews/product/${productId}/average`);
  const stats = normalizeRatingStats(data);

  return {
    average_rating: Number(stats.average_rating || 0),
    review_count: Number(stats.review_count || 0),
  };
};

// ===============================
//  USER REVIEWS
// ===============================

// GET all reviews made by a specific user
export const fetchUserReviews = async userId => {
  const data = await api.get(`/reviews/user/${userId}`);
  return normalizeReviewList(data);
};

// ===============================
//  MUTATIONS (create / update / delete)
// ===============================

// POST create a new review for a product (requires auth cookie)
export const createReview = async (productId, { rating, comment_text }) => {
  const payload = { rating, comment_text };
  const data = await api.post(`/reviews/product/${productId}`, payload);
  // backend: { message, review }
  return data.review;
};

// PUT update an existing review (owner only)
export const updateReview = async (reviewId, { rating, comment_text }) => {
  const payload = { rating, comment_text };
  const data = await api.put(`/reviews/${reviewId}`, payload);
  // backend: { message, review }
  return data.review;
};

// DELETE a review (owner only)
export const deleteReview = async reviewId => {
  // backend: { message, success }
  return api.del(`/reviews/${reviewId}`);
};

// Get all pending comments (PM dashboard)
export const fetchPendingComments = async () => {
  const data = await api.get('/reviews/pending');
  return data.comments || [];
};

// Approve a comment
export const approveComment = async reviewId => {
  return api.patch(`/reviews/${reviewId}/approve`, {});
};

// Reject a comment
export const rejectComment = async reviewId => {
  return api.patch(`/reviews/${reviewId}/reject`, {});
};
