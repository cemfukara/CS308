// Wishlist related routes

import express from 'express';
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
} from '../app/controllers/wishlistController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticate, getWishlist);

router.post('/', authenticate, addWishlistItem);

router.delete('/:product_id', authenticate, removeWishlistItem);

router.delete('/', authenticate, clearWishlist);

export default router;
