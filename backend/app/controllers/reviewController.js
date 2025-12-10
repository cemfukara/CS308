// backend/app/controllers/reviewController.js
import {
  getProductReviews,
  getProductAverageRating,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../../models/Review.js';

// GET /api/reviews/product/:productId
export const getProductReviewsController = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await getProductReviews(productId);
    res.json({ reviews });
  } catch (err) {
    console.error('Error getting product reviews:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reviews/product/:productId/average
export const getProductAverageRatingController = async (req, res) => {
  try {
    const { productId } = req.params;
    const stats = await getProductAverageRating(productId);
    res.json(stats);
  } catch (err) {
    console.error('Error getting average rating:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reviews/user/:userId
// You can also use req.user.user_id if you only allow "me"
export const getUserReviewsController = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await getUserReviews(userId);
    res.json({ reviews });
  } catch (err) {
    console.error('Error getting user reviews:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/reviews/product/:productId
export const createReviewController = async (req, res) => {
  try {
    const { productId } = req.params;

    // assuming your auth middleware attaches user info to req.user
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1–5.' });
    }

    const review = await createReview({
      userId,
      productId,
      rating,
      commentText: comment_text,
    });

    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    console.error('Error creating review:', err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/reviews/:reviewId
export const updateReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1–5.' });
    }

    const updated = await updateReview({
      reviewId,
      userId,
      rating,
      commentText: comment_text,
    });

    res.json({ message: 'Review updated', review: updated });
  } catch (err) {
    console.error('Error updating review:', err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/reviews/:reviewId
export const deleteReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await deleteReview({ reviewId, userId });

    res.json({ message: 'Review deleted', ...result });
  } catch (err) {
    console.error('Error deleting review:', err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};
