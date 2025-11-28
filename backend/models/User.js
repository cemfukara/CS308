// This Sequelize model defines the structure and attributes for the User table.
import { encrypt, decrypt } from '../utils/encrypter.js';
import { db } from '../app/config/db.js';

// Find user by email
export const findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
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

// return user info by id
export const findById = async (user_id) => {
  try {
    const [rows] = await db.query(`SELECT * FROM users WHERE user_id = ?`, [
      user_id,
    ]);
    const user = rows[0] || null;
    if (!user) return null;

    // Decrypt sensitive fields, some fields can be null as users can register without some PII's
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
  // Convert fields to arrays
  const columns = Object.keys(fields);
  const values = Object.values(fields);

  // Build a SET clause
  const setClause = columns.map((col) => `${col} = ?`).join(', ');

  // create the SQL query
  const sql = `
    UPDATE users
    SET ${setClause}
    WHERE user_id = ?
  `;

  // Append userId to values
  values.push(userId);

  // Execute the query
  const [result] = await db.query(sql, values);

  return result.affectedRows > 0; // boolean success
};
