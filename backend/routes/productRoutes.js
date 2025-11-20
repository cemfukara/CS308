// backend/routes/productRoutes.js
// Defines product-related routes (/api/products, /api/products/:id).
import express from 'express';
import { 
    fetchProducts, 
    fetchProductDetails,
    addProduct,
    updateProductDetails,
    removeProduct 
} from '../app/controllers/productController.js';

// **ASSUMPTION:** Import middleware for auth and role checks
import { isAuthenticated, isAdmin } from '../app/middlewares/authMiddleware.js'; // Adjust path if needed
import { validateProductInput } from '../app/middlewares/validationMiddleware.js';

const router = express.Router();

// --- PUBLIC ROUTES (Read Access) ---

/**
 * @route   GET /api/products
 * @desc    Get all products (with pagination, sorting, search, filter)
 * @access  Public
 */
router.get('/', fetchProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', fetchProductDetails); // Use the new controller function

// --- ADMIN ROUTES (Modification Access) ---

/**
 * @route   POST /api/products
 * @desc    Add a new product
 * @access  Private/Admin
 */
// APPLY isAuthenticated and isAdmin middleware
router.post('/', isAuthenticated, isAdmin, validateProductInput, addProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Private/Admin
 */
// Added validation middleware here
router.put('/:id', isAuthenticated, isAdmin, validateProductInput, updateProductDetails); 

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product by ID
 * @access  Private/Admin
 */
router.delete('/:id', isAuthenticated, isAdmin, removeProduct);

export default router;