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

import logger from '../../utils/logger.js';

/**
 * Request profile update - validates data and sends verification email
 * POST /api/users/profile/request-update
 */
export const requestProfileUpdate = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, email, phone, tax_id, password } = req.body;

    logger.info('Profile update requested', {
      userId,
      fieldsProvided: Object.keys(req.body),
    });

    if (!first_name && !last_name && !email && !phone && !tax_id && !password) {
      logger.warn('Profile update request with no fields', { userId });
      return res.status(400).json({
        message: 'At least one field must be provided for update',
      });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logger.warn('Invalid email format in profile update', {
        userId,
        email,
      });
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await findById(userId);
    if (!user) {
      logger.warn('User not found for profile update', { userId });
      return res.status(404).json({ message: 'User not found' });
    }

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

    const code = generateCode();

    await invalidatePendingCodes(userId, 'profile_update');
    await createVerificationCode(userId, code, 'profile_update', pendingData);

    await sendVerificationEmail(user.email, code, user.first_name || 'User');

    logger.info('Profile update verification email sent', {
      userId,
      email: user.email,
    });

    res.json({
      message: 'Verification code sent to your email',
      email: user.email,
    });
  } catch (error) {
    logger.error('requestProfileUpdate failed', {
      userId: req.user?.user_id ?? null,
      error,
    });
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

    logger.info('Confirming profile update', { userId });

    if (!code || code.length !== 6) {
      logger.warn('Invalid profile update verification code format', {
        userId,
      });
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const verification = await findValidCode(userId, code, 'profile_update');

    if (!verification) {
      logger.warn('Invalid or expired profile update code', { userId });
      return res.status(400).json({
        message: 'Invalid or expired verification code',
      });
    }

    const pendingData = verification.pending_data;
    if (!pendingData) {
      logger.warn('No pending profile update data found', { userId });
      return res.status(400).json({ message: 'No pending update found' });
    }

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

    const success = await updateUserProfile(userId, updateFields);
    if (!success) {
      logger.error('Profile update DB operation failed', { userId });
      return res.status(500).json({ message: 'Failed to update profile' });
    }

    await markCodeAsUsed(verification.code_id);

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
        maxAge: 60 * 60 * 1000,
      });
    }

    logger.info('Profile updated successfully', {
      userId,
      updatedFields: Object.keys(pendingData),
    });

    res.json({
      message: 'Profile updated successfully',
      updated: Object.keys(pendingData),
    });
  } catch (error) {
    logger.error('confirmProfileUpdate failed', {
      userId: req.user?.user_id ?? null,
      error,
    });
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

    logger.info('Account deletion requested', { userId });

    const user = await findById(userId);
    if (!user) {
      logger.warn('User not found for account deletion request', { userId });
      return res.status(404).json({ message: 'User not found' });
    }

    const code = generateCode();

    await invalidatePendingCodes(userId, 'account_deletion');
    await createVerificationCode(userId, code, 'account_deletion');

    await sendAccountDeletionEmail(user.email, code, user.first_name || 'User');

    logger.info('Account deletion verification email sent', {
      userId,
      email: user.email,
    });

    res.json({
      message:
        'Account deletion verification code sent to your email. This action is irreversible.',
      email: user.email,
    });
  } catch (error) {
    logger.error('requestAccountDeletion failed', {
      userId: req.user?.user_id ?? null,
      error,
    });
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

    logger.info('Confirming account deletion', { userId });

    if (!code || code.length !== 6) {
      logger.warn('Invalid account deletion code format', { userId });
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const verification = await findValidCode(userId, code, 'account_deletion');

    if (!verification) {
      logger.warn('Invalid or expired account deletion code', { userId });
      return res.status(400).json({
        message: 'Invalid or expired verification code',
      });
    }

    await markCodeAsUsed(verification.code_id);

    const success = await deleteUser(userId);
    if (!success) {
      logger.error('Account deletion DB operation failed', { userId });
      return res.status(500).json({ message: 'Failed to delete account' });
    }

    res.clearCookie('token');

    logger.info('Account deleted successfully', { userId });

    res.json({
      message:
        'Account deleted successfully. All your data has been permanently removed.',
    });
  } catch (error) {
    logger.error('confirmAccountDeletion failed', {
      userId: req.user?.user_id ?? null,
      error,
    });
    res.status(500).json({ message: 'Server error' });
  }
};
