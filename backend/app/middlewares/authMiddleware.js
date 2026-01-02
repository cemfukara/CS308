// backend/app/middlewares/authMiddleware.js
// This middleware verifies JWT tokens and authenticates users before accessing protected routes.

import jwt from 'jsonwebtoken';
import { findById } from '../../models/User.js';

// This function decodes the valid JWT token from cookies and passes its contents to req.user
// IMPORTANT: This function does not check for user roles, only decodes the token.
// Must be used with authorizeRoles([...]) for role checks.
export const authenticate = async (req, res, next) => {
  // Dev shortcut: AUTH_DISABLED + NODE_ENV=development → always log in as dev user (id 0)
  if (
    process.env.AUTH_DISABLED === 'true' &&
    process.env.NODE_ENV == 'development'
  ) {
    let dev = await findById(0); // fetch dev user info
    req.user = {
      user_id: 0,
      first_name: dev.first_name,
      last_name: dev.last_name,
      email: dev.email,
      address: dev.address,
      tax_id: dev.tax_id,
      role: dev.role,
    };
    return next();
  }

  const token = req.cookies.token; // read from cookie

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from database to get the current role
    // This fixes the issue where role changes aren't reflected until cookies are deleted
    const currentUser = await findById(decoded.user_id);

    if (!currentUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Use fresh data from database, especially the role
    req.user = {
      user_id: currentUser.user_id,
      email: currentUser.email,
      first_name: currentUser.first_name,
      last_name: currentUser.last_name,
      role: currentUser.role, // This will always be current
    };

    return next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Optional authentication - sets req.user if token exists, but doesn't fail if not
// Useful for routes that support both authenticated and guest users
export const optionalAuthenticate = async (req, res, next) => {
  // Dev shortcut: AUTH_DISABLED + NODE_ENV=development → always log in as dev user (id 0)
  if (
    process.env.AUTH_DISABLED === 'true' &&
    process.env.NODE_ENV == 'development'
  ) {
    let dev = await findById(0); // fetch dev user info
    req.user = {
      user_id: 0,
      first_name: dev.first_name,
      last_name: dev.last_name,
      email: dev.email,
      address: dev.address,
      tax_id: dev.tax_id,
      role: dev.role,
    };
    return next();
  }

  const token = req.cookies.token; // read from cookie

  // If no token, just continue without setting req.user
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from database to get the current role
    const currentUser = await findById(decoded.user_id);

    if (currentUser) {
      // Set req.user with fresh data from database
      req.user = {
        user_id: currentUser.user_id,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        role: currentUser.role, // This will always be current
      };
    }

    return next();
  } catch {
    // If token is invalid, just continue without setting req.user
    // (Don't fail the request - allow guest access)
    return next();
  }
};

// check auth for specified roles. "allowedRoles" could be "customer",
// "product manager", "sales manager", "support agent" or "dev".
export const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user;

    // In dev mode, "dev" role can access anything
    if (process.env.NODE_ENV === 'development' && user.role === 'dev') {
      return next();
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    return next();
  };
};
