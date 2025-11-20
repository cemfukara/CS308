// backend/app/middlewares/validationMiddleware.js

import { body, validationResult } from 'express-validator';

// 1. Validation Rules for Product Input
export const validateProductInput = [
    // Check if 'name' is present and is a non-empty string
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required.')
        .isLength({ min: 3, max: 255 }).withMessage('Name must be between 3 and 255 characters.'),

    // Check if 'description' is present and is a string
    body('description')
        .optional({ checkFalsy: true }) // Allow it to be missing or empty if we update with other fields
        .isString().withMessage('Description must be text.')
        .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters.'),

    // Check if 'price' is a number, is required, and is positive
    body('price')
        .notEmpty().withMessage('Price is required.')
        .isFloat({ gt: 0 }).withMessage('Price must be a positive number.'),

    // Check if 'stock' is required, is an integer, and is non-negative
    body('stock')
        .notEmpty().withMessage('Stock quantity is required.')
        .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),

    // Check if 'category_id' is required and is an integer
    body('category_id')
        .notEmpty().withMessage('Category ID is required.')
        .isInt().withMessage('Category ID must be an integer.'),

    // 'popularity' can be optional, but if present, must be an integer
    body('popularity')
        .optional({ checkFalsy: true })
        .isInt({ min: 0 }).withMessage('Popularity must be a non-negative integer.'),

    // Run the error handler
    (req, res, next) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            // Return a structured 400 Bad Request response
            return res.status(400).json({ 
                status: 'error',
                message: 'Validation failed.',
                errors: errors.array().map(err => ({
                    field: err.path, // In newer express-validator versions, use .path instead of .param
                    message: err.msg
                }))
            });
        }
        next(); // If validation passes, move to the next middleware (the controller)
    }
];