import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import Controllers
import {
  getProductReviewsController,
  getProductAverageRatingController,
  getUserReviewsController,
  createReviewController,
  updateReviewController,
  deleteReviewController,
  getPendingCommentsController,
  approveReviewCommentController,
  rejectReviewCommentController,
} from '../app/controllers/reviewController.js';

vi.mock('../models/Review.js', () => {
  return {
    getProductReviews: vi.fn(),
    getProductAverageRating: vi.fn(),
    getUserReviews: vi.fn(),
    hasUserPurchasedProduct: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    getPendingComments: vi.fn(),
    setReviewStatus: vi.fn(),
    // If your controller imports the class as default, this handles that case too:
    default: {
      getProductReviews: vi.fn(),
      getProductAverageRating: vi.fn(),
      getUserReviews: vi.fn(),
      hasUserPurchasedProduct: vi.fn(),
      createReview: vi.fn(),
      updateReview: vi.fn(),
      deleteReview: vi.fn(),
      getPendingComments: vi.fn(),
      setReviewStatus: vi.fn(),
    },
  };
});

// 1. Mock the Review Model
import * as ReviewModel from '../models/Review.js';
//vi.mock('../models/Review.js');

// 2. Setup Express App
const app = express();
app.use(express.json());

// Mock Auth Middleware
// We simulate a user who is a Product Manager to allow access to all routes for testing purposes.
// In real scenarios, you might separate these permissions, but this covers the controller logic.
const mockAuth = (req, res, next) => {
  req.user = { user_id: 101, role: 'product manager', email: 'test@shop.com' };
  next();
};

// 3. Define Routes (mirroring reviewRoutes.js)
// Public Routes
app.get('/reviews/product/:productId', getProductReviewsController);
app.get(
  '/reviews/product/:productId/average',
  getProductAverageRatingController
);
app.get('/reviews/user/:userId', getUserReviewsController);

// Protected Routes (Customer)
app.post('/reviews/product/:productId', mockAuth, createReviewController);
app.put('/reviews/:reviewId', mockAuth, updateReviewController);
app.delete('/reviews/:reviewId', mockAuth, deleteReviewController);

// Protected Routes (Product Manager)
app.get('/reviews/pending', mockAuth, getPendingCommentsController);
app.patch(
  '/reviews/:reviewId/approve',
  mockAuth,
  approveReviewCommentController
);
app.patch('/reviews/:reviewId/reject', mockAuth, rejectReviewCommentController);

// --- Test Data ---
const mockReviews = [
  {
    review_id: 1,
    user_id: 101,
    rating: 5,
    comment_text: 'Great!',
    status: 'approved',
  },
  {
    review_id: 2,
    user_id: 102,
    rating: 4,
    comment_text: 'Good',
    status: 'approved',
  },
];
const mockStats = { average_rating: 4.5, review_count: 2 };

describe('Review Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================================================================
  // PUBLIC ENDPOINTS
  // ==================================================================
  describe('GET /reviews/product/:productId', () => {
    it('should return 200 and list of reviews', async () => {
      ReviewModel.getProductReviews.mockResolvedValue(mockReviews);

      const response = await request(app).get('/reviews/product/10');

      expect(response.status).toBe(200);
      expect(response.body.reviews).toEqual(mockReviews);
      expect(ReviewModel.getProductReviews).toHaveBeenCalledWith('10');
    });
  });

  describe('GET /reviews/product/:productId/average', () => {
    it('should return 200 and rating stats', async () => {
      ReviewModel.getProductAverageRating.mockResolvedValue(mockStats);

      const response = await request(app).get('/reviews/product/10/average');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStats);
      expect(ReviewModel.getProductAverageRating).toHaveBeenCalledWith('10');
    });
  });

  describe('GET /reviews/user/:userId', () => {
    it('should return 200 and user reviews', async () => {
      ReviewModel.getUserReviews.mockResolvedValue(mockReviews);

      const response = await request(app).get('/reviews/user/101');

      expect(response.status).toBe(200);
      expect(response.body.reviews).toEqual(mockReviews);
      expect(ReviewModel.getUserReviews).toHaveBeenCalledWith('101');
    });
  });

  // ==================================================================
  // CREATE REVIEW (Complex Logic)
  // ==================================================================
  describe('POST /reviews/product/:productId', () => {
    const productId = '10';

    it('should return 403 if user has not purchased the product', async () => {
      ReviewModel.hasUserPurchasedProduct.mockResolvedValue(false); // Not delivered

      const response = await request(app)
        .post(`/reviews/product/${productId}`)
        .send({ rating: 5 });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/delivered/);
    });

    it('should create an APPROVED review if NO comment is provided', async () => {
      ReviewModel.hasUserPurchasedProduct.mockResolvedValue(true);
      ReviewModel.createReview.mockResolvedValue({
        review_id: 1,
        status: 'approved',
      });

      const response = await request(app)
        .post(`/reviews/product/${productId}`)
        .send({ rating: 5, comment_text: '' });

      expect(response.status).toBe(201);
      expect(response.body.review.status).toBe('approved');
      // Verify createReview was called with status: 'approved'
      expect(ReviewModel.createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          commentText: '',
        })
      );
    });

    it('should create a PENDING review if a comment IS provided', async () => {
      ReviewModel.hasUserPurchasedProduct.mockResolvedValue(true);
      ReviewModel.createReview.mockResolvedValue({
        review_id: 2,
        status: 'pending',
      });

      const response = await request(app)
        .post(`/reviews/product/${productId}`)
        .send({ rating: 5, comment_text: 'I loved it!' });

      expect(response.status).toBe(201);
      expect(response.body.review.status).toBe('pending');
      expect(response.body.message).toMatch(/pending approval/);

      expect(ReviewModel.createReview).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          commentText: 'I loved it!',
        })
      );
    });

    it('should return 400 for invalid rating', async () => {
      ReviewModel.hasUserPurchasedProduct.mockResolvedValue(true);
      const response = await request(app)
        .post(`/reviews/product/${productId}`)
        .send({ rating: 6 }); // Invalid

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Rating must be 1–5/);
    });

    it('should return 409 if review already exists', async () => {
      ReviewModel.hasUserPurchasedProduct.mockResolvedValue(true);
      const err = new Error('Duplicate');
      err.statusCode = 409;
      ReviewModel.createReview.mockRejectedValue(err);

      const response = await request(app)
        .post(`/reviews/product/${productId}`)
        .send({ rating: 5 });

      expect(response.status).toBe(409);
    });
  });

  // ==================================================================
  // UPDATE & DELETE
  // ==================================================================
  describe('PUT /reviews/:reviewId', () => {
    it('should return 200 and updated review', async () => {
      ReviewModel.updateReview.mockResolvedValue({ review_id: 1, rating: 3 });

      const response = await request(app).put('/reviews/1').send({ rating: 3 });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Review updated');
      expect(ReviewModel.updateReview).toHaveBeenCalled();
    });
  });

  describe('DELETE /reviews/:reviewId', () => {
    it('should return 200 when review deleted', async () => {
      ReviewModel.deleteReview.mockResolvedValue({ success: true });

      const response = await request(app).delete('/reviews/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Review deleted');
    });
  });

  // ==================================================================
  // MODERATION (PM Only)
  // ==================================================================
  describe('GET /reviews/pending', () => {
    it('should return pending reviews', async () => {
      const pendingReviews = [{ review_id: 99, status: 'pending' }];
      ReviewModel.getPendingComments.mockResolvedValue(pendingReviews);

      const response = await request(app).get('/reviews/pending');

      expect(response.status).toBe(200);
      expect(response.body.comments).toEqual(pendingReviews);
    });
  });

  describe('PATCH /reviews/:reviewId/approve', () => {
    it('should approve review', async () => {
      ReviewModel.setReviewStatus.mockResolvedValue({ success: true });

      const response = await request(app).patch('/reviews/99/approve');

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/approved/);
      expect(ReviewModel.setReviewStatus).toHaveBeenCalledWith({
        reviewId: 99,
        status: 'approved',
      });
    });
  });

  describe('PATCH /reviews/:reviewId/reject', () => {
    it('should reject review', async () => {
      ReviewModel.setReviewStatus.mockResolvedValue({ success: true });

      const response = await request(app).patch('/reviews/99/reject');

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/rejected/);
      expect(ReviewModel.setReviewStatus).toHaveBeenCalledWith({
        reviewId: 99,
        status: 'rejected',
      });
    });
  });
});
