// backend/routes/paymentRoutes.js
// Defines routes for payment validation

import express from 'express';
import { validatePayment } from '../app/controllers/paymentController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/payment/validate
 * @desc    Validate payment information before order creation
 * @access  Private
 */
router.post('/validate', authenticate, validatePayment);

export default router;
