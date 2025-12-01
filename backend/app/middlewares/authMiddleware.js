// This middleware verifies JWT tokens and authenticates users before accessing protected routes.

import jwt from 'jsonwebtoken';
import { findById } from '../../models/User.js';

// This function decodes the valid JWT token from cookies and passes its contents to req.user
// IMPORTANT: This function does not checks for user roles, only decodes the token. Must used with authorizeRoles([-allowed roles-]) for role checks.
export const authenticate = async (req, res, next) => {
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

  if (!token)
    return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //try to verify token
    req.user = decoded;
    return next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// check auth for specified roles. "allowedRoles" could be are "customer", "product manager", "sales manager", and "support agent"
// But this functions only checks that if the user's role in the JWT token (supplied by authenticate) matches the requested roles.
// The function does not check the validity (is the role is one of the possible role) of the allowedRoles and user's role.
export const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // If in dev mode with no authentication, allow "dev" role to access anything
    if (process.env.NODE_ENV === 'development' && user.role === 'dev') {
      return next();
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    return next();
  };
};

export const isAdmin = authorizeRoles(['product manager']);
