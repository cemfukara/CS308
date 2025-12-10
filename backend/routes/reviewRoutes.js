// review routes
import express from 'express';
import {
  getApprovedReviews,
  createReview,
  deleteReview,
  getUserReviews,
  getAverageRating,
  updateReviewController,
  deleteReviewController,
  getPendingCommentsController,
  approveReviewCommentController,
  rejectReviewCommentController,
} from '../app/controllers/reviewController.js';

import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();
const requireProductManager = (req, res, next) => {
  const role = req.user?.role;
  const allowed = ['product manager', 'dev'];

  if (!allowed.includes(role)) {
    return res
      .status(403)
      .json({ message: 'Only product managers or devs can manage comments.' });
  }

  next();
};

// Public: view reviews & average rating for product
router.get('/product/:productId', getProductReviewsController);
router.get('/product/:productId/average', getProductAverageRatingController);

// Public or protected: view reviews by user (you decide)
router.get('/user/:userId', getUserReviewsController);

// Protected: create/update/delete require login
router.post('/product/:productId', authenticate, createReviewController);
router.put('/:reviewId', authenticate, updateReviewController);
router.delete('/:reviewId', authenticate, deleteReviewController);

// PM-only: comment moderation
router.get(
  '/pending',
  authenticate,
  requireProductManager,
  getPendingCommentsController
);

router.patch(
  '/:reviewId/approve',
  authenticate,
  requireProductManager,
  approveReviewCommentController
);

router.patch(
  '/:reviewId/reject',
  authenticate,
  requireProductManager,
  rejectReviewCommentController
);

export default router;
