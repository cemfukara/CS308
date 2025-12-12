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
    req.user = decoded;
    return next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// check auth for specified roles. "allowedRoles" could be "customer",
// "product manager", "sales manager", "support agent" or "dev".
export const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user;

    // In dev mode, "dev" role can access anything
    if (process.env.NODE_ENV === 'development') {
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
