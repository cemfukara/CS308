// backend/models/VerificationCode.js
// This model file defines DB operations for the verification_codes table.

import { db } from '../app/config/db.js';

/**
 * Generate a random 6-digit code
 * @returns {string} 6-digit code
 */
export const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a new verification code
 * @param {number} userId - User ID
 * @param {string} code - 6-digit verification code
 * @param {string} purpose - 'profile_update' or 'account_deletion'
 * @param {object} pendingData - Data to store (will be JSON stringified)
 * @param {number} expiresInMinutes - Expiration time in minutes (default: 15)
 * @returns {number} Insert ID
 */
export const createVerificationCode = async (
  userId,
  code,
  purpose,
  pendingData = null,
  expiresInMinutes = 15
) => {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const pendingDataStr = pendingData ? JSON.stringify(pendingData) : null;

  const [result] = await db.query(
    `INSERT INTO verification_codes 
    (user_id, code, purpose, pending_data, expires_at) 
    VALUES (?, ?, ?, ?, ?)`,
    [userId, code, purpose, pendingDataStr, expiresAt]
  );

  return result.insertId;
};

/**
 * Find a valid verification code
 * @param {number} userId - User ID
 * @param {string} code - 6-digit code
 * @param {string} purpose - Purpose of the code
 * @returns {object|null} Verification code record or null
 */
export const findValidCode = async (userId, code, purpose) => {
  const [rows] = await db.query(
    `SELECT * FROM verification_codes 
    WHERE user_id = ? 
    AND code = ? 
    AND purpose = ? 
    AND is_used = FALSE 
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId, code, purpose]
  );

  const record = rows[0] || null;
  if (record && record.pending_data) {
    try {
      record.pending_data = JSON.parse(record.pending_data);
    } catch (e) {
      record.pending_data = null;
    }
  }

  return record;
};

/**
 * Mark a verification code as used
 * @param {number} codeId - Code ID
 * @returns {boolean} Success
 */
export const markCodeAsUsed = async (codeId) => {
  const [result] = await db.query(
    `UPDATE verification_codes 
    SET is_used = TRUE 
    WHERE code_id = ?`,
    [codeId]
  );

  return result.affectedRows > 0;
};

/**
 * Delete all expired or used codes for a user
 * @param {number} userId - User ID
 * @returns {number} Number of deleted rows
 */
export const cleanupOldCodes = async (userId) => {
  const [result] = await db.query(
    `DELETE FROM verification_codes 
    WHERE user_id = ? 
    AND (is_used = TRUE OR expires_at < NOW())`,
    [userId]
  );

  return result.affectedRows;
};

/**
 * Invalidate all pending codes for a user and purpose
 * @param {number} userId - User ID
 * @param {string} purpose - Purpose to invalidate
 * @returns {number} Number of affected rows
 */
export const invalidatePendingCodes = async (userId, purpose) => {
  const [result] = await db.query(
    `UPDATE verification_codes 
    SET is_used = TRUE 
    WHERE user_id = ? 
    AND purpose = ? 
    AND is_used = FALSE`,
    [userId, purpose]
  );

  return result.affectedRows;
};
