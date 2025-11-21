// This Sequelize model defines the structure and attributes for the User table.
import crypto from 'crypto';
import { db } from '../app/config/db.js';

// Find user by email
export const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Helper function for encrypting PII's
const encrypt = (text) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
};

// create user model. Takes already splitted full name
export const createUser = async (firstName, lastName, email, password_hash) => {
  const firstNameEnc = encrypt(firstName);
  const lastNameEnc = encrypt(lastName);

  const [result] = await db.query(
    `INSERT INTO users (
            email,
            password_hash,
            first_name_encrypted,
            last_name_encrypted
        ) VALUES (?, ?, ?, ?)`,
    [email, password_hash, firstNameEnc, lastNameEnc]
  );

  return result.insertId;
};
