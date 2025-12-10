// review controller
import {
  createReviewModel,
  getApprovedReviewsModel,
  getPendingReviewsModel,
  approveReviewModel,
  deleteUserReviewModel,
  getReviewsByUserModel,
  deleteReviewPMModel,
  reviewBelongsToUserModel,
  userPurchasedProductModel,
  getAverageRatingModel,
  updateReview,
  createRatingModel,
} from '../../models/Review.js';

// ------------------------
// POST /api/ratings
// ------------------------
export async function createRating(req, res) {
  try {
    const user_id = req.user.user_id;
    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !user_id
    )
      return res.status(401).json({ message: 'Unauthorized' }); //failsafe

    const { product_id, rating } = req.body;
    if (product_id === undefined || rating === undefined)
      return res
        .status(400)
        .json({ message: 'product_id and rating are required' });

    if (isNaN(product_id))
      return res.status(400).json({ message: 'product_id must be a number' });
    if (!Number.isInteger(Number(rating)))
      return res.status(400).json({ message: 'Rating must be an integer' });

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5)
      return res.status(400).json({ message: 'Invalid rating value (1-5)' });

    const hasPurchased = await userPurchasedProductModel(user_id, product_id);
    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !hasPurchased
    )
      return res
        .status(403)
        .json({ message: 'You can only rate products you have purchased.' });

    await createRatingModel({ user_id, product_id, rating: numericRating });
    return res.status(200).json({ message: 'Rating submitted.' });
  } catch (err) {
    console.error('Error while creating rating: ', err);
    return res.status(500).json({ message: 'Server Error' });
  }
}

// ------------------------
// POST /api/reviews
// ------------------------
export async function createReview(req, res) {
  try {
    const user_id = req.user.user_id;
    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !user_id
    )
      return res.status(401).json({ message: 'Unauthorized' }); // failsafe

    const { product_id, rating, comment_text } = req.body;
    if (product_id === undefined || rating === undefined || !comment_text)
      return res
        .status(400)
        .json({ message: 'product_id, rating, and comment_text are required' });

    if (isNaN(product_id))
      return res.status(400).json({ message: 'product_id must be a number' });
    if (!Number.isInteger(Number(rating)))
      return res.status(400).json({ message: 'Rating must be an integer' });

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5)
      return res.status(400).json({ message: 'Invalid rating value (1-5)' });

    const hasPurchased = await userPurchasedProductModel(user_id, product_id);
    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !hasPurchased
    )
      return res
        .status(403)
        .json({ message: 'You can only review products you have purchased.' });

    await createReviewModel({
      user_id,
      product_id,
      rating: numericRating,
      comment_text,
    });
    return res
      .status(200)
      .json({ message: 'Review submitted and is pending approval.' });
  } catch (err) {
    if (err.message.includes('uq_user_product_review')) {
      return res
        .status(400)
        .json({ message: 'You have already reviewed this product.' });
    }
    console.error('Error while creating review: ', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Get average rating of a product
export async function getAverageRating(req, res) {
  try {
    const product_id = req.params.product_id;

    if (isNaN(product_id)) {
      return res.status(400).json({ message: 'product_id must be a number' });
    }

    const data = await getAverageRatingModel(product_id);

    return res.status(200).json({ average: data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// =====================================================================
// GET /api/products/:product_id/reviews
// Public: Get approved reviews for a product
// =====================================================================
export async function getApprovedReviews(req, res) {
  try {
    const product_id = req.params.product_id;

    if (isNaN(product_id)) {
      return res.status(400).json({ message: 'product_id must be a number' });
    }

    const data = await getApprovedReviewsModel(product_id);

    return res.json({ reviews: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// =====================================================================
// DELETE /api/reviews/:review_id
// User: Delete own review
// =====================================================================
export async function deleteReview(req, res) {
  try {
    const review_id = req.params.review_id;
    const user_id = req.user.user_id;

    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !user_id
    ) {
      // Failsafe
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (isNaN(review_id)) {
      return res.status(400).json({ message: 'review_id must be a number' });
    }

    const belongs = await reviewBelongsToUserModel(review_id, user_id);
    if (!belongs) {
      return res.status(403).json({
        message: 'You cannot delete a review you did not write.',
      });
    }

    const deleted = await deleteUserReviewModel(review_id, user_id);
    if (!deleted) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    res.json({
      message: 'Review deleted successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// =====================================================================
// GET /api/user/reviews
// User: Get own reviews (approved + pending)
// =====================================================================
export async function getUserReviews(req, res) {
  try {
    const user_id = req.user.user_id;

    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !user_id
    ) {
      // Failsafe
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = await getReviewsByUserModel(user_id);

    res.json({
      reviews: data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/*--------PM Controllers -------*/

// =====================================================================
// GET /api/admin/reviews/pending
// Product Manager: List pending reviews
// =====================================================================
export async function getPendingReviews(req, res) {
  try {
    const rows = await getPendingReviewsModel();
    res.json({ pending: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// =====================================================================
// PATCH /api/admin/reviews/:review_id/approve
// Product Manager: Approve a review
// =====================================================================
export async function approveReview(req, res) {
  try {
    const review_id = req.params.review_id;

    if (isNaN(review_id)) {
      return res.status(400).json({ message: 'review_id must be a number' });
    }

    await approveReviewModel(review_id);

    res.json({
      message: 'Review approved successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// =====================================================================
// DELETE /api/admin/reviews/:review_id
// PM: Delete any review
// =====================================================================
export async function deleteReviewPM(req, res) {
  try {
    const review_id = req.params.review_id;

    if (isNaN(review_id)) {
      return res.status(400).json({ message: 'review_id must be a number' });
    }

    const deleted = await deleteReviewPMModel(review_id);
    if (!deleted) {
      return res.status(404).json({
        message: 'Review not found.',
      });
    }

    res.json({
      message: 'Review deleted successfully.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/reviews/:reviewId
export const updateReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.user_id;

    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV === 'development' &&
        req.user.role === 'dev'
      ) &&
      !userId
    ) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { rating, comment_text } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: 'Invalid rating value (0 <= rating <= 5)' });
    }

    const updated = await updateReview({
      reviewId,
      userId,
      rating,
      commentText: comment_text,
    });

    res.json({ message: 'Review updated, pending approval', review: updated });
  } catch (err) {
    console.error('Error updating review:', err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};
