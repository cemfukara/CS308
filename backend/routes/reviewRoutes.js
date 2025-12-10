// review routes

import express from 'express';
import {
  getApprovedReviews,
  createReview,
  deleteReview,
  getUserReviews,
  getAverageRating,
  updateReviewController,
} from '../app/controllers/reviewController.js';

import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

// ======================================================================
// PUBLIC ROUTE — Get all approved reviews for a product
// GET /api/products/:product_id/reviews
// ======================================================================
router.get('/products/:product_id/reviews', getApprovedReviews);

// ======================================================================
// PRIVATE ROUTE — Create a review
// POST /api/reviews
// ======================================================================
router.post('/reviews', authenticate, createReview);

// ======================================================================
// PRIVATE ROUTE — Delete user's own review
// DELETE /api/reviews/:review_id
// ======================================================================
router.delete('/reviews/:review_id', authenticate, deleteReview);

// ======================================================================
// PRIVATE ROUTE — Get logged-in user's reviews (approved + pending)
// GET /api/user/reviews
// ======================================================================
router.get('/user/reviews', authenticate, getUserReviews);

// GET /api/reviews/:product_id/average
router.get('/reviews/:product_id/average', getAverageRating);

// PUT /api/reviews/:reviewId
router.put('/reviews/:reviewId', authenticate, updateReviewController);
