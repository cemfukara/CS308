// Helper function to generate JWT tokens for user authentication.
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

// Usually tokens expire in 1h, but as refresh tokens are not implemented yet, larger expiry is set.
const ACCESS_TOKEN_EXPIRES_IN = '7d';

export const generateAccessToken = (payload) => {
  const payloadToBeSent = {
    user_id: payload.user_id,
    email: payload.email,
    role: payload.role,
  };

  // Sign
  return jwt.sign(payloadToBeSent, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};
