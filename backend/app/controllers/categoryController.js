// controllers/categoryController.js
import { db } from '../config/db.js';

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT category_id, name FROM categories ORDER BY category_id'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();

    // uniqueness check
    const [existing] = await db.query(
      'SELECT COUNT(*) AS count FROM categories WHERE name = ?',
      [trimmed]
    );
    if (existing[0].count > 0) {
      return res
        .status(409)
        .json({ error: 'A category with this name already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO categories (name) VALUES (?)',
      [trimmed]
    );

    res.status(201).json({
      category_id: result.insertId,
      name: trimmed,
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmed = name.trim();

    // check category exists
    const [rows] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // uniqueness check (excluding this category)
    const [existing] = await db.query(
      'SELECT COUNT(*) AS count FROM categories WHERE name = ? AND category_id <> ?',
      [trimmed, id]
    );
    if (existing[0].count > 0) {
      return res
        .status(409)
        .json({ error: 'A category with this name already exists.' });
    }

    await db.query('UPDATE categories SET name = ? WHERE category_id = ?', [
      trimmed,
      id,
    ]);

    res.json({ message: 'Category updated successfully.' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // check category exists
    const [rows] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // ❌ prevent delete if products use it
    const [used] = await db.query(
      'SELECT COUNT(*) AS count FROM products WHERE category_id = ?',
      [id]
    );

    if (used[0].count > 0) {
      return res.status(400).json({
        error:
          'Cannot delete category: there are products assigned to this category.',
        productCount: used[0].count,
      });
    }

    await db.query('DELETE FROM categories WHERE category_id = ?', [id]);

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
};

// PUT /api/categories/:id/reassign
export const reassignAndDeleteCategory = async (req, res) => {
  const { id } = req.params;
  const { targetCategoryId } = req.body;

  if (!targetCategoryId) {
    return res.status(400).json({ error: 'Target category is required.' });
  }

  try {
    // ensure target category exists
    const [target] = await db.query(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [targetCategoryId]
    );

    if (target.length === 0) {
      return res.status(404).json({ error: 'Target category does not exist.' });
    }

    // reassign products
    await db.query(
      'UPDATE products SET category_id = ? WHERE category_id = ?',
      [targetCategoryId, id]
    );

    // delete category
    await db.query('DELETE FROM categories WHERE category_id = ?', [id]);

    res.json({ message: 'Products reassigned and category deleted.' });
  } catch (err) {
    console.error('Error reassigning category:', err);
    res.status(500).json({ error: 'Failed to reassign and delete category.' });
  }
};
