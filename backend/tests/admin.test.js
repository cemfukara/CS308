import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// --------------------------------------------------
// IMPORT CONTROLLERS
// --------------------------------------------------
import { setDiscount } from '../app/controllers/productController.js';
import { getDeliveries } from '../app/controllers/orderController.js';
import {
  getInvoicesByDateRange,
  getRevenueProfit,
  getRevenueProfitChartController,
} from '../app/controllers/invoiceController.js';
import {
  approveReviewCommentController,
  getPendingCommentsController,
} from '../app/controllers/reviewController.js';

// --------------------------------------------------
// MOCK MODELS
// --------------------------------------------------
import * as InvoiceModel from '../models/Invoice.js';
import * as OrderModel from '../models/Order.js';
import * as ReviewModel from '../models/Review.js';
import * as ProductModel from '../models/Product.js';
import * as WishlistModel from '../models/Wishlist.js';
import * as NotificationModel from '../models/Notification.js';

vi.mock('../models/Invoice.js');
vi.mock('../models/Order.js');
vi.mock('../models/Review.js');
vi.mock('../models/Product.js');
vi.mock('../models/Wishlist.js');
vi.mock('../models/Notification.js');

// --------------------------------------------------
// SETUP EXPRESS APP
// --------------------------------------------------
const app = express();
app.use(express.json());

// --------------------------------------------------
// ROUTES (mirror adminRoutes.js)
// --------------------------------------------------

// Sales Manager
app.get('/invoices/range', getInvoicesByDateRange);
app.get('/invoices/revenue', getRevenueProfit);
app.get('/invoices/chart', getRevenueProfitChartController);

// Product Manager
app.patch('/products/discount', setDiscount);
app.get('/deliveries', getDeliveries);
app.get('/reviews/pending', getPendingCommentsController);
app.patch('/reviews/:reviewId/approve', approveReviewCommentController);

// --------------------------------------------------
// TESTS
// --------------------------------------------------
describe('Admin Routes Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  /* ============================================================
     SALES MANAGER TESTS
     ============================================================ */
  describe('Sales Manager Endpoints', () => {
    it('GET /invoices/range - should return invoices for date range', async () => {
      const mockInvoices = [{ order_id: 10, total: 500 }];
      InvoiceModel.getInvoicesByDateRange.mockResolvedValue(mockInvoices);

      const res = await request(app).get(
        '/invoices/range?start=2025-01-01&end=2025-01-31'
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockInvoices);
      expect(InvoiceModel.getInvoicesByDateRange).toHaveBeenCalledWith(
        '2025-01-01',
        '2025-01-31'
      );
    });

    it('GET /invoices/range - should return 400 if dates missing', async () => {
      const res = await request(app).get('/invoices/range');

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/start and end/i);
    });

    it('GET /invoices/revenue - should return financial stats', async () => {
      const mockStats = {
        total_revenue: 1000,
        total_cost: 500,
        total_profit: 500,
      };

      InvoiceModel.getRevenueProfitBetweenDates.mockResolvedValue(mockStats);

      const res = await request(app).get(
        '/invoices/revenue?start=2025-01-01&end=2025-01-02'
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        revenue: 1000,
        cost: 500,
        profit: 500,
      });
    });

    it('GET /invoices/chart - should return daily chart data', async () => {
      const mockChart = [{ day: '2025-01-01', revenue: 100 }];
      InvoiceModel.getRevenueProfitChart.mockResolvedValue(mockChart);

      const res = await request(app).get(
        '/invoices/chart?start=2025-01-01&end=2025-01-02'
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { day: '2025-01-01', revenue: 100, cost: 0, profit: 0 },
      ]);
    });

    it('PATCH /products/discount - should apply discount and notify users', async () => {
      ProductModel.getProductById.mockResolvedValue({
        product_id: 1,
        name: 'Test Product',
        price: 100,
      });

      ProductModel.applyDiscount.mockResolvedValue({
        product_id: 1,
        price: 90,
      });

      WishlistModel.getWishlistedUsers.mockResolvedValue([{ user_id: 5 }]);
      NotificationModel.notifyUsers.mockResolvedValue(true);

      const res = await request(app)
        .patch('/products/discount')
        .send({ productId: 1, discountRate: 10 });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/discount applied/i);

      expect(ProductModel.getProductById).toHaveBeenCalledWith(1);
      expect(ProductModel.applyDiscount).toHaveBeenCalledWith(1, 10);
    });
  });

  /* ============================================================
     PRODUCT MANAGER TESTS
     ============================================================ */
  describe('Product Manager Endpoints', () => {
    it('GET /deliveries - should return all non-cart orders', async () => {
      const mockOrders = [{ order_id: 100, status: 'processing' }];
      OrderModel.getAllOrders.mockResolvedValue(mockOrders);

      const res = await request(app).get('/deliveries');

      expect(res.status).toBe(200);
      expect(res.body.orders).toEqual(mockOrders);
      expect(OrderModel.getAllOrders).toHaveBeenCalled();
    });

    it('GET /reviews/pending - should return reviews requiring moderation', async () => {
      const mockReviews = [
        { review_id: 5, comment_text: 'Wait', status: 'pending' },
      ];
      ReviewModel.getPendingComments.mockResolvedValue(mockReviews);

      const res = await request(app).get('/reviews/pending');

      expect(res.status).toBe(200);
      expect(res.body.comments).toEqual(mockReviews);
    });

    it('PATCH /reviews/:id/approve - should approve review', async () => {
      ReviewModel.setReviewStatus.mockResolvedValue({ success: true });

      const res = await request(app).patch('/reviews/50/approve');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/approved successfully/i);
      expect(ReviewModel.setReviewStatus).toHaveBeenCalledWith({
        reviewId: 50,
        status: 'approved',
      });
    });

    it('PATCH /reviews/:id/approve - should return 400 for invalid ID', async () => {
      const res = await request(app).patch('/reviews/abc/approve');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid review id');
    });
  });
});
