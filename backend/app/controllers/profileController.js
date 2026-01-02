// backend/app/controllers/profileController.js
// Controllers for profile update and account deletion with email verification

import bcrypt from 'bcryptjs';
import { encrypt } from '../../utils/encrypter.js';
import {
  sendVerificationEmail,
  sendAccountDeletionEmail,
} from '../../utils/emailService.js';
import { findById, updateUserProfile, deleteUser } from '../../models/User.js';
import {
  generateCode,
  createVerificationCode,
  findValidCode,
  markCodeAsUsed,
  invalidatePendingCodes,
} from '../../models/VerificationCode.js';

/**
 * Request profile update - validates data and sends verification email
 * POST /api/users/profile/request-update
 */
export const requestProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, email, phone, tax_id, password } = req.body;

    // Validate that at least one field is provided
    if (!first_name && !last_name && !email && !phone && !tax_id && !password) {
      return res.status(400).json({
        message: 'At least one field must be provided for update',
      });
    }

    // Email format validation if email is being updated
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Get current user data
    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare pending data (store what will be updated)
    const pendingData = {};
    if (first_name) pendingData.first_name = first_name;
    if (last_name) pendingData.last_name = last_name;
    if (email) pendingData.email = email;
    if (phone) pendingData.phone = phone;
    if (tax_id) pendingData.tax_id = tax_id;
    if (password) {
      // Hash the new password
      const password_hash = await bcrypt.hash(password, 10);
      pendingData.password_hash = password_hash;
    }

    // Generate verification code
    const code = generateCode();

    // Invalidate any existing pending profile update codes
    await invalidatePendingCodes(userId, 'profile_update');

    // Store verification code with pending data
    await createVerificationCode(userId, code, 'profile_update', pendingData);

    // Send verification email
    await sendVerificationEmail(
      user.email, // Send to current email
      code,
      user.first_name || 'User'
    );

    res.json({
      message: 'Verification code sent to your email',
      email: user.email,
    });
  } catch (error) {
    console.error('requestProfileUpdate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Confirm profile update - verifies code and updates profile
 * POST /api/users/profile/confirm-update
 */
export const confirmProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Find valid verification code
    const verification = await findValidCode(userId, code, 'profile_update');

    if (!verification) {
      return res.status(400).json({
        message: 'Invalid or expired verification code',
      });
    }

    // Get pending data
    const pendingData = verification.pending_data;
    if (!pendingData) {
      return res.status(400).json({ message: 'No pending update found' });
    }

    // Prepare update fields with encryption where needed
    const updateFields = {};

    if (pendingData.first_name) {
      updateFields.first_name_encrypted = encrypt(pendingData.first_name);
    }
    if (pendingData.last_name) {
      updateFields.last_name_encrypted = encrypt(pendingData.last_name);
    }
    if (pendingData.email) {
      updateFields.email = pendingData.email;
    }
    if (pendingData.phone) {
      updateFields.phone_encrypted = encrypt(pendingData.phone);
    }
    if (pendingData.tax_id) {
      updateFields.tax_id_encrypted = encrypt(pendingData.tax_id);
    }
    if (pendingData.password_hash) {
      updateFields.password_hash = pendingData.password_hash;
    }

    // Update user profile
    const success = await updateUserProfile(userId, updateFields);

    if (!success) {
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    // Mark verification code as used
    await markCodeAsUsed(verification.code_id);

    // If email was updated, issue new JWT token
    if (pendingData.email) {
      const { generateAccessToken } = await import(
        '../../utils/generateToken.js'
      );
      const token = generateAccessToken({
        user_id: userId,
        email: pendingData.email,
        role: req.user.role,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1 hour
      });
    }

    res.json({
      message: 'Profile updated successfully',
      updated: Object.keys(pendingData),
    });
  } catch (error) {
    console.error('confirmProfileUpdate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Request account deletion - sends verification email
 * POST /api/users/account/request-deletion
 */
export const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get user data
    const user = await findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate verification code
    const code = generateCode();

    // Invalidate any existing pending deletion codes
    await invalidatePendingCodes(userId, 'account_deletion');

    // Store verification code
    await createVerificationCode(userId, code, 'account_deletion');

    // Send deletion confirmation email
    await sendAccountDeletionEmail(
      user.email,
      code,
      user.first_name || 'User'
    );

    res.json({
      message:
        'Account deletion verification code sent to your email. This action is irreversible.',
      email: user.email,
    });
  } catch (error) {
    console.error('requestAccountDeletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Confirm account deletion - verifies code and deletes account
 * POST /api/users/account/confirm-deletion
 */
export const confirmAccountDeletion = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Find valid verification code
    const verification = await findValidCode(userId, code, 'account_deletion');

    if (!verification) {
      return res.status(400).json({
        message: 'Invalid or expired verification code',
      });
    }

    // Mark code as used
    await markCodeAsUsed(verification.code_id);

    // Delete user account (this will cascade delete related data due to foreign keys)
    const success = await deleteUser(userId);

    if (!success) {
      return res.status(500).json({ message: 'Failed to delete account' });
    }

    // Clear authentication cookie
    res.clearCookie('token');

    res.json({
      message:
        'Account deleted successfully. All your data has been permanently removed.',
    });
  } catch (error) {
    console.error('confirmAccountDeletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
