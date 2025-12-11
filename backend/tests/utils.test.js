// Tests for utility/helper functions like email sending or token generation.
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';

// Import Utils
import { encrypt, decrypt } from '../utils/encrypter.js';
import { generateAccessToken } from '../utils/generateToken.js';

// 1. Mock dependencies
vi.mock('jsonwebtoken');

describe('Utils Tests', () => {
  
  // Set up environment variables required by utils
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000'; // 32 bytes hex-like string (64 chars) or just 32 chars? 
    // The code does: Buffer.from(key, 'hex'). If the key is 32 bytes, hex string is 64 chars.
    // Let's use a valid 32-byte hex string.
    process.env.ENCRYPTION_KEY = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'; 
    process.env.JWT_SECRET = 'test_jwt_secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /* ============================================================
     ENCRYPTER TESTS
     ============================================================ */
  describe('Encrypter (AES-256-GCM)', () => {
    
    it('should encrypt and decrypt a string correctly', () => {
      const originalText = 'Sensitive PII Data';
      
      // 1. Encrypt
      const encryptedBuffer = encrypt(originalText);
      expect(Buffer.isBuffer(encryptedBuffer)).toBe(true);
      expect(encryptedBuffer.length).toBeGreaterThan(0);

      // 2. Decrypt
      const decryptedText = decrypt(encryptedBuffer);
      expect(decryptedText).toBe(originalText);
    });

    it('should return null if encrypting null/undefined', () => {
      expect(encrypt(null)).toBeNull();
      expect(encrypt(undefined)).toBeNull();
    });

    it('should return null if decrypting null/undefined', () => {
      expect(decrypt(null)).toBeNull();
      expect(decrypt(undefined)).toBeNull();
    });

    it('should return null if decrypted data is too short (invalid buffer)', () => {
      // Logic requires 12 (IV) + 16 (Tag) = 28 bytes min
      const shortBuffer = Buffer.alloc(10); 
      expect(decrypt(shortBuffer)).toBeNull();
    });

    it('should return null/log error if decryption fails (tampered data)', () => {
      // Mock console.error to keep test output clean
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const validEncrypt = encrypt('Hello');
      
      // Tamper with the buffer (change the last byte of ciphertext)
      validEncrypt[validEncrypt.length - 1] ^= 1; 

      const result = decrypt(validEncrypt);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Decryption failed'), expect.any(String));
    });
  });

  /* ============================================================
     TOKEN GENERATOR TESTS
     ============================================================ */
  describe('Token Generator (JWT)', () => {
    const mockPayload = {
      user_id: 1,
      email: 'user@test.com',
      role: 'customer'
    };

    it('should generate a valid JWT with correct payload and expiry', () => {
      // Mock jwt.sign to return a fake token string
      jwt.sign.mockReturnValue('mock.jwt.token');

      const token = generateAccessToken(mockPayload);

      expect(token).toBe('mock.jwt.token');
      
      // Verify jwt.sign was called with correct arguments
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user_id: 1,
          email: 'user@test.com',
          role: 'customer'
        },
        'test_jwt_secret',
        { expiresIn: '1h' }
      );
    });
  });
});