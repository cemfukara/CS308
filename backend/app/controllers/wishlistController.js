// wishlist Controllers

import {
  getWishlistByUserId,
  addToWishlist,
  deleteFromWishlist,
  clearWishlistByID,
} from '../../models/Wishlist.js';
import { getProductById } from '../../models/Product.js';

export const getWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlistByUserId(req.user.user_id);

    // Promise.all() => runs multiple async operations in parallel
    // Get product details for each product ID in the wishlist
    const products = await Promise.all(
      wishlist.map((id) => getProductById(id))
    );

    res.status(200).json({ wishlist: products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addWishlistItem = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { product_id } = req.body;

    // Product validation
    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({ message: 'Invalid product_id' });
    }

    const product = await getProductById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // check for duplicates
    const wishlistIds = await getWishlistByUserId(userId);
    if (wishlistIds.includes(Number(product_id))) {
      return res.status(409).json({ message: 'Product already in wishlist' });
    }

    // Insert into wishlist
    const wishlist_id = await addToWishlist(userId, product_id);

    // Respond with wishlist item details
    res.status(201).json({
      message: 'Product added to wishlist',
      wishlist: {
        id: wishlist_id,
        product_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    if (!id || isNaN(id)) {
      console.log(id);
      return res.status(400).json({ message: 'Invalid id' });
    }

    // Remove and get affected rows
    const deleted = await deleteFromWishlist(userId, id);

    // If no rows affected
    if (deleted === 0) {
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    // If deleted successfully
    res
      .status(200)
      .json({ message: `product_id:${id} is removed from wishlist` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const deletedCount = await clearWishlistByID(userId);

    // If no item do delete
    if (deletedCount === 0) {
      return res.status(200).json({
        message: 'Wishlist already empty',
      });
    }

    res.status(200).json({
      message: 'Wishlist cleared successfully',
      deleted: deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
