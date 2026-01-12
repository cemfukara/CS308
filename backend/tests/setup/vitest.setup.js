import { vi } from 'vitest';

/**
 * Global mocks (applied before any test runs)
 */
vi.mock(
  '../../app/middlewares/authMiddleware.js',
  () => import('../mocks/authMiddleware.js')
);

/**
 * Safe default env for tests
 */
process.env.NODE_ENV = 'test';
process.env.AUTH_DISABLED = 'true';
process.env.JWT_SECRET = 'test-secret';
