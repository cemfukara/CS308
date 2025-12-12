import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app/app.js';

// 1. Mock the Cart Model
import * as CartModel from '../models/Cart.js';

vi.mock('../models/Cart.js');

// 2. Mock Auth Middleware
vi.mock('../app/middlewares/authMiddleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { user_id: 123, role: 'customer' }; // Default mock user
    next();
  },
  // We mock this because adminRoutes (loaded by app.js) uses it.
  // We return a function that calls next() immediately, bypassing the role check.
  authorizeRoles:
    (...roles) =>
    (req, res, next) =>
      next(),
}));

describe('Cart Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: getCart
  it('GET /api/cart - should return cart and items', async () => {
    const mockCart = { order_id: 5, user_id: 123, status: 'cart' };
    const mockItems = [
      {
        order_item_id: 10,
        quantity: 2,
        price_at_purchase: 50,
        product_id: 1,
        name: 'Test Product',
        price: 50,
        image_url: 'img.jpg',
      },
    ];

    CartModel.getOrCreateCart.mockResolvedValue(mockCart);
    CartModel.getCartItems.mockResolvedValue(mockItems);

    const res = await request(app).get('/api/cart');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart).toEqual(mockCart);
    expect(res.body.items).toEqual(mockItems);
    expect(CartModel.getOrCreateCart).toHaveBeenCalledWith(123);
    expect(CartModel.getCartItems).toHaveBeenCalledWith(5);
  });

  // Test 2: addItemToCart (Success)
  it('POST /api/cart/add - should add item to cart', async () => {
    const mockCart = { order_id: 5, user_id: 123, status: 'cart' };

    CartModel.getOrCreateCart.mockResolvedValue(mockCart);
    CartModel.addToCart.mockResolvedValue([{}]);

    const res = await request(app).post('/api/cart/add').send({
      productId: 99,
      quantity: 2,
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/added to cart/i);
    expect(CartModel.addToCart).toHaveBeenCalledWith(5, 99, 2);
  });

  // Test 3: addItemToCart (Validation Failure)
  it('POST /api/cart/add - should fail if productId is missing', async () => {
    const res = await request(app).post('/api/cart/add').send({
      quantity: 1,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/productId required/i);
    expect(CartModel.addToCart).not.toHaveBeenCalled();
  });

  // Test 4: update cart (Not Implemented)
  it('PUT /api/cart/update - should return 501 not implemented', async () => {
    const res = await request(app).put('/api/cart/update').send({});

    expect(res.status).toBe(501);
    expect(res.body.message).toMatch(/not implemented/i);
  });

  // Test 5: deleteCartItem (Success)
  it('DELETE /api/cart/remove/:productId - should remove item', async () => {
    CartModel.removeFromCart.mockResolvedValue([{ affectedRows: 1 }]);

    const res = await request(app).delete('/api/cart/remove/99');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
    expect(CartModel.removeFromCart).toHaveBeenCalledWith(123, '99');
  });

  // Test 6: deleteCartItem (Not Found)
  it('DELETE /api/cart/remove/:productId - should return 404 if item not in cart', async () => {
    CartModel.removeFromCart.mockResolvedValue([{ affectedRows: 0 }]);

    const res = await request(app).delete('/api/cart/remove/99');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  // Test 7: clearUserCart
  it('DELETE /api/cart/clear - should clear all items', async () => {
    const mockCart = { order_id: 5, user_id: 123, status: 'cart' };

    CartModel.getOrCreateCart.mockResolvedValue(mockCart);
    CartModel.clearCart.mockResolvedValue([{}]);

    const res = await request(app).delete('/api/cart/clear');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cart cleared/i);
    expect(CartModel.clearCart).toHaveBeenCalledWith(5);
  });
});
