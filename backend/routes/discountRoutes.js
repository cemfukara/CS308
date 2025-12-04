import express from 'express';
import { setDiscount } from '../app/controllers/discountController.js';

const router = express.Router();

// Sales Manager: Apply discount to a product
// POST /api/discount/apply
router.post('/apply', setDiscount);

export default router;
