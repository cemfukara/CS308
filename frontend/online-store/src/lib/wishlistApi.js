// src/api/wishlistApi.js
import { api } from './api';

// Get current user's wishlist (array of product objects)
export const fetchWishlist = async () => {
  const data = await api.get('/wishlist'); // backend: { wishlist: [ products ] }
  return data.wishlist || [];
};

// Add product to wishlist
export const addToWishlist = async product_id => {
  const payload = { product_id };
  const data = await api.post('/wishlist', payload);
  // backend: { message, wishlist: { id, product_id } }
  return data.wishlist;
};

// Remove a product from wishlist
export const removeFromWishlist = async product_id => {
  // backend: { message: 'product_id:X is removed from wishlist' }
  return api.del(`/wishlist/${product_id}`);
};

// Clear all wishlist items
export const clearWishlist = async () => {
  // backend: { message, deleted }
  return api.del('/wishlist');
};
