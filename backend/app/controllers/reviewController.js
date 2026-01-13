// backend/app/controllers/reviewController.js
import {
  getProductReviews,
  getProductAverageRating,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getPendingComments,
  setReviewStatus,
  hasUserPurchasedProduct,
} from '../../models/Review.js';

import logger from '../../utils/logger.js';

// GET /api/reviews/product/:productId
export const getProductReviewsController = async (req, res) => {
  try {
    const { productId } = req.params;

    logger.info('Fetching product reviews', { productId });

    const reviews = await getProductReviews(productId);
    res.json({ reviews });
  } catch (err) {
    logger.error('Failed to fetch product reviews', {
      productId: req.params.productId,
      error: err,
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reviews/product/:productId/average
export const getProductAverageRatingController = async (req, res) => {
  try {
    const { productId } = req.params;

    logger.info('Fetching product average rating', { productId });

    const stats = await getProductAverageRating(productId);
    res.json(stats);
  } catch (err) {
    logger.error('Failed to fetch product average rating', {
      productId: req.params.productId,
      error: err,
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/reviews/user/:userId
// You can also use req.user.user_id if you only allow "me"
export const getUserReviewsController = async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('Fetching user reviews', { userId });

    const reviews = await getUserReviews(userId);
    res.json({ reviews });
  } catch (err) {
    logger.error('Failed to fetch user reviews', {
      userId: req.params.userId,
      error: err,
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/reviews/product/:productId
export const createReviewController = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { productId } = req.params;

    logger.info('Create review attempt', { userId, productId });

    if (isNaN(productId)) {
      logger.warn('Invalid productId in review creation', { productId });
      return res.status(400).json({ message: 'Invalid productId' });
    }

    if (!userId && userId != 0) {
      logger.warn('Unauthorized review creation attempt');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const canReview = await hasUserPurchasedProduct(userId, productId);
    if (!canReview) {
      logger.warn('Review blocked: product not purchased/delivered', {
        userId,
        productId,
      });
      return res.status(403).json({
        message:
          'You can only review products that have been delivered to you.',
      });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      logger.warn('Invalid rating value', {
        userId,
        productId,
        rating,
      });
      return res.status(400).json({ message: 'Rating must be 1–5.' });
    }

    const hasComment = comment_text && comment_text.trim().length > 0;
    const status = hasComment ? 'pending' : 'approved';

    const review = await createReview({
      userId,
      productId,
      rating,
      commentText: comment_text,
      status,
    });

    logger.info('Review created successfully', {
      userId,
      productId,
      reviewId: review.review_id,
      status,
    });

    let message = 'Review submitted successfully.';
    if (status === 'pending') {
      message =
        'Your rating is recorded. Your comment is pending approval by a moderator.';
    }

    res.status(201).json({ message, review });
  } catch (err) {
    logger.error('Failed to create review', {
      userId: req.user?.user_id,
      productId: req.params.productId,
      error: err,
    });

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

    logger.info('Update review attempt', { userId, reviewId });

    if (!userId && userId != 0) {
      logger.warn('Unauthorized review update attempt', { reviewId });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      logger.warn('Invalid rating during review update', {
        userId,
        reviewId,
        rating,
      });
      return res.status(400).json({ message: 'Rating must be 1–5.' });
    }

    const updated = await updateReview({
      reviewId,
      userId,
      rating,
      commentText: comment_text,
    });

    logger.info('Review updated successfully', {
      userId,
      reviewId,
    });

    res.json({ message: 'Review updated', review: updated });
  } catch (err) {
    logger.error('Failed to update review', {
      userId: req.user?.user_id,
      reviewId: req.params.reviewId,
      error: err,
    });

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

    logger.info('Delete review attempt', { userId, reviewId });

    if (!userId && userId != 0) {
      logger.warn('Unauthorized review deletion attempt', { reviewId });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await deleteReview({ reviewId, userId });

    logger.info('Review deleted successfully', {
      userId,
      reviewId,
    });

    res.json({ message: 'Review deleted', ...result });
  } catch (err) {
    logger.error('Failed to delete review', {
      userId: req.user?.user_id,
      reviewId: req.params.reviewId,
      error: err,
    });

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

// helper: ensure user is product manager
function assertProductManager(req, res) {
  const role = req.user?.role;
  const allowed = ['product manager', 'dev'];

  if (!allowed.includes(role)) {
    res
      .status(403)
      .json({ message: 'Only product managers or devs can manage comments.' });
    return false;
  }
  return true;
}

// GET /api/reviews/pending  (PM + DEV)
export const getPendingCommentsController = async (req, res) => {
  try {
    logger.info('Fetching pending review comments', {
      actor: req.user?.user_id,
      role: req.user?.role,
    });

    const comments = await getPendingComments();

    res.json({ comments });
  } catch (err) {
    logger.error('Failed to fetch pending comments', { error: err });
    res.status(500).json({ message: 'Failed to fetch pending comments' });
  }
};

// PATCH /api/reviews/:reviewId/approve  (PM + DEV)
export const approveReviewCommentController = async (req, res) => {
  try {
    const rawId = req.params.reviewId ?? req.params.review_id;
    const reviewId = Number(rawId);

    logger.info('Approve review comment requested', {
      reviewId,
      actor: req.user?.user_id,
    });

    if (!reviewId) {
      logger.warn('Invalid reviewId for approval', { rawId });
      return res.status(400).json({ message: 'Invalid review id' });
    }

    await setReviewStatus({ reviewId, status: 'approved' });

    logger.info('Review comment approved', { reviewId });

    res.json({ message: 'Review approved successfully' });
  } catch (err) {
    logger.error('Failed to approve review comment', {
      reviewId: req.params.reviewId,
      error: err,
    });
    res
      .status(500)
      .json({ message: err.message || 'Failed to approve review' });
  }
};

// PATCH /api/reviews/:reviewId/reject  (PM + DEV)
export const rejectReviewCommentController = async (req, res) => {
  try {
    const rawId = req.params.reviewId ?? req.params.review_id;
    const reviewId = Number(rawId);

    logger.info('Reject review comment requested', {
      reviewId,
      actor: req.user?.user_id,
    });

    if (!reviewId) {
      logger.warn('Invalid reviewId for rejection', { rawId });
      return res.status(400).json({ message: 'Invalid review id' });
    }

    await setReviewStatus({ reviewId, status: 'rejected' });

    logger.info('Review comment rejected', { reviewId });

    res.json({ message: 'Review rejected successfully' });
  } catch (err) {
    logger.error('Failed to reject review comment', {
      reviewId: req.params.reviewId,
      error: err,
    });
    res.status(500).json({ message: err.message || 'Failed to reject review' });
  }
};
