// This file contains business logic for user-related operations (login, register, etc.).

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findByEmail, createUser } from '../../models/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // Create token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only true in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// REGISTER controller
export const register = async (req, res) => {
  const { full_name, email, password } = req.body; //get body

  try {
    if (!full_name || !email || !password)
      return res
        .status(400)
        .json({ message: 'Full name, email and password required' });

    // Check duplicates
    const existingUser = await findByEmail(email);
    if (existingUser)
      return res.status(409).json({ message: 'Email already registered' });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Split full name into parts
    const nameParts = full_name.trim().split(' ');
    let firstName = '';
    let lastName = '';

    // If no surname entered
    if (nameParts.length === 1) {
      firstName = nameParts[0];
      lastName = '';
    } else {
      // Set last word of the full_name to surname (last_name), rest is firstName
      lastName = nameParts.pop();
      firstName = nameParts.join(' ');
    }

    // Create user (role defaults to 'customer' in db)
    const user_id = await createUser(firstName, lastName, email, password_hash);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        full_name,
        user_id,
        email,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
