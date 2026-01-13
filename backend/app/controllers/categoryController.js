// controllers/categoryController.js

import { db } from '../config/db.js';
import logger from '../../utils/logger.js';

//------------------------------------------------------
// GET /api/categories
//------------------------------------------------------
export const getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category_id, name FROM categories ORDER BY category_id'
    );

    logger.info('Fetched categories', {
      count: rows.length,
    });

    res.json(rows);
  } catch (err) {
    logger.error('Error fetching categories', {
      error: err,
    });

    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

//------------------------------------------------------
// POST /api/categories
//------------------------------------------------------
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      logger.warn('Create category failed: missing name');

      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();

    const [existing] = await db.query(
      'SELECT COUNT(*) AS count FROM categories WHERE name = ?',
      [trimmed]
    );

    if (existing[0].count > 0) {
      logger.warn('Create category conflict: name already exists', {
        name: trimmed,
      });

      return res
        .status(409)
        .json({ error: 'A category with this name already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name) VALUES (?)',
      [trimmed]
    );

    logger.info('Category created', {
      categoryId: result.insertId,
      name: trimmed,
    });

    res.status(201).json({
      category_id: result.insertId,
      name: trimmed,
    });
  } catch (err) {
    logger.error('Error creating category', {
      name: req.body?.name ?? null,
      error: err,
    });

    res.status(500).json({ error: 'Failed to create category.' });
  }
};

//------------------------------------------------------
// PUT /api/categories/:id
//------------------------------------------------------
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      logger.warn('Update category failed: missing name', { categoryId: id });

      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();

    const [rows] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [id]
    );

    if (rows.length === 0) {
      logger.warn('Update category failed: not found', {
        categoryId: id,
      });

      return res.status(404).json({ error: 'Category not found.' });
    }

    const [existing] = await db.query(
      'SELECT COUNT(*) AS count FROM categories WHERE name = ? AND category_id <> ?',
      [trimmed, id]
    );

    if (existing[0].count > 0) {
      logger.warn('Update category conflict: duplicate name', {
        categoryId: id,
        name: trimmed,
      });

      return res
        .status(409)
        .json({ error: 'A category with this name already exists.' });
    }

    await db.query('UPDATE categories SET name = ? WHERE category_id = ?', [
      trimmed,
      id,
    ]);

    logger.info('Category updated', {
      categoryId: id,
      name: trimmed,
    });

    res.json({ message: 'Category updated successfully.' });
  } catch (err) {
    logger.error('Error updating category', {
      categoryId: req.params?.id ?? null,
      name: req.body?.name ?? null,
      error: err,
    });

    res.status(500).json({ error: 'Failed to update category.' });
  }
};

//------------------------------------------------------
// DELETE /api/categories/:id
//------------------------------------------------------
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [id]
    );

    if (rows.length === 0) {
      logger.warn('Delete category failed: not found', {
        categoryId: id,
      });

      return res.status(404).json({ error: 'Category not found.' });
    }

    const [used] = await db.query(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
      [id]
    );

    if (used[0].count > 0) {
      logger.warn('Delete category blocked: category in use', {
        categoryId: id,
        productCount: used[0].count,
      });

      return res.status(400).json({
        error:
          'Cannot delete category: there are products assigned to this category.',
        productCount: used[0].count,
      });
    }

    await db.query('DELETE FROM categories WHERE category_id = ?', [id]);

    logger.info('Category deleted', {
      categoryId: id,
    });

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    logger.error('Error deleting category', {
      categoryId: req.params?.id ?? null,
      error: err,
    });

    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

//------------------------------------------------------
// PUT /api/categories/:id/reassign
//------------------------------------------------------
export const reassignAndDeleteCategory = async (req, res) => {
  const { id } = req.params;
  const { targetCategoryId } = req.body;

  if (!targetCategoryId) {
    logger.warn('Reassign category failed: missing targetCategoryId', {
      categoryId: id,
    });

    return res.status(400).json({ error: 'Target category is required.' });
  }

  try {
    const [target] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [targetCategoryId]
    );

    if (target.length === 0) {
      logger.warn('Reassign category failed: target not found', {
        categoryId: id,
        targetCategoryId,
      });

      return res.status(404).json({ error: 'Target category does not exist.' });
    }

    await db.query(
      'UPDATE products SET category_id = ? WHERE category_id = ?',
      [targetCategoryId, id]
    );

    await db.query('DELETE FROM categories WHERE category_id = ?', [id]);

    logger.info('Category reassigned and deleted', {
      fromCategoryId: id,
      toCategoryId: targetCategoryId,
    });

    res.json({ message: 'Products reassigned and category deleted.' });
  } catch (err) {
    logger.error('Error reassigning and deleting category', {
      categoryId: req.params?.id ?? null,
      targetCategoryId: req.body?.targetCategoryId ?? null,
      error: err,
    });

    res.status(500).json({ error: 'Failed to reassign and delete category.' });
  }
};
