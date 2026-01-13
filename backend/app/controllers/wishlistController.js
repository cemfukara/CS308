// wishlist Controllers

import {
  getWishlistByUserId,
  addToWishlist,
  deleteFromWishlist,
  clearWishlistByID,
} from '../../models/Wishlist.js';
import { getProductById } from '../../models/Product.js';

import logger from '../../utils/logger.js';

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;

    logger.info('Fetching wishlist', { userId });

    const wishlist = await getWishlistByUserId(userId);

    const products = await Promise.all(
      wishlist.map((id) => getProductById(id))
    );

    logger.info('Wishlist fetched successfully', {
      userId,
      itemCount: products.length,
    });

    res.status(200).json({ wishlist: products });
  } catch (err) {
    logger.error('Failed to fetch wishlist', {
      userId: req.user?.user_id,
      error: err,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

export const addWishlistItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.body;

    logger.info('Add wishlist item requested', {
      userId,
      product_id,
    });

    if (!product_id || isNaN(product_id)) {
      logger.warn('Invalid product_id in wishlist add', {
        userId,
        product_id,
      });
      return res.status(400).json({ message: 'Invalid product_id' });
    }

    const product = await getProductById(product_id);
    if (!product) {
      logger.warn('Product not found for wishlist add', {
        userId,
        product_id,
      });
      return res.status(404).json({ message: 'Product not found' });
    }

    const wishlistIds = await getWishlistByUserId(userId);
    if (wishlistIds.includes(Number(product_id))) {
      logger.warn('Duplicate wishlist add attempt', {
        userId,
        product_id,
      });
      return res.status(409).json({ message: 'Product already in wishlist' });
    }

    const wishlist_id = await addToWishlist(userId, product_id);

    logger.info('Product added to wishlist', {
      userId,
      product_id,
      wishlist_id,
    });

    res.status(201).json({
      message: 'Product added to wishlist',
      wishlist: {
        id: wishlist_id,
        product_id,
      },
    });
  } catch (err) {
    logger.error('Failed to add wishlist item', {
      userId: req.user?.user_id,
      product_id: req.body?.product_id,
      error: err,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    logger.info('Remove wishlist item requested', {
      userId,
      product_id: id,
    });

    if (!id || isNaN(id)) {
      logger.warn('Invalid wishlist item id for removal', {
        userId,
        id,
      });
      return res.status(400).json({ message: 'Invalid id' });
    }

    const deleted = await deleteFromWishlist(userId, id);

    if (deleted === 0) {
      logger.warn('Wishlist item not found for removal', {
        userId,
        product_id: id,
      });
      return res.status(404).json({ message: 'Item not found in wishlist' });
    }

    logger.info('Wishlist item removed successfully', {
      userId,
      product_id: id,
    });

    res
      .status(200)
      .json({ message: `product_id:${id} is removed from wishlist` });
  } catch (err) {
    logger.error('Failed to remove wishlist item', {
      userId: req.user?.user_id,
      product_id: req.params?.id,
      error: err,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.user_id;

    logger.info('Clear wishlist requested', { userId });

    const deletedCount = await clearWishlistByID(userId);

    if (deletedCount === 0) {
      logger.info('Wishlist already empty', { userId });
      return res.status(200).json({
        message: 'Wishlist already empty',
      });
    }

    logger.info('Wishlist cleared successfully', {
      userId,
      deletedCount,
    });

    res.status(200).json({
      message: 'Wishlist cleared successfully',
      deleted: deletedCount,
    });
  } catch (err) {
    logger.error('Failed to clear wishlist', {
      userId: req.user?.user_id,
      error: err,
    });
    res.status(500).json({ message: 'Server error' });
  }
};
