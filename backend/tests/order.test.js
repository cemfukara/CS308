import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  getOrders,
  getOrderDetails,
  createOrderController, // checkoutOrder doesn't exist in your controller, mapped to createOrderController or updateOrderStatus
  updateOrderStatusController, // Assuming 'checkout' logic maps to status updates or creation
} from '../app/controllers/orderController.js';

// 1. Mock the entire models module
import * as OrderModel from '../models/Order.js';
vi.mock('../models/Order.js');

// 2. Setup a minimal Express App
const app = express();
app.use(express.json());

// Mock Middleware
const mockAuth = (req, res, next) => {
  req.user = { user_id: 101 }; // Use 'user_id' to match your controller logic
  next();
};

// 3. Define Routes
// Note: Adjusted function names to match what is actually exported in 'orderController.js'
app.get('/orders', mockAuth, getOrders);
app.get('/orders/:id', mockAuth, getOrderDetails);
// Assuming 'checkout' refers to updating status (like shipping it out) or creating it.
// Based on your test logic (updateOrderStatus), mapping to the patch route logic:
app.post('/orders/:id/checkout', mockAuth, updateOrderStatusController);

// --- Test Data ---
const mockOrders = [
  { order_id: 1, total_price: 50.0, status: 'completed' },
  { order_id: 2, total_price: 120.0, status: 'shipped' },
];
const mockOrderItems = [
  { order_item_id: 10, name: 'Widget A', quantity: 1 },
  { order_item_id: 11, name: 'Gadget B', quantity: 3 },
];
const TEST_ORDER_ID = 500;
const TEST_USER_ID = 101;

describe('Order Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // GET /orders (Order History)
  // ------------------------------------------------------------------
  describe('GET /orders', () => {
    it('should return 200 with the list of user orders', async () => {
      OrderModel.getUserOrders.mockResolvedValue(mockOrders);

      const response = await request(app).get('/orders');

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orders).toEqual(mockOrders);
      expect(OrderModel.getUserOrders).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should return 500 if the model layer throws an error', async () => {
      OrderModel.getUserOrders.mockRejectedValue(
        new Error('DB connection failed')
      );

      const response = await request(app).get('/orders');

      expect(response.statusCode).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  // ------------------------------------------------------------------
  // GET /orders/:id (Order Details)
  // ------------------------------------------------------------------
  describe('GET /orders/:id', () => {
    it('should return 200 with the order and items', async () => {
      // Mock both calls: getOrderById and getOrderItems
      OrderModel.getOrderById.mockResolvedValue({ order_id: TEST_ORDER_ID });
      OrderModel.getOrderItems.mockResolvedValue(mockOrderItems);

      const response = await request(app).get(`/orders/${TEST_ORDER_ID}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.order).toEqual({ order_id: TEST_ORDER_ID });
      expect(response.body.items).toEqual(mockOrderItems);
      // Calls with (orderId, userId)
      expect(OrderModel.getOrderById).toHaveBeenCalledWith(
        String(TEST_ORDER_ID),
        TEST_USER_ID
      );
    });

    it('should return 404 if order not found', async () => {
      OrderModel.getOrderById.mockResolvedValue(null);
      OrderModel.getOrderItems.mockResolvedValue([]);

      const response = await request(app).get(`/orders/${TEST_ORDER_ID}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Order not found');
    });
  });

  // ------------------------------------------------------------------
  // POST /orders/:id/checkout (Update Status)
  // ------------------------------------------------------------------
  describe('POST /orders/:id/checkout', () => {
    it('should return 200 and update status successfully', async () => {
      // Logic from updateOrderStatusController
      // Note: Controller expects { status: ... } in body
      const newStatus = 'shipped';
      
      // We need to bypass the ALLOWED_STATUS_SET check in controller or use a valid one.
      // Valid statuses: 'processing', 'in-transit', 'delivered', 'cancelled', 'refunded'
      // Let's use 'in-transit' to pass validation
      const validStatus = 'in-transit'; 

      OrderModel.updateOrderStatus.mockResolvedValue(true);

      const response = await request(app)
        .post(`/orders/${TEST_ORDER_ID}/checkout`)
        .send({ status: validStatus });

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Delivery status updated');
      expect(OrderModel.updateOrderStatus).toHaveBeenCalledWith(
        TEST_ORDER_ID, // Controller parses param to Int
        validStatus
      );
    });

    it('should return 400 if the status is invalid', async () => {
      const response = await request(app)
        .post(`/orders/${TEST_ORDER_ID}/checkout`)
        .send({ status: 'invalid_status' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid status value');
    });
  });
});