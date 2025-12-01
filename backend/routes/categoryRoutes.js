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

// POST /api/categories
router.post('/', authenticate, createCategory);

// PUT /api/categories/:id
router.put('/:id', authenticate, updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', authenticate, deleteCategory);

// PUT /api/categories/:id/reassign
router.put('/:id/reassign', authenticate, reassignAndDeleteCategory);
export default router;
