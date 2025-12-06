// routes/categoryRoutes.js
import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignAndDeleteCategory,
} from '../app/controllers/categoryController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/categories
router.get('/', getAllCategories);

export default router;
