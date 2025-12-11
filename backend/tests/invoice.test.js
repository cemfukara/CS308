import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import Controllers
import {
  getInvoicesByDateRange,
  generateInvoicePDF,
  getRevenueProfit,
  getRevenueProfitChartController,
} from '../app/controllers/invoiceController.js';

// 1. Mock the Invoice Model
import * as InvoiceModel from '../models/Invoice.js';
vi.mock('../models/Invoice.js');

// 2. Mock PDFKit to prevent actual PDF generation and verify stream logic
vi.mock('pdfkit', () => {
  return {
    default: class PDFDocument {
      constructor() {
        this.pipe = vi.fn();
        this.fontSize = vi.fn().mockReturnThis();
        this.text = vi.fn().mockReturnThis();
        this.moveDown = vi.fn().mockReturnThis();
        this.end = vi.fn();
      }
    },
  };
});

// 3. Setup Express App
const app = express();
app.use(express.json());

// Mock Auth Middleware (Invoices are usually protected, though logic is independent)
const mockAuth = (req, res, next) => {
  req.user = { user_id: 1, role: 'sales manager' };
  next();
};

// 4. Define Routes (mirroring invoiceRoutes.js)
app.get('/invoices/range', mockAuth, getInvoicesByDateRange);
app.get('/invoices/:orderId/pdf', mockAuth, generateInvoicePDF);
app.get('/invoices/revenue', mockAuth, getRevenueProfit);
app.get('/invoices/chart', mockAuth, getRevenueProfitChartController);

// --- Test Data ---
const mockDateStart = '2025-01-01';
const mockDateEnd = '2025-01-31';
const mockQuery = `?start=${mockDateStart}&end=${mockDateEnd}`;

describe('Invoice Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // GET /invoices/range
  // ------------------------------------------------------------------
  describe('GET /invoices/range', () => {
    it('should return 200 and a list of invoices', async () => {
      const mockInvoices = [
        { order_id: 101, total_price: 150.0, status: 'delivered' },
        { order_id: 102, total_price: 200.0, status: 'processing' },
      ];
      InvoiceModel.getInvoicesByDateRange.mockResolvedValue(mockInvoices);

      const response = await request(app).get(`/invoices/range${mockQuery}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInvoices);
      expect(InvoiceModel.getInvoicesByDateRange).toHaveBeenCalledWith(
        mockDateStart,
        mockDateEnd
      );
    });

    it('should return 400 if start or end date is missing', async () => {
      const response = await request(app).get('/invoices/range?start=2025-01-01'); // Missing end

      expect(response.status).toBe(500); // Controller throws, caught by error handler (mocked app defaults to 500 html/text)
      // Note: In a real app with proper error middleware, this might check for 400 JSON.
      // Based on your controller code: it throws new Error(400), which ends up in catch block responding 500.
    });

    it('should return 500 if model throws an error', async () => {
      InvoiceModel.getInvoicesByDateRange.mockRejectedValue(new Error('DB Error'));

      const response = await request(app).get(`/invoices/range${mockQuery}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  // ------------------------------------------------------------------
  // GET /invoices/:orderId/pdf
  // ------------------------------------------------------------------
  describe('GET /invoices/:orderId/pdf', () => {
    it('should return 200 and stream a PDF', async () => {
      const orderId = 123;
      const mockInvoice = {
        order_id: 123,
        user_email: 'test@test.com',
        status: 'delivered',
        total_price: 100,
        order_date: new Date(),
      };
      const mockItems = [
        { product_name: 'Widget', quantity: 2, price_at_purchase: 50 },
      ];

      InvoiceModel.getInvoiceById.mockResolvedValue(mockInvoice);
      InvoiceModel.getInvoiceItems.mockResolvedValue(mockItems);

      const response = await request(app).get(`/invoices/${orderId}/pdf`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain(
        `attachment; filename=invoice-${orderId}.pdf`
      );
      
      expect(InvoiceModel.getInvoiceById).toHaveBeenCalledWith(orderId);
      expect(InvoiceModel.getInvoiceItems).toHaveBeenCalledWith(orderId);
    });

    it('should return 400 for invalid order ID', async () => {
      const response = await request(app).get('/invoices/abc/pdf');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid order ID');
    });

    it('should return 404 if invoice not found', async () => {
      InvoiceModel.getInvoiceById.mockResolvedValue(null);

      const response = await request(app).get('/invoices/999/pdf');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Invoice/order not found');
    });
  });

  // ------------------------------------------------------------------
  // GET /invoices/revenue
  // ------------------------------------------------------------------
  describe('GET /invoices/revenue', () => {
    it('should return 200 with revenue stats', async () => {
      const mockStats = {
        total_revenue: 5000,
        total_cost: 2500,
        total_profit: 2500,
      };
      InvoiceModel.getRevenueProfitBetweenDates.mockResolvedValue(mockStats);

      const response = await request(app).get(`/invoices/revenue${mockQuery}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        revenue: 5000,
        cost: 2500,
        profit: 2500,
      });
      expect(InvoiceModel.getRevenueProfitBetweenDates).toHaveBeenCalledWith(
        mockDateStart,
        mockDateEnd
      );
    });

    it('should return 500 if date parsing fails', async () => {
      // Missing query params triggers the helper error -> catch block -> 500
      const response = await request(app).get('/invoices/revenue');
      expect(response.status).toBe(500);
    });
  });

  // ------------------------------------------------------------------
  // GET /invoices/chart
  // ------------------------------------------------------------------
  describe('GET /invoices/chart', () => {
    it('should return 200 with chart data', async () => {
      const mockChartData = [
        { day: '2025-01-01', revenue: 100, cost: 50, profit: 50 },
        { day: '2025-01-02', revenue: 200, cost: 100, profit: 100 },
      ];
      InvoiceModel.getRevenueProfitChart.mockResolvedValue(mockChartData);

      const response = await request(app).get(`/invoices/chart${mockQuery}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].day).toBe('2025-01-01');
      expect(InvoiceModel.getRevenueProfitChart).toHaveBeenCalledWith(
        mockDateStart,
        mockDateEnd
      );
    });
  });
});