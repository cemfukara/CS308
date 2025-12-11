// Tests for authentication and role-based access control.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Import Middleware to Test
import {
  authenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';

// 1. Mock dependencies
// We mock 'jsonwebtoken' to control token verification results
vi.mock('jsonwebtoken');

// We mock User model (used in dev mode bypass logic, though we mostly test standard logic here)
import * as UserModel from '../models/User.js';
vi.mock('../models/User.js');

// 2. Setup Express App
const app = express();
app.use(express.json());
app.use(cookieParser()); // Middleware reads from req.cookies

// 3. Define Test Routes
// Route 1: Authentication only
app.get('/test/auth', authenticate, (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.user });
});

// Route 2: Role Authorization (Product Manager only)
app.get(
  '/test/pm-only',
  authenticate,
  authorizeRoles(['product manager']),
  (req, res) => {
    res.status(200).json({ message: 'Authorized as PM' });
  }
);

// Route 3: Role Authorization (Multiple roles)
app.get(
  '/test/staff',
  authenticate,
  authorizeRoles(['product manager', 'sales manager']),
  (req, res) => {
    res.status(200).json({ message: 'Authorized as Staff' });
  }
);

// --- Test Data ---
const mockUserPayload = {
  user_id: 1,
  email: 'user@test.com',
  role: 'customer',
};

const mockPmPayload = {
  user_id: 2,
  email: 'pm@test.com',
  role: 'product manager',
};

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    // Reset env vars to ensure we test standard auth (not dev bypass)
    process.env.AUTH_DISABLED = 'false';
    process.env.JWT_SECRET = 'testsecret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==================================================================
  // AUTHENTICATE MIDDLEWARE
  // ==================================================================
  describe('authenticate()', () => {
    it('should return 401 if no token is provided', async () => {
      const response = await request(app).get('/test/auth');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/No token provided/);
    });

    it('should return 401 if token is invalid', async () => {
      // Mock jwt.verify to throw error
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/test/auth')
        .set('Cookie', ['token=invalid_token_string']);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Invalid or expired token/);
    });

    it('should call next() and attach user if token is valid', async () => {
      // Mock jwt.verify to return payload
      jwt.verify.mockReturnValue(mockUserPayload);

      const response = await request(app)
        .get('/test/auth')
        .set('Cookie', ['token=valid_token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authenticated');
      expect(response.body.user).toEqual(mockUserPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'testsecret');
    });
  });

  // ==================================================================
  // AUTHORIZE ROLES MIDDLEWARE
  // ==================================================================
  describe('authorizeRoles()', () => {
    it('should return 403 if user has wrong role', async () => {
      // 1. Authenticate as 'customer'
      jwt.verify.mockReturnValue(mockUserPayload); // role: customer

      // 2. Try to access PM route
      const response = await request(app)
        .get('/test/pm-only')
        .set('Cookie', ['token=valid_token']);

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Access denied/);
    });

    it('should return 200 if user has correct role', async () => {
      // 1. Authenticate as 'product manager'
      jwt.verify.mockReturnValue(mockPmPayload); // role: product manager

      // 2. Try to access PM route
      const response = await request(app)
        .get('/test/pm-only')
        .set('Cookie', ['token=valid_token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authorized as PM');
    });

    it('should return 200 if user has one of multiple allowed roles', async () => {
      // 1. Authenticate as 'product manager'
      jwt.verify.mockReturnValue(mockPmPayload);

      // 2. Try to access Staff route (allows PM or Sales)
      const response = await request(app)
        .get('/test/staff')
        .set('Cookie', ['token=valid_token']);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Authorized as Staff');
    });

    it('should return 401 if req.user is missing (Auth middleware failed or skipped)', async () => {
        // This simulates a scenario where authorizeRoles is called but user isn't set
        // We create a specific route for this test case bypassing 'authenticate'
        const appNoAuth = express();
        appNoAuth.get('/test/no-user', authorizeRoles(['admin']), (req, res) => res.send('OK'));

        const response = await request(appNoAuth).get('/test/no-user');
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Unauthorized');
    });
  });

  // ==================================================================
  // DEV BYPASS MODE (Optional Coverage)
  // ==================================================================
  describe('Dev Mode Bypass', () => {
    it('should bypass auth if AUTH_DISABLED=true in development', async () => {
      process.env.AUTH_DISABLED = 'true';
      process.env.NODE_ENV = 'development';

      // Mock finding the dev user
      const mockDevUser = {
        user_id: 0,
        first_name: 'Dev',
        email: 'dev@local',
        role: 'dev',
      };
      UserModel.findById.mockResolvedValue(mockDevUser);

      // No cookie sent
      const response = await request(app).get('/test/auth');

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('dev');
      expect(response.body.user.user_id).toBe(0);
    });
  });
});