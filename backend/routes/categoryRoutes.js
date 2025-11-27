// routes/categoryRoutes.js
import express from 'express';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignAndDeleteCategory,
} from '../app/controllers/categoryController.js';

const router = express.Router();

// GET /api/categories
router.get('/', getAllCategories);

// POST /api/categories
router.post('/', createCategory);

// PUT /api/categories/:id
router.put('/:id', updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', deleteCategory);

// PUT /api/categories/:id/reassign
router.put('/:id/reassign', reassignAndDeleteCategory);
export default router;
