// backend/routes/userRoutes.js
// Defines user-related API routes (/register, /login, /profile, etc.).

import express from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
} from '../app/controllers/userController.js';
import {
  requestProfileUpdate,
  confirmProfileUpdate,
  requestAccountDeletion,
  confirmAccountDeletion,
} from '../app/controllers/profileController.js';
import { authenticate } from '../app/middlewares/authMiddleware.js';

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
router.get('/profile', authenticate, getProfile);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update logged-in user's profile info
 * @access  Private
 */
router.patch('/profile', authenticate, updateProfile);

/**
 * @route   POST /api/users/profile/request-update
 * @desc    Request profile update with email verification
 * @access  Private
 */
router.post('/profile/request-update', authenticate, requestProfileUpdate);

/**
 * @route   POST /api/users/profile/confirm-update
 * @desc    Confirm profile update with verification code
 * @access  Private
 */
router.post('/profile/confirm-update', authenticate, confirmProfileUpdate);

/**
 * @route   POST /api/users/account/request-deletion
 * @desc    Request account deletion with email verification
 * @access  Private
 */
router.post('/account/request-deletion', authenticate, requestAccountDeletion);

/**
 * @route   POST /api/users/account/confirm-deletion
 * @desc    Confirm account deletion with verification code
 * @access  Private
 */
router.post('/account/confirm-deletion', authenticate, confirmAccountDeletion);

export default router;
