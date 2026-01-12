// backend/app/middlewares/validationMiddleware.js

import { body, validationResult } from 'express-validator';

// 1. Validation Rules for Product Input
export const validateProductInput = [
  // Check if 'name' is present and is a non-empty string
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ min: 3, max: 255 })
    .withMessage('Name must be between 3 and 255 characters.'),

  // Check if 'description' is present and is a string
  body('description')
    .optional({ checkFalsy: true }) // Allow it to be missing or empty if we update with other fields
    .isString()
    .withMessage('Description must be text.')
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters.'),

  // Check if 'price' is a number, is required, and is positive
  body('price')
    .notEmpty()
    .withMessage('Price is required.')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number.'),

  // Check if 'stock' is required, is an integer, and is non-negative
  body('quantity_in_stock')
    .notEmpty()
    .withMessage('Stock quantity is required.')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer.'),

  // Check if 'category_id' is required and is an integer
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required.')
    .isInt()
    .withMessage('Category ID must be an integer.'),

  // 'popularity' can be optional, but if present, must be an integer
  body('popularity')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Popularity must be a non-negative integer.'),

  // Optional field: model
  body('model')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Model must be a string.')
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters.'),

  // Optional field: serial_number
  body('serial_number')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Serial number must be a string.')
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters.'),

  // Optional field: list_price (must be >= price if provided)
  body('list_price')
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage('List price must be a positive number.')
    .custom((value, { req }) => {
      if (value && req.body.price && parseFloat(value) < parseFloat(req.body.price)) {
        throw new Error('List price must be greater than or equal to price.');
      }
      return true;
    }),
    
  // Optional field: cost (newly added)
  body('cost')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number.'),

  // Optional field: warranty_status
  body('warranty_status')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Warranty status must be a string.')
    .isLength({ max: 255 })
    .withMessage('Warranty status cannot exceed 255 characters.'),

  // Optional field: distributor_info
  body('distributor_info')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Distributor info must be a string.')
    .isLength({ max: 255 })
    .withMessage('Distributor info cannot exceed 255 characters.'),

  // Run the error handler
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Return a structured 400 Bad Request response
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors: errors.array().map((err) => ({
          field: err.path, // In newer express-validator versions, use .path instead of .param
          message: err.msg,
        })),
      });
    }
    next(); // If validation passes, move to the next middleware (the controller)
  },
];