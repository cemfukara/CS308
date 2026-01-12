// backend/tests/refund.test.js
// Tests for refund request and processing functionality

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  requestRefundController,
  getPendingRefundsController,
  processRefundController,
  getMyRefundsController,
} from '../app/controllers/refundController.js';

// Mock the models
import * as RefundModel from '../models/Refund.js';
vi.mock('../models/Refund.js');

// Mock the email service
import * as GmailService from '../utils/gmailService.js';
vi.mock('../utils/gmailService.js');

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockCustomerAuth = (req, res, next) => {
  req.user = { user_id: 101, role: 'customer' };
  next();
};

const mockSalesManagerAuth = (req, res, next) => {
  req.user = { user_id: 201, role: 'sales manager' };
  next();
};

const mockProductManagerAuth = (req, res, next) => {
  req.user = { user_id: 301, role: 'product manager' };
  next();
};

// Define routes
app.post('/refund/request', mockCustomerAuth, requestRefundController);
app.get(
  '/refund/pending',
  mockSalesManagerAuth,
  getPendingRefundsController
);
app.put('/refund/process', mockSalesManagerAuth, processRefundController);
app.get('/refund/my-refunds', mockCustomerAuth, getMyRefundsController);

// Test data
const TEST_USER_ID = 101;
const TEST_ORDER_ITEM_ID = 500;
const TEST_REFUND_ID = 1000;

const mockRefund = {
  refund_id: TEST_REFUND_ID,
  order_item_id: TEST_ORDER_ITEM_ID,
  order_id: 100,
  user_id: TEST_USER_ID,
  quantity: 1,
  refund_amount: 1199.99,
  status: 'requested',
  reason: 'Product defective',
  requested_at: new Date().toISOString(),
};

const mockPendingRefunds = [
  {
    refund_id: 1,
    order_item_id: 10,
    order_id: 100,
    user_id: 101,
    quantity: 1,
    refund_amount: 1199.99,
    status: 'requested',
    reason: 'Product defective',
    requested_at: new Date().toISOString(),
    customer_email: 'customer@example.com',
    product_id: 1,
    product_name: 'iPhone 17 Pro Max',
    product_model: 'FUT-IP17-PM',
    currency: 'TL',
    price_at_purchase: 1199.99,
    order_date: new Date().toISOString(),
  },
  {
    refund_id: 2,
    order_item_id: 11,
    order_id: 101,
    user_id: 102,
    quantity: 2,
    refund_amount: 99.98,
    status: 'requested',
    reason: 'Wrong item received',
    requested_at: new Date().toISOString(),
    customer_email: 'another@example.com',
    product_id: 2,
    product_name: 'USB Cable',
    product_model: 'USB-C-001',
    currency: 'TL',
    price_at_purchase: 49.99,
    order_date: new Date().toISOString(),
  },
];

describe('Refund Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // POST /refund/request (Customer requests refund)
  // ------------------------------------------------------------------
  describe('POST /refund/request', () => {
    it('should successfully request a refund', async () => {
      RefundModel.requestRefund.mockResolvedValue(mockRefund);

      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Refund request submitted successfully');
      expect(response.body.refund).toEqual(mockRefund);
      expect(RefundModel.requestRefund).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_ORDER_ITEM_ID,
        1,
        'Product defective'
      );
    });

    it('should return 400 if order_item_id is missing', async () => {
      const response = await request(app).post('/refund/request').send({
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('order_item_id is required');
    });

    it('should return 400 if quantity is invalid', async () => {
      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 0,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Valid quantity is required');
    });

    it('should return 400 if reason is missing', async () => {
      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Reason for refund is required');
    });

    it('should return 400 if order is not delivered', async () => {
      RefundModel.requestRefund.mockRejectedValue(
        new Error(
          "Cannot request refund. Order status is 'processing', but must be 'delivered' to request a refund."
        )
      );

      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot request refund');
      expect(response.body.message).toContain('delivered');
    });

    it('should return 400 if order is older than 30 days', async () => {
      RefundModel.requestRefund.mockRejectedValue(
        new Error(
          'Cannot request refund. This order was placed 45 days ago. Refunds must be requested within 30 days of purchase.'
        )
      );

      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('30 days');
    });

    it('should return 400 if duplicate refund request', async () => {
      const duplicateError = new Error('Duplicate entry');
      duplicateError.code = 'ER_DUP_ENTRY';
      RefundModel.requestRefund.mockRejectedValue(duplicateError);

      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 500 on server error', async () => {
      RefundModel.requestRefund.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).post('/refund/request').send({
        order_item_id: TEST_ORDER_ITEM_ID,
        quantity: 1,
        reason: 'Product defective',
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  // ------------------------------------------------------------------
  // GET /refund/pending (Sales Manager/Product Manager views pending refunds)
  // ------------------------------------------------------------------
  describe('GET /refund/pending', () => {
    it('should return all pending refunds', async () => {
      RefundModel.getPendingRefunds.mockResolvedValue(mockPendingRefunds);

      const response = await request(app).get('/refund/pending');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refunds).toEqual(mockPendingRefunds);
      expect(response.body.refunds).toHaveLength(2);
      expect(RefundModel.getPendingRefunds).toHaveBeenCalled();
    });

    it('should return empty array when no pending refunds', async () => {
      RefundModel.getPendingRefunds.mockResolvedValue([]);

      const response = await request(app).get('/refund/pending');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refunds).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      RefundModel.getPendingRefunds.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/refund/pending');

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  // ------------------------------------------------------------------
  // PUT /refund/process (Sales Manager approves/rejects refund)
  // ------------------------------------------------------------------
  describe('PUT /refund/process', () => {
    const mockRefundDetails = {
      refund_id: TEST_REFUND_ID,
      order_id: 100,
      customer_email: 'customer@example.com',
      product_name: 'iPhone 17 Pro Max',
      product_model: 'FUT-IP17-PM',
      quantity: 1,
      refund_amount: 1199.99,
      currency: 'TL',
      decision: 'approved',
    };

    it('should successfully approve a refund and send email', async () => {
      RefundModel.processRefund.mockResolvedValue(mockRefundDetails);
      GmailService.sendRefundApprovalEmail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'approved',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Refund approved successfully');
      expect(response.body.refund).toEqual(mockRefundDetails);
      expect(RefundModel.processRefund).toHaveBeenCalledWith(
        TEST_REFUND_ID,
        'approved',
        201 // Sales manager user_id
      );
      expect(GmailService.sendRefundApprovalEmail).toHaveBeenCalledWith(
        'customer@example.com',
        mockRefundDetails
      );
    });

    it('should successfully reject a refund without sending email', async () => {
      const rejectedDetails = { ...mockRefundDetails, decision: 'rejected' };
      RefundModel.processRefund.mockResolvedValue(rejectedDetails);

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'rejected',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Refund rejected successfully');
      expect(RefundModel.processRefund).toHaveBeenCalledWith(
        TEST_REFUND_ID,
        'rejected',
        201
      );
      expect(GmailService.sendRefundApprovalEmail).not.toHaveBeenCalled();
    });

    it('should return 400 if refund_id is missing', async () => {
      const response = await request(app).put('/refund/process').send({
        decision: 'approved',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('refund_id is required');
    });

    it('should return 400 if decision is missing', async () => {
      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('decision is required');
    });

    it('should return 400 if decision is invalid', async () => {
      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'pending',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('approved');
      expect(response.body.message).toContain('rejected');
    });

    it('should return 400 if refund not found', async () => {
      RefundModel.processRefund.mockRejectedValue(
        new Error('Refund request not found')
      );

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'approved',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Refund request not found');
    });

    it('should return 400 if refund already processed', async () => {
      RefundModel.processRefund.mockRejectedValue(
        new Error(
          "This refund has already been processed with status: 'approved'"
        )
      );

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'approved',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already been processed');
    });

    it('should process refund even if email fails', async () => {
      RefundModel.processRefund.mockResolvedValue(mockRefundDetails);
      GmailService.sendRefundApprovalEmail.mockRejectedValue(
        new Error('Email service unavailable')
      );

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'approved',
      });

      // Refund should still be processed successfully
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Refund approved successfully');
    });

    it('should return 500 on server error', async () => {
      RefundModel.processRefund.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).put('/refund/process').send({
        refund_id: TEST_REFUND_ID,
        decision: 'approved',
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  // ------------------------------------------------------------------
  // GET /refund/my-refunds (Customer views their refunds)
  // ------------------------------------------------------------------
  describe('GET /refund/my-refunds', () => {
    const mockUserRefunds = [
      {
        refund_id: 1,
        order_item_id: 10,
        order_id: 100,
        quantity: 1,
        refund_amount: 1199.99,
        status: 'approved',
        reason: 'Product defective',
        requested_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        product_id: 1,
        product_name: 'iPhone 17 Pro Max',
        product_model: 'FUT-IP17-PM',
        currency: 'TL',
      },
    ];

    it('should return user refunds', async () => {
      RefundModel.getUserRefunds.mockResolvedValue(mockUserRefunds);

      const response = await request(app).get('/refund/my-refunds');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refunds).toEqual(mockUserRefunds);
      expect(RefundModel.getUserRefunds).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return empty array when user has no refunds', async () => {
      RefundModel.getUserRefunds.mockResolvedValue([]);

      const response = await request(app).get('/refund/my-refunds');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.refunds).toEqual([]);
    });

    it('should return 500 on server error', async () => {
      RefundModel.getUserRefunds.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/refund/my-refunds');

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });
});
