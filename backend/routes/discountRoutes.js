import express from 'express';
import { setDiscount } from '../app/controllers/discountController.js';
import { authenticate, authorizeRoles } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

// Sales Manager: Apply discount to a product
// POST /api/discount/apply
router.post('/apply', authenticate, authorizeRoles("sales manager"), setDiscount);

export default router;