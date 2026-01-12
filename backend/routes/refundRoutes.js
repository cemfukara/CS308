import express from 'express';
import { authenticate } from '../app/middlewares/authMiddleware.js';
import { requestRefund } from '../app/controllers/refundController.js';

const router = express.Router();

// POST /api/refunds/request
router.post('/request', authenticate, requestRefund);

export default router;