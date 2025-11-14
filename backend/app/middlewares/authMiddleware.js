// This middleware verifies JWT tokens and authenticates users before accessing protected routes.

import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // read from cookie

    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //try to verify token
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// check auth for specified roles. "allowedRoles" could be "admin", "user", "product_manager" etc.
export const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(user.role)) {
            return res
                .status(403)
                .json({ message: 'Forbidden: Access denied.' });
        }

        next();
    };
};
