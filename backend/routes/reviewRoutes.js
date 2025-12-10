// backend/routes/reviewRoutes.js
import express from 'express';
import {
  getProductReviewsController,
  getProductAverageRatingController,
  getUserReviewsController,
  createReviewController,
  updateReviewController,
  deleteReviewController,
} from '../app/controllers/reviewController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js'; // adjust path

const router = express.Router();

// Public: view reviews & average rating for product
router.get('/product/:productId', getProductReviewsController);
router.get('/product/:productId/average', getProductAverageRatingController);

// Public or protected: view reviews by user (you decide)
router.get('/user/:userId', getUserReviewsController);

// Protected: create/update/delete require login
router.post('/product/:productId', authenticate, createReviewController);
router.put('/:reviewId', authenticate, updateReviewController);
router.delete('/:reviewId', authenticate, deleteReviewController);

export default router;
