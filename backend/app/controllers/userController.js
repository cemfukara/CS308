// backend/app/controllers/userController.js
// This file contains business logic for user-related operations (login, register, etc.).

import bcrypt from 'bcryptjs';
import { encrypt } from '../../utils/encrypter.js';
import { generateAccessToken } from '../../utils/generateToken.js';
import {
  findByEmail,
  createUser,
  findById,
  updateUserProfile,
} from '../../models/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // create token
    const token = generateAccessToken({
      user_id: user.user_id,
      email,
      role: user.role,
    });

    // pass as cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only true in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// REGISTER controller – now uses first_name, last_name, optional tax_id
export const register = async (req, res) => {
  const { first_name, last_name, email, password, tax_id } = req.body;

  try {
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        message: 'First name, last name, email and password required',
      });
    }

    // Check duplicates
    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user (role defaults to 'customer' in db)
    const user_id = await createUser(
      first_name,
      last_name,
      email,
      password_hash,
      tax_id
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id,
        email,
        first_name,
        last_name,
        tax_id: tax_id || null,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const user = await findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      taxId: user.tax_id,
      address: user.address,
      role: user.role,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const allowedFields = [
      'first_name',
      'last_name',
      'address',
      'tax_id',
      'email',
    ];

    // Check for invalid fields
    const invalidFields = Object.keys(req.body).filter(
      (key) => !allowedFields.includes(key)
    );
    if (invalidFields.length > 0) {
      return res
        .status(400)
        .json({ message: `Invalid field: ${invalidFields[0]}` });
    }

    const updateFields = {};

    // Loop through only allowed fields provided in request
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        switch (field) {
          case 'first_name':
            updateFields.first_name_encrypted = encrypt(req.body[field]);
            break;
          case 'last_name':
            updateFields.last_name_encrypted = encrypt(req.body[field]);
            break;
          case 'address':
            updateFields.address_encrypted = encrypt(req.body[field]);
            break;
          case 'tax_id':
            updateFields.tax_id_encrypted = encrypt(req.body[field]);
            break;
          case 'email':
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body[field])) {
              throw { status: 400, message: 'Invalid email format.' };
            }
            updateFields.email = req.body[field];
            break;
        }
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    await updateUserProfile(userId, updateFields);

    // Handle email change → refresh JWT cookie
    if (updateFields.email && updateFields.email !== req.user.email) {
      const token = generateAccessToken({
        user_id: userId,
        email: updateFields.email,
        role: req.user.role,
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res
      .status(error?.status || 500)
      .json({ message: error?.message || 'Server error' });
  }
};
