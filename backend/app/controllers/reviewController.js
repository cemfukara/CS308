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
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. CONSTRAINT CHECK: Delivery Verification
    // "Products must be delivered before a user can rate and comment."
    const canReview = await hasUserPurchasedProduct(userId, productId);
    if (!canReview) {
      return res.status(403).json({
        message: 'You can only review products that have been delivered to you.',
      });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1–5.' });
    }

    // 2. CONSTRAINT CHECK: Status Logic
    // "Comments should be approved... Ratings submitted directly."
    // If there is a comment -> Pending (wait for PM).
    // If NO comment (rating only) -> Approved (visible immediately).
    const hasComment = comment_text && comment_text.trim().length > 0;
    const status = hasComment ? 'pending' : 'approved';

    const review = await createReview({
      userId,
      productId,
      rating,
      commentText: comment_text,
      status,
    });

    // Inform user of status
    let message = 'Review submitted successfully.';
    if (status === 'pending') {
      message =
        'Your rating is recorded. Your comment is pending approval by a moderator.';
    }

    res.status(201).json({ message, review });
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
    const comments = await getPendingComments();
    res.json({ comments });
  } catch (err) {
    console.error('Error fetching pending comments:', err);
    res.status(500).json({ message: 'Failed to fetch pending comments' });
  }
};

// PATCH /api/reviews/:reviewId/approve  (PM + DEV)
export const approveReviewCommentController = async (req, res) => {
  try {
    // accept both /:reviewId and /:review_id
    const rawId = req.params.reviewId ?? req.params.review_id;
    console.log('Approve request for reviewId =', rawId);

    const reviewId = Number(rawId);
    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    await setReviewStatus({ reviewId, status: 'approved' });
    res.json({ message: 'Review approved successfully' });
  } catch (err) {
    console.error('Error approving review comment:', err);
    res
      .status(500)
      .json({ message: err.message || 'Failed to approve review' });
  }
};

// PATCH /api/reviews/:reviewId/reject  (PM + DEV)
export const rejectReviewCommentController = async (req, res) => {
  try {
    const rawId = req.params.reviewId ?? req.params.review_id;
    console.log('Reject request for reviewId =', rawId);

    const reviewId = Number(rawId);
    if (!reviewId) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    await setReviewStatus({ reviewId, status: 'rejected' });
    res.json({ message: 'Review rejected successfully' });
  } catch (err) {
    console.error('Error rejecting review comment:', err);
    res.status(500).json({ message: err.message || 'Failed to reject review' });
  }
};
