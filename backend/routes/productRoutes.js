// Defines product-related routes (/api/products, /api/products/:id).
import express from 'express';
import { fetchProducts } from '../app/controllers/productController.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', fetchProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
    // TODO: implement fetch product details
    res.status(501).json({
        message: 'Get product details not implemented yet',
    });
});

/**
 * @route   POST /api/products
 * @desc    Add a new product
 * @access  Private/Admin
 */
router.post('/', (req, res) => {
    // TODO: implement add new product
    res.status(501).json({ message: 'Add product not implemented yet' });
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product by ID
 * @access  Private/Admin
 */
router.put('/:id', (req, res) => {
    // TODO: implement update product
    res.status(501).json({ message: 'Update product not implemented yet' });
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product by ID
 * @access  Private/Admin
 */
router.delete('/:id', (req, res) => {
    // TODO: implement delete product
    res.status(501).json({ message: 'Delete product not implemented yet' });
});

export default router;
