// This Sequelize model defines the structure and attributes for the User table.
import { db } from '../app/config/db.js';

// Find user by email
export const findByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [
        email,
    ]);
    return rows[0];
};

// Create new user
export const createUser = async (email, password_hash, role = 'customer') => {
    const [result] = await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, password_hash, role]
    );
    return result.insertId; // AUTO_INCREMENT user_id
};
