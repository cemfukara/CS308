import request from 'supertest';
import express from 'express';
import {
    getOrders,
    getOrderDetails,
    checkoutOrder
} from '../controllers/orderController.js';

// 1. Mock the entire models module to isolate the Controller
// The path MUST match the path in your controller file (e.g., "../models/order.js")
import * as OrderModel from "../models/Order.js";
jest.mock("../models/order.js");

// 2. Setup a minimal Express App for testing controllers
const app = express();
app.use(express.json());

// Mock Middleware: Simulates the authentication middleware that adds req.user
const mockAuth = (req, res, next) => {
    // Assuming the auth middleware sets req.user.id
    req.user = { id: 101 }; 
    next();
};

// 3. Define the routes using the mock auth middleware
app.get('/orders', mockAuth, getOrders);
app.get('/orders/:orderId', mockAuth, getOrderDetails);
app.post('/orders/:orderId/checkout', mockAuth, checkoutOrder);

// --- Test Data ---
const mockOrders = [
    { order_id: 1, total: 50.00, status: 'completed' },
    { order_id: 2, total: 120.00, status: 'shipped' }
];
const mockOrderItems = [
    { item_id: 10, product_name: 'Widget A', quantity: 1 },
    { item_id: 11, product_name: 'Gadget B', quantity: 3 }
];
const TEST_ORDER_ID = 500;
const TEST_USER_ID = 101;


describe('Order Controller Tests', () => {

    // Clear all mock history between tests
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ------------------------------------------------------------------
    // GET /orders (Order History)
    // ------------------------------------------------------------------
    describe('GET /orders', () => {
        it('should return 200 with the list of user orders', async () => {
            // Mock successful return value
            OrderModel.getUserOrders.mockResolvedValue(mockOrders);

            const response = await request(app).get('/orders');

            // Assertions
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.orders).toEqual(mockOrders);
            // Verify model function was called with the correct user ID
            expect(OrderModel.getUserOrders).toHaveBeenCalledWith(TEST_USER_ID); 
        });

        it('should return 500 if the model layer throws an error', async () => {
            OrderModel.getUserOrders.mockRejectedValue(new Error('DB connection failed'));

            const response = await request(app).get('/orders');

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Server error");
        });
    });

    // ------------------------------------------------------------------
    // GET /orders/:orderId (Order Details)
    // ------------------------------------------------------------------
    describe('GET /orders/:orderId', () => {
        it('should return 200 with the list of items for a specific order', async () => {
            OrderModel.getOrderItems.mockResolvedValue(mockOrderItems);

            const response = await request(app).get(`/orders/${TEST_ORDER_ID}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.orderId).toBe(String(TEST_ORDER_ID));
            expect(response.body.items).toEqual(mockOrderItems);
            // Verify model function was called with the correct order ID
            expect(OrderModel.getOrderItems).toHaveBeenCalledWith(String(TEST_ORDER_ID));
        });

        it('should return 500 if the model layer throws an error', async () => {
            OrderModel.getOrderItems.mockRejectedValue(new Error('DB query failed'));

            const response = await request(app).get(`/orders/${TEST_ORDER_ID}`);

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Server error");
        });
    });

    // ------------------------------------------------------------------
    // POST /orders/:orderId/checkout (Update Status)
    // ------------------------------------------------------------------
    describe('POST /orders/:orderId/checkout', () => {
        it('should return 200 and update status successfully', async () => {
            const newStatus = 'shipped';
            OrderModel.updateOrderStatus.mockResolvedValue(true);

            const response = await request(app)
                .post(`/orders/${TEST_ORDER_ID}/checkout`)
                .send({ status: newStatus });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Order status updated successfully");
            // Verify model function was called with the correct parameters
            expect(OrderModel.updateOrderStatus).toHaveBeenCalledWith(String(TEST_ORDER_ID), newStatus);
        });

        it('should return 400 if the status field is missing', async () => {
            const response = await request(app)
                .post(`/orders/${TEST_ORDER_ID}/checkout`)
                .send({}); // Empty body

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Missing status field");
            expect(OrderModel.updateOrderStatus).not.toHaveBeenCalled();
        });

        it('should return 500 if the model layer throws an error', async () => {
            OrderModel.updateOrderStatus.mockRejectedValue(new Error('DB update error'));

            const response = await request(app)
                .post(`/orders/${TEST_ORDER_ID}/checkout`)
                .send({ status: 'failed_payment' });

            expect(response.statusCode).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Server error");
        });
    });
});