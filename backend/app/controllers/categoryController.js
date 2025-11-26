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
