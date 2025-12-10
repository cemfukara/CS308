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
} from '../../models/Review.js';

// =====================================================================
// POST /api/reviews
// User creates a review (goes to pending approval)
// =====================================================================
export async function createReview(req, res) {
  try {
    const user_id = req.user.user_id;
    const { product_id, rating, comment_text } = req.body;

    if (!product_id || !rating || !comment_text) {
      return res.status(400).json({
        message: 'product_id, rating, and comment_text are required',
      });
    }

    if (isNaN(product_id)) {
      return res.status(400).json({ message: 'product_id must be a number' });
    }

    if (isNaN(rating)) {
      return res.status(400).json({ message: 'Review must be an integer' });
    }

    if (rating > 5 || rating < 0) {
      return res
        .status(400)
        .json({ message: 'Invalid rating value (0 <= rating <= 5)' });
    }

    // ------------------------------------------------------------
    // Check if user bought the product
    // ------------------------------------------------------------
    const hasPurchased = await userPurchasedProductModel(user_id, product_id);

    if (
      !(
        process.env.AUTH_DISABLED === 'true' &&
        process.env.NODE_ENV == 'development' &&
        req.user.role == 'dev'
      ) &&
      !hasPurchased
      // dev role excluded
    ) {
      return res.status(403).json({
        message: 'You can only review products you have purchased.',
      });
    }

    await createReviewModel({
      user_id,
      product_id,
      rating,
      comment_text,
    });

    res.json({
      message: 'Review submitted and is pending approval.',
    });
  } catch (err) {
    if (err.message.includes('uq_user_product_review')) {
      return res.status(400).json({
        message: 'You have already reviewed this product.',
      });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
