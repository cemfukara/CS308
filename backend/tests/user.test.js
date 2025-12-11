// tests/user.test.js
import { describe, it, beforeEach, beforeAll, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app/app.js';
import * as encrypter from '../utils/encrypter.js';

// ------------------ Mock DB ------------------
vi.mock('../app/config/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '../app/config/db.js';
const mockQuery = db.query;

// ------------------ Mock bcrypt ------------------
vi.mock('bcryptjs', () => {
  return {
    default: {
      hash: vi.fn(async (password) => `hashed-${password}`),
      compare: vi.fn(async (password, hash) => password === 'password123'),
    },
  };
});
import bcrypt from 'bcryptjs';
import { authorizeRoles } from '../app/middlewares/authMiddleware.js';

// ------------------ Mock encrypter ------------------
vi.mock('../utils/encrypter.js', () => ({
  encrypt: vi.fn((text) => `encrypted-${text}`),
  decrypt: vi.fn((text) => text.replace('encrypted-', '')),
}));

// ------------------ Mock auth middleware ------------------
vi.mock('../app/middlewares/authMiddleware.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { user_id: 1, email: 'alimemo@provider.com', role: 'pm' };
    next();
  }),

  authorizeRoles: vi.fn((allowedRoles = []) => {
    return (req, res, next) => {
      next();
    };
  }),
}));

// ------------------ Tests ------------------
describe('User Route Tests (Vitest + ESM)', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
  });

  beforeEach(() => {
    mockQuery.mockReset(); // reset calls and mock implementation
  });

  it('POST /users/register - success', async () => {
    mockQuery.mockResolvedValueOnce([{ insertId: 1 }]); // createUser
    mockQuery.mockResolvedValueOnce([
      [
        {
          user_id: 1,
          email: 'alimemo@provider.com',
          first_name_encrypted: 'enc',
          last_name_encrypted: 'enc',
        },
      ],
    ]); // findByEmail

    const res = await request(app).post('/api/users/register').send({
      first_name: 'Ali Mehmet',
      last_name: 'Yılmaz',
      email: 'alimemo@provider.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.user_id).toBe(1);
    expect(res.body.user.email).toBe('alimemo@provider.com');
    expect(res.body.user.first_name).toBe('Ali Mehmet');
    expect(res.body.user.last_name).toBe('Yılmaz');
    expect(res.body.user.tax_id).toBe(null);
  });

  it('POST /users/register - missing fields', async () => {
    const res = await request(app).post('/api/users/register').send({
      email: '',
      password: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'First name, last name, email and password required'
    );
  });

  it('POST /users/login - success', async () => {
    mockQuery.mockResolvedValueOnce([
      [
        {
          user_id: 1,
          email: 'alimemo@provider.com',
          password_hash: 'hashed-password123',
        },
      ],
    ]); // findByEmail

    const res = await request(app).post('/api/users/login').send({
      email: 'alimemo@provider.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Login successful' });
  });

  it('POST /users/login - invalid credentials', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // findByEmail returns nothing

    const res = await request(app).post('/api/users/login').send({
      email: 'wrong@test.com',
      password: 'wrong',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('GET /users/profile - success', async () => {
    mockQuery.mockResolvedValueOnce([
      [
        {
          user_id: 1,
          email: 'alimemo@provider.com',
          first_name_encrypted: 'enc',
          last_name_encrypted: 'enc',
        },
      ],
    ]); // findById

    const res = await request(app)
      .get('/api/users/profile')
      .set('Cookie', ['jwt=fake']);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alimemo@provider.com');
  });

  it('GET /users/profile - user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // findById returns nothing

    const res = await request(app)
      .get('/api/users/profile')
      .set('Cookie', ['jwt=fake']);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('PATCH /users/profile - success', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 1 }]]); // findById
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // updateUserProfile

    const res = await request(app)
      .patch('/api/users/profile')
      .set('Cookie', ['jwt=fake'])
      .send({ first_name: 'NewName' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
  });

  it('PATCH /users/profile - empty body', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Cookie', ['jwt=fake'])
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No valid fields to update.');
  });

  it('PATCH /users/profile - invalid field', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .set('Cookie', ['jwt=fake'])
      .send({ invalid_field: 'value' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid field: invalid_field');
  });
});
