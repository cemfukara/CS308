// Defines user-related API routes (/register, /login, /profile, etc.).
import express from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
} from '../app/controllers/userController.js';
import { isAuthenticated } from '../app/middlewares/authMiddleware.js';

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
router.get('/profile', isAuthenticated, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update logged-in user's profile info
 * @access  Private
 */
router.patch('/profile', isAuthenticated, updateProfile);

export default router;
