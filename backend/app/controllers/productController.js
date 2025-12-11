// backend/app/controllers/productController.js
// This file handles product-related logic such as listing, creating, or updating products.
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  applyDiscount,
} from '../../models/Product.js';

import { getWishlistedUsers } from '../../models/Wishlist.js';

import { notifyUsers } from '../../models/Notification.js';

// --- ENHANCED: fetchProducts (Handles GET /api/products) ---
export async function fetchProducts(req, res) {
  try {
    // Extract query parameters for sorting, pagination, search, and category
    const { page, limit, sortBy, sortOrder, search, category } = req.query;

    // Call the enhanced model function
    const data = await getAllProducts({
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
      search: search,
      category: category,
    });

    // The model now returns an object with products, totalCount, etc.
    res.status(200).json(data);
  } catch (err) {
    // Use your consistent error handling utility if you have one
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- NEW: fetchProductDetails (Handles GET /api/products/:id) ---
export async function fetchProductDetails(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      // Consistent 404 response
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/*
---------------------------------------------------
---------------Sales Manager Controllers-----------
---------------------------------------------------
*/

export async function setDiscount(req, res, next) {
  try {
    const { productId, discountRate } = req.body;

    if (!productId || isNaN(discountRate)) {
      return res
        .status(400)
        .json({ message: 'productId and discountRate are required' });
    }

    // 1) Update product price
    const updatedProduct = await applyDiscount(productId, discountRate);

    // 2) Find impacted users
    const wishlistedUsers = await getWishlistedUsers(productId);

    // 3) Notify them
    await notifyUsers(wishlistedUsers, productId, discountRate);

    return res.json({
      message: 'Discount applied & users notified',
      product: updatedProduct,
      notifiedUsers: wishlistedUsers.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/*
---------------------------------------------------
---------------Product Manager Controllers---------
---------------------------------------------------
*/

// --- NEW: createProduct (Handles POST /api/products - Admin) ---
export async function addProduct(req, res) {
  try {
    // Note: Validation should ideally run before this (Story 3)
    const productData = req.body;
    const newProductId = await createProduct(productData);

    // Respond with the ID of the newly created resource
    res.status(201).json({
      message: 'Product created successfully',
      id: newProductId,
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- NEW: updateProduct (Handles PUT /api/products/:id - Admin) ---
export async function updateProductDetails(req, res) {
  try {
    const { id } = req.params;
    const productData = req.body; // Data to update

    const affectedRows = await updateProduct(id, productData);

    if (affectedRows === 0) {
      // Check if product exists before updating
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      // If product found but 0 rows affected, likely nothing changed
      return res
        .status(200)
        .json({ message: 'Product updated successfully (no changes made)' });
    }

    res.status(200).json({
      message: 'Product updated successfully',
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- NEW: deleteProduct (Handles DELETE /api/products/:id - Admin) ---
export async function removeProduct(req, res) {
  try {
    const { id } = req.params;
    const affectedRows = await deleteProduct(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
