// backend/models/User.js
// This model file defines DB operations for the users table.

import { encrypt, decrypt } from '../utils/encrypter.js';
import { db } from '../app/config/db.js';

// Find user by email
export const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Create user. Takes firstName, lastName, email, hashed password, optional taxId
export const createUser = async (
  firstName,
  lastName,
  email,
  password_hash,
  taxId
) => {
  const firstNameEnc = encrypt(firstName);
  const lastNameEnc = encrypt(lastName);
  const taxEnc = taxId ? encrypt(taxId) : null;

  const [result] = await db.query(
    `INSERT INTO users (
      email,
      password_hash,
      first_name_encrypted,
      last_name_encrypted,
      tax_id_encrypted
    ) VALUES (?, ?, ?, ?, ?)`,
    [email, password_hash, firstNameEnc, lastNameEnc, taxEnc]
  );

  return result[0].user_id;
};

// Return user info by id (with decrypted fields)
export const findById = async (user_id) => {
  try {
    const [rows] = await db.query(`SELECT * FROM users WHERE user_id = ?`, [
      user_id,
    ]);
    const user = rows[0] || null;
    if (!user) return null;

    // Decrypt sensitive fields, they can be null
    user.first_name = user.first_name_encrypted
      ? decrypt(user.first_name_encrypted)
      : null;
    user.last_name = user.last_name_encrypted
      ? decrypt(user.last_name_encrypted)
      : null;
    user.address = user.address_encrypted
      ? decrypt(user.address_encrypted)
      : null;
    user.tax_id = user.tax_id_encrypted ? decrypt(user.tax_id_encrypted) : null;

    return user;
  } catch (err) {
    throw err; // controller will handle
  }
};

export const updateUserProfile = async (userId, fields) => {
  const columns = Object.keys(fields);
  const values = Object.values(fields);

  if (columns.length === 0) {
    return false;
  }

  const setClause = columns.map((col) => `${col} = ?`).join(', ');

  const sql = `
    UPDATE users
    SET ${setClause}
    WHERE user_id = ?
  `;

  values.push(userId);

  const [result] = await db.query(sql, values);

  return result.affectedRows > 0; // boolean success
};
