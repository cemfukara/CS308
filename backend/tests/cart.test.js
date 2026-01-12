import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app/app.js';
import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

// 1. Mock the Cart Model
import * as CartModel from '../models/Cart.js';

vi.mock('../models/Cart.js');

describe('Cart Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: getCart
  it('GET /api/cart - should return cart and items', async () => {
    const mockCart = { order_id: 5, user_id: 1, status: 'cart' };
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
    expect(CartModel.getOrCreateCart).toHaveBeenCalledWith(1);
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

  it('PATCH /api/cart/items/:productId - should update cart item quantity', async () => {
    const productId = 1;

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: 'Cart item updated',
      })
    );
  });

  it('PATCH /api/cart/items/:productId - should return 400 if quantity missing', async () => {
    const productId = 1;

    const res = await request(app)
      .patch(`/api/cart/items/${productId}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: 'productId and quantity required',
      })
    );
  });

  // Test 5: deleteCartItem (Success)
  it('DELETE /api/cart/remove/:productId - should remove item', async () => {
    CartModel.removeFromCart.mockResolvedValue([{ affectedRows: 1 }]);

    const res = await request(app).delete('/api/cart/remove/99');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
    expect(CartModel.removeFromCart).toHaveBeenCalledWith(1, '99');
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

  // Test 8: Stock Validation - Insufficient Stock
  it('POST /api/cart/add - should fail when adding exceeds stock', async () => {
    const mockCart = { order_id: 5, user_id: 123, status: 'cart' };

    CartModel.getOrCreateCart.mockResolvedValue(mockCart);
    CartModel.addToCart.mockResolvedValue({
      error: 'Insufficient stock. Available: 5, In cart: 3',
      stockError: true,
      availableStock: 5,
      currentCartQuantity: 3,
    });

    const res = await request(app).post('/api/cart/add').send({
      productId: 99,
      quantity: 3,
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.stockError).toBe(true);
    expect(res.body.availableStock).toBe(5);
    expect(res.body.currentCartQuantity).toBe(3);
  });

  // Test 9: Stock Validation - Adding within stock limit
  it('POST /api/cart/add - should succeed when stock is sufficient', async () => {
    const mockCart = { order_id: 5, user_id: 123, status: 'cart' };

    CartModel.getOrCreateCart.mockResolvedValue(mockCart);
    CartModel.addToCart.mockResolvedValue([{}]); // Success returns DB result

    const res = await request(app).post('/api/cart/add').send({
      productId: 99,
      quantity: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/added to cart/i);
  });
});
