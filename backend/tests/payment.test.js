import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { validatePayment } from '../app/controllers/paymentController.js';

// Setup a minimal Express App
const app = express();
app.use(express.json());

// Mock Authentication Middleware
const mockAuth = (req, res, next) => {
  req.user = { user_id: 101 };
  next();
};

// Define Routes
app.post('/payment/validate', mockAuth, validatePayment);

describe('Payment Validation Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // Cash on Delivery Tests
  // ------------------------------------------------------------------
  describe('POST /payment/validate - Cash on Delivery', () => {
    it('should return 200 for valid Cash on Delivery payment', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({ method: 'Cash on Delivery' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment validated successfully');
      expect(response.body.paymentMethod).toBe('Cash on Delivery');
    });

    it('should return 200 for COD shorthand method', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({ method: 'cod' });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.paymentMethod).toBe('Cash on Delivery');
    });
  });

  // ------------------------------------------------------------------
  // Credit Card - Valid Cases
  // ------------------------------------------------------------------
  describe('POST /payment/validate - Credit Card (Valid)', () => {
    it('should return 200 for valid credit card details', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111 1111 1111 1111',
          expiry: '12/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment validated successfully');
      expect(response.body.paymentMethod).toBe('Credit Card');
    });

    it('should accept card number without spaces', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'Jane Smith',
          cardNumber: '5500000000000004',
          expiry: '06/26',
          cvv: '456',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should accept 4-digit CVV with 16-digit card', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'Alice Johnson',
          cardNumber: '4111111111111111',
          expiry: '03/27',
          cvv: '1234',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // Credit Card - Invalid Cases
  // ------------------------------------------------------------------
  describe('POST /payment/validate - Credit Card (Invalid)', () => {
    it('should return 400 if card details are missing', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('All card details are required');
    });

    it('should return 400 for invalid cardholder name (too short)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'AB',
          cardNumber: '4111111111111111',
          expiry: '12/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid cardholder name');
    });

    it('should return 400 for card number ending in 0000 (declined)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111 1111 1111 0000',
          expiry: '12/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or declined card number');
    });

    it('should return 400 for card number not 16 digits (12 digits)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '411111111111',
          expiry: '12/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or declined card number');
    });

    it('should return 400 for card number not 16 digits (20 digits)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '41111111111111111111',
          expiry: '12/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or declined card number');
    });

    it('should return 400 for expired card', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '12/20',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired card');
    });

    it('should return 400 for invalid expiry month (>12)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '13/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired card');
    });

    it('should return 400 for invalid expiry month (<1)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '00/25',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired card');
    });

    it('should return 400 for invalid expiry format (too short)', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '12/5',
          cvv: '123',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired card');
    });

    it('should return 400 for CVV too short', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '12/25',
          cvv: '12',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid CVV');
    });

    it('should return 400 for CVV too long', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({
          method: 'Credit Card',
          cardName: 'John Doe',
          cardNumber: '4111111111111111',
          expiry: '12/25',
          cvv: '12345',
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid CVV');
    });
  });

  // ------------------------------------------------------------------
  // General Validation Tests
  // ------------------------------------------------------------------
  describe('POST /payment/validate - General Validation', () => {
    it('should return 400 if payment method is missing', async () => {
      const response = await request(app).post('/payment/validate').send({});

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Payment method is required');
    });

    it('should return 400 for invalid payment method', async () => {
      const response = await request(app)
        .post('/payment/validate')
        .send({ method: 'Bitcoin' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid payment method');
    });
  });
});
