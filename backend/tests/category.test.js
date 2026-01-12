import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app/app.js'; // Ensure app.js is exported correctly
import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

// 1. Mock the DB Module
// We mock the 'query' function to return different results for each test
vi.mock('../app/config/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '../app/config/db.js';

describe('Category Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: getAllCategories
  it('GET /api/categories - should return all categories', async () => {
    const mockCategories = [
      { category_id: 1, name: 'Laptops' },
      { category_id: 2, name: 'Phones' },
    ];
    db.query.mockResolvedValue([mockCategories]);

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockCategories);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT category_id, name FROM categories')
    );
  });

  // Test 2: createCategory
  it('POST /api/categories - should create a new category', async () => {
    // Mock check for existing (count=0) and insert (insertId=5)
    db.query
      .mockResolvedValueOnce([[{ count: 0 }]]) // 1st call: check existence
      .mockResolvedValueOnce([{ insertId: 5 }]); // 2nd call: insert

    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Tablets' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ category_id: 5, name: 'Tablets' });
  });

  // Test 3: updateCategory
  it('PUT /api/categories/:id - should update category', async () => {
    // 1. Check ID exists
    db.query.mockResolvedValueOnce([[{ category_id: 1 }]]);
    // 2. Check name uniqueness
    db.query.mockResolvedValueOnce([[{ count: 0 }]]);
    // 3. Perform update
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/categories/1')
      .send({ name: 'Gaming Laptops' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  // Test 4: deleteCategory
  it('DELETE /api/categories/:id - should delete category if unused', async () => {
    // 1. Check ID exists
    db.query.mockResolvedValueOnce([[{ category_id: 1 }]]);
    // 2. Check product usage (count=0)
    db.query.mockResolvedValueOnce([[{ count: 0 }]]);
    // 3. Perform delete
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).delete('/api/categories/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // Test 5: reassignAndDeleteCategory
  it('PUT /api/categories/:id/reassign - should reassign products and delete', async () => {
    // 1. Check target category exists
    db.query.mockResolvedValueOnce([[{ category_id: 2 }]]);
    // 2. Update products
    db.query.mockResolvedValueOnce([{ affectedRows: 5 }]);
    // 3. Delete old category
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/categories/1/reassign')
      .send({ targetCategoryId: 2 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reassigned/i);
  });
});
