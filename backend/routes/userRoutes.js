// Defines user-related API routes (/register, /login, /profile, etc.).
import express from 'express';
import { login, register } from '../app/controllers/userController.js';

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/users/profile
 * @desc    Get logged-in user's profile info
 * @access  Private
 */
router.get('/profile', (req, res) => {
  // TODO: implement profile retrieval logic
  // Expected: authenticated user data
  res.status(501).json({
    message: 'Get profile endpoint not implemented yet',
  });
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update logged-in user's profile info
 * @access  Private
 */
router.patch('/profile', (req, res) => {
  // TODO: implement profile update logic
  // Expected: new name, email, password (optional)
  res.status(501).json({
    message: 'Update profile endpoint not implemented yet',
  });
});

export default router;
