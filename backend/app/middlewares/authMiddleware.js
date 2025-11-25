// This middleware verifies JWT tokens and authenticates users before accessing protected routes.

import jwt from 'jsonwebtoken';

export const isAuthenticated = (req, res, next) => {
  if (
    process.env.AUTH_DISABLED === `true` &&
    process.env.NODE_ENV == 'development'
  ) {
    req.user = {
      user_id: 0,
      email: 'dev@test.local',
      role: 'dev',
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

// check auth for specified roles. "allowedRoles" could be "admin", "user", "product_manager" etc.
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
