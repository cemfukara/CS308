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

    // Validate allowed fields to prevent uncontrolled updates
    const allowedFields = [
      'first_name',
      'last_name',
      'address',
      'tax_id',
      'email',
    ];
    for (const key in req.body) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({ message: `Invalid field: ${key}` });
      }
    }

    const { first_name, last_name, address, tax_id, email } = req.body;

    const updateFields = {};

    updateFields.first_name_encrypted =
      first_name !== undefined && first_name !== null
        ? encrypt(first_name)
        : null;
    updateFields.last_name_encrypted =
      last_name !== undefined && last_name !== null ? encrypt(last_name) : null;

    if (address !== undefined) {
      updateFields.address_encrypted = address ? encrypt(address) : null;
    }
    if (tax_id !== undefined) {
      updateFields.tax_id_encrypted = tax_id ? encrypt(tax_id) : null;
    }

    let emailChanged = false; // email change flag

    // Email format validation
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
      }

      if (email != req.user.email) {
        // check if email is different
        emailChanged = true;
      }
      updateFields.email = email;
    }

    // Check if any field is updated
    const allNull = Object.keys(updateFields).every(
      (key) => updateFields[key] === null
    );

    // If no valid fields to update return error to prevent empty update (might break SQL)
    if (allNull) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    await updateUserProfile(userId, updateFields);

    // return new cookie with updated email if email is changed
    if (emailChanged) {
      let token = null;
      token = generateAccessToken({
        user_id: userId,
        email: email,
        role: req.user.role,
      });

      // pass as cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only true in production
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000,
      });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
