// backend/app/controllers/productController.js
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  applyDiscount,
  getFeaturedProduct,
} from '../../models/Product.js';

import { getWishlistedUsers } from '../../models/Wishlist.js';

// IMPORTANT: Import BOTH email functions
import { 
  sendStockNotificationEmail, 
  sendDiscountNotificationEmail 
} from '../../utils/emailService.js';

// --- fetchProducts (Handles GET /api/products) ---
export async function fetchProducts(req, res) {
  try {
    const { page, limit, sortBy, sortOrder, search, category } = req.query;

    const data = await getAllProducts({
      page: page,
      limit: limit,
      sortBy: sortBy,
      sortOrder: sortOrder,
      search: search,
      category: category,
    });

    res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper to notify all users who have a specific product in their wishlist
 */
async function notifyWishlistUsers(productId, type, data) {
  try {
    // 1. Fetch emails (returns array of strings e.g., ['user@example.com'])
    const emails = await getWishlistedUsers(productId);

    if (!emails || emails.length === 0) {
      return;
    }

    console.log(`Sending ${type} notifications to ${emails.length} users for product ${productId}`);

    // 2. Send emails
    const emailPromises = emails.map(email => {
      // Ensure email is valid before attempting to send
      if (!email) return Promise.resolve();

      if (type === 'stock') {
        return sendStockNotificationEmail(email, data.productName);
      } else if (type === 'discount') {
        return sendDiscountNotificationEmail(email, data.productName, data.discountRate);
      }
    });

    await Promise.all(emailPromises);
    console.log(`${type} notifications sent successfully.`);
    
  } catch (err) {
    // This log will reveal if an import is missing or data is wrong
    console.error(`ERROR: Failed to send wishlist notifications for product ${productId}:`, err);
  }
}

// fetchProductDetails (Handles GET /api/products/:id)
export async function fetchProductDetails(req, res) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// fetchFeaturedProduct (GET /api/products/featured)
export async function fetchFeaturedProduct(req, res) {
  try {
    const product = await getFeaturedProduct();

    if (!product) {
      return res.status(404).json({ message: 'No discounted product found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching featured product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/*
---------------------------------------------------
---------------Sales Manager Controllers-----------
---------------------------------------------------
*/

export async function setDiscount(req, res) {
  try {
    const { productId, discountRate } = req.body;

    if (!productId || discountRate === undefined) {
      return res.status(400).json({ message: 'productId and discountRate are required' });
    }

    // Fetch product name before update for the email
    const product = await getProductById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const updatedProduct = await applyDiscount(productId, discountRate);

    // Trigger notification: Only if discount is > 0
    // Coerce discountRate to number to ensure safe comparison
    if (Number(discountRate) > 0) {
      // Run in background (do not await) to keep API fast
      notifyWishlistUsers(productId, 'discount', { 
        productName: product.name, 
        discountRate: discountRate 
      });
    }

    return res.json({
      message: 'Discount applied',
      product: updatedProduct
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

// --- createProduct (Handles POST /api/products - Admin) ---
export async function addProduct(req, res) {
  try {
    const productData = req.body;
    const newProductId = await createProduct(productData);

    res.status(201).json({
      message: 'Product created successfully',
      id: newProductId,
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// updateProductDetails (Handles PUT /api/products/:id - Admin)
export async function updateProductDetails(req, res) {
  try {
    const { id } = req.params;
    const productData = req.body;

    // 1. Get current state to check stock transition
    const oldProduct = await getProductById(id);
    if (!oldProduct) return res.status(404).json({ message: 'Product not found' });

    const affectedRows = await updateProduct(id, productData);

    if (affectedRows > 0) {
      // 2. Check Trigger: Stock went from 0 to Positive
      const oldStock = parseInt(oldProduct.quantity_in_stock || 0);
      
      // Ensure we allow 0 as a valid number, but check if property exists in update
      if (productData.quantity_in_stock !== undefined) {
        const newStock = parseInt(productData.quantity_in_stock);

        if (oldStock === 0 && newStock > 0) {
          // Run in background
          notifyWishlistUsers(id, 'stock', { productName: oldProduct.name });
        }
      }
    }

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// --- removeProduct (Handles DELETE /api/products/:id - Admin) ---
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