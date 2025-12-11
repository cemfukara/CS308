import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import Controllers
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
} from '../app/controllers/wishlistController.js';

// 1. Mock the Models
import * as WishlistModel from '../models/Wishlist.js';
import * as ProductModel from '../models/Product.js';

vi.mock('../models/Wishlist.js');
vi.mock('../models/Product.js');

// 2. Setup Express App
const app = express();
app.use(express.json());

// Mock Auth Middleware
const mockAuth = (req, res, next) => {
  req.user = { user_id: 1, email: 'test@shop.com' };
  next();
};

// 3. Define Routes (mirroring wishlistRoutes.js)
app.get('/wishlist', mockAuth, getWishlist);
app.post('/wishlist', mockAuth, addWishlistItem);
app.delete('/wishlist/:id', mockAuth, removeWishlistItem);
app.delete('/wishlist', mockAuth, clearWishlist);

// --- Test Data ---
const mockProduct = {
  product_id: 101,
  name: 'Cool Gadget',
  price: 50.0,
};

describe('Wishlist Controller Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // GET /wishlist
  // ------------------------------------------------------------------
  describe('GET /wishlist', () => {
    it('should return 200 and list of wishlist products', async () => {
      // Mock logic: Controller gets IDs from WishlistModel, then details from ProductModel
      WishlistModel.getWishlistByUserId.mockResolvedValue([101]);
      ProductModel.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app).get('/wishlist');

      expect(response.status).toBe(200);
      expect(response.body.wishlist).toHaveLength(1);
      expect(response.body.wishlist[0]).toEqual(mockProduct);
      expect(WishlistModel.getWishlistByUserId).toHaveBeenCalledWith(1);
      expect(ProductModel.getProductById).toHaveBeenCalledWith(101);
    });

    it('should return 500 if model throws an error', async () => {
      WishlistModel.getWishlistByUserId.mockRejectedValue(
        new Error('DB Error')
      );

      const response = await request(app).get('/wishlist');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Server error');
    });
  });

  // ------------------------------------------------------------------
  // POST /wishlist
  // ------------------------------------------------------------------
  describe('POST /wishlist', () => {
    const newItem = { product_id: 101 };

    it('should return 201 and add item if valid and unique', async () => {
      // 1. Check valid product
      ProductModel.getProductById.mockResolvedValue(mockProduct);
      // 2. Check duplicates (return empty list or list without this ID)
      WishlistModel.getWishlistByUserId.mockResolvedValue([999]);
      // 3. Add to wishlist
      WishlistModel.addToWishlist.mockResolvedValue(55); // Insert ID

      const response = await request(app).post('/wishlist').send(newItem);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Product added to wishlist');
      expect(response.body.wishlist.id).toBe(55);

      expect(ProductModel.getProductById).toHaveBeenCalledWith(101);
      expect(WishlistModel.addToWishlist).toHaveBeenCalledWith(1, 101);
    });

    it('should return 400 if product_id is invalid', async () => {
      const response = await request(app).post('/wishlist').send({}); // Missing ID
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid product_id');
    });

    it('should return 404 if product does not exist', async () => {
      ProductModel.getProductById.mockResolvedValue(null);

      const response = await request(app).post('/wishlist').send(newItem);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 409 if product is already in wishlist', async () => {
      ProductModel.getProductById.mockResolvedValue(mockProduct);
      // Mock existing wishlist containing the ID
      WishlistModel.getWishlistByUserId.mockResolvedValue([101]);

      const response = await request(app).post('/wishlist').send(newItem);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Product already in wishlist');
      expect(WishlistModel.addToWishlist).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // DELETE /wishlist/:product_id
  // ------------------------------------------------------------------
  describe('DELETE /wishlist/id', () => {
    it('should return 200 when item removed successfully', async () => {
      WishlistModel.deleteFromWishlist.mockResolvedValue(1); // 1 row affected

      const response = await request(app).delete('/wishlist/101');

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/removed from wishlist/);
      expect(WishlistModel.deleteFromWishlist).toHaveBeenCalledWith(1, '101');
    });

    it('should return 404 if item not found in wishlist', async () => {
      WishlistModel.deleteFromWishlist.mockResolvedValue(0); // 0 rows affected

      const response = await request(app).delete('/wishlist/999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Item not found in wishlist');
    });

    it('should return 400 for invalid product id parameter', async () => {
      const response = await request(app).delete('/wishlist/abc');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid id');
    });
  });

  // ------------------------------------------------------------------
  // DELETE /wishlist (Clear All)
  // ------------------------------------------------------------------
  describe('DELETE /wishlist', () => {
    it('should return 200 and cleared count when items existed', async () => {
      WishlistModel.clearWishlistByID.mockResolvedValue(5); // 5 items deleted

      const response = await request(app).delete('/wishlist');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Wishlist cleared successfully');
      expect(response.body.deleted).toBe(5);
      expect(WishlistModel.clearWishlistByID).toHaveBeenCalledWith(1);
    });

    it('should return 200 and "already empty" message when no items existed', async () => {
      WishlistModel.clearWishlistByID.mockResolvedValue(0);

      const response = await request(app).delete('/wishlist');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Wishlist already empty');
    });
  });
});
