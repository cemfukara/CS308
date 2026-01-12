import { vi } from 'vitest';

let currentRole = 'admin';

export const __setMockRole = (role) => {
  currentRole = role;
};

export const authenticate = vi.fn((req, res, next) => {
  req.user = {
    user_id: 1,
    email: 'test@example.com',
    role: currentRole,
  };
  next();
});

export const optionalAuthenticate = vi.fn((req, res, next) => {
  req.user = null;
  next();
});

export const authorizeRoles = vi.fn(() => {
  return (req, res, next) => next();
});
