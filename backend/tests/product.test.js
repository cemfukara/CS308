import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

/* =================================================
   MOCKS — MUST BE FIRST (NO IMPORTS ABOVE THESE)
================================================= */

// Models used by controller
vi.mock('../models/Product.js');
vi.mock('../models/Wishlist.js');

// Email service used by controller
vi.mock('../utils/emailService.js', () => ({
  sendStockNotificationEmail: vi.fn(),
  sendDiscountNotificationEmail: vi.fn(),
}));

// Validation middleware (simplified)
vi.mock('../app/middlewares/validationMiddleware.js', () => ({
  validateProductInput: [(req, res, next) => next()],
}));

/* =================================================
   IMPORTS — AFTER MOCKS
================================================= */

import app from '../app/app.js';

import * as ProductModel from '../models/Product.js';
import * as WishlistModel from '../models/Wishlist.js';

import { sendDiscountNotificationEmail } from '../utils/emailService.js';

/* =================================================
   TESTS
================================================= */

describe('Product Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: fetchProducts
  it('GET /api/products - should return product list', async () => {
    const mockData = {
      products: [{ id: 1, name: 'Phone' }],
      totalCount: 1,
      currentPage: 1,
    };

    ProductModel.getAllProducts.mockResolvedValue(mockData);

    const res = await request(app).get('/api/products?page=1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
    expect(ProductModel.getAllProducts).toHaveBeenCalled();
  });

  // Test 2: fetchProductDetails
  it('GET /api/products/:id - should return single product', async () => {
    const mockProduct = { id: 1, name: 'Phone', description: 'Smart' };

    ProductModel.getProductById.mockResolvedValue(mockProduct);

    const res = await request(app).get('/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockProduct);
  });

  // Test 3: addProduct
  it('POST /api/products - should create product', async () => {
    ProductModel.createProduct.mockResolvedValue(101);

    const res = await request(app).post('/api/products').send({
      name: 'New Item',
      price: 100,
      category_id: 1,
      quantity_in_stock: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(101);
  });

  // Test 4: updateProductDetails
  it('PUT /api/products/:id - should update product', async () => {
    ProductModel.getProductById.mockResolvedValue({ quantity_in_stock: 5 });
    ProductModel.updateProduct.mockResolvedValue(1);

    const res = await request(app)
      .put('/api/products/1')
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  // Test 5: removeProduct
  it('DELETE /api/products/:id - should delete product', async () => {
    ProductModel.deleteProduct.mockResolvedValue(1);

    const res = await request(app).delete('/api/products/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // Test 6: setDiscount (Sales Manager feature)
  it('PATCH /api/discount - should apply discount and notify', async () => {
    const mockProduct = {
      product_id: 1,
      name: 'Test Product',
      price: 80,
      list_price: 100,
    };

    ProductModel.getProductById.mockResolvedValue(mockProduct);
    ProductModel.applyDiscount.mockResolvedValue(mockProduct);

    WishlistModel.getWishlistedUsers.mockResolvedValue(['test@example.com']);

    sendDiscountNotificationEmail.mockResolvedValue(true);

    const res = await request(app)
      .patch('/api/discount')
      .send({ productId: 1, discountRate: 20 });

    expect(res.status).toBe(200);

    expect(ProductModel.applyDiscount).toHaveBeenCalledWith(1, 20);

    expect(sendDiscountNotificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test Product',
      20
    );
  });
});
