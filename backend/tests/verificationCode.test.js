// Tests for VerificationCode model
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as VerificationCodeModel from '../models/VerificationCode.js';

// Mock database
vi.mock('../app/config/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from '../app/config/db.js';

describe('VerificationCode Model Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================================================================
  // generateCode()
  // ==================================================================
  describe('generateCode()', () => {
    it('should generate a 6-digit code', () => {
      const code = VerificationCodeModel.generateCode();

      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it('should generate different codes on multiple calls', () => {
      const code1 = VerificationCodeModel.generateCode();
      const code2 = VerificationCodeModel.generateCode();
      const code3 = VerificationCodeModel.generateCode();

      // It's theoretically possible they're the same, but extremely unlikely
      const allUnique = new Set([code1, code2, code3]).size === 3;
      expect(allUnique).toBe(true);
    });
  });

  // ==================================================================
  // createVerificationCode()
  // ==================================================================
  describe('createVerificationCode()', () => {
    it('should insert verification code with default expiration (15 minutes)', async () => {
      const mockResult = [{ insertId: 123 }];
      db.query.mockResolvedValue(mockResult);

      const userId = 1;
      const code = '123456';
      const purpose = 'profile_update';
      const pendingData = { email: 'new@example.com' };

      const insertId = await VerificationCodeModel.createVerificationCode(
        userId,
        code,
        purpose,
        pendingData
      );

      expect(insertId).toBe(123);
      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO verification_codes');
      expect(params[0]).toBe(userId);
      expect(params[1]).toBe(code);
      expect(params[2]).toBe(purpose);
      expect(params[3]).toBe(JSON.stringify(pendingData));

      // Check expiration is roughly 15 minutes from now
      const expiresAt = new Date(params[4]);
      const now = new Date();
      const diffMinutes = (expiresAt - now) / 1000 / 60;
      expect(diffMinutes).toBeGreaterThan(14);
      expect(diffMinutes).toBeLessThan(16);
    });

    it('should handle null pending data', async () => {
      const mockResult = [{ insertId: 124 }];
      db.query.mockResolvedValue(mockResult);

      await VerificationCodeModel.createVerificationCode(
        1,
        '123456',
        'account_deletion',
        null
      );

      const [, params] = db.query.mock.calls[0];
      expect(params[3]).toBeNull();
    });

    it('should accept custom expiration time', async () => {
      const mockResult = [{ insertId: 125 }];
      db.query.mockResolvedValue(mockResult);

      await VerificationCodeModel.createVerificationCode(
        1,
        '123456',
        'profile_update',
        null,
        30 // 30 minutes
      );

      const [, params] = db.query.mock.calls[0];
      const expiresAt = new Date(params[4]);
      const now = new Date();
      const diffMinutes = (expiresAt - now) / 1000 / 60;
      expect(diffMinutes).toBeGreaterThan(29);
      expect(diffMinutes).toBeLessThan(31);
    });
  });

  // ==================================================================
  // findValidCode()
  // ==================================================================
  describe('findValidCode()', () => {
    it('should return verification code if valid', async () => {
      const mockCode = {
        code_id: 1,
        user_id: 1,
        code: '123456',
        purpose: 'profile_update',
        pending_data: '{"email":"new@example.com"}',
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_used: false,
      };

      db.query.mockResolvedValue([[mockCode]]);

      const result = await VerificationCodeModel.findValidCode(
        1,
        '123456',
        'profile_update'
      );

      expect(result).toBeTruthy();
      expect(result.code_id).toBe(1);
      expect(result.pending_data).toEqual({ email: 'new@example.com' });

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('WHERE user_id = ?');
      expect(sql).toContain('AND code = ?');
      expect(sql).toContain('AND purpose = ?');
      expect(sql).toContain('AND is_used = FALSE');
      expect(sql).toContain('AND expires_at > NOW()');
      expect(params).toEqual([1, '123456', 'profile_update']);
    });

    it('should return null if code not found', async () => {
      db.query.mockResolvedValue([[]]);

      const result = await VerificationCodeModel.findValidCode(
        1,
        '999999',
        'profile_update'
      );

      expect(result).toBeNull();
    });

    it('should handle invalid JSON in pending_data', async () => {
      const mockCode = {
        code_id: 2,
        pending_data: 'invalid json{',
      };

      db.query.mockResolvedValue([[mockCode]]);

      const result = await VerificationCodeModel.findValidCode(
        1,
        '123456',
        'profile_update'
      );

      expect(result.pending_data).toBeNull();
    });

    it('should handle null pending_data', async () => {
      const mockCode = {
        code_id: 3,
        pending_data: null,
      };

      db.query.mockResolvedValue([[mockCode]]);

      const result = await VerificationCodeModel.findValidCode(
        1,
        '123456',
        'account_deletion'
      );

      expect(result.pending_data).toBeNull();
    });
  });

  // ==================================================================
  // markCodeAsUsed()
  // ==================================================================
  describe('markCodeAsUsed()', () => {
    it('should mark code as used and return true', async () => {
      db.query.mockResolvedValue([{ affectedRows: 1 }]);

      const result = await VerificationCodeModel.markCodeAsUsed(123);

      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledTimes(1);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('UPDATE verification_codes');
      expect(sql).toContain('SET is_used = TRUE');
      expect(sql).toContain('WHERE code_id = ?');
      expect(params).toEqual([123]);
    });

    it('should return false if no rows affected', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await VerificationCodeModel.markCodeAsUsed(999);

      expect(result).toBe(false);
    });
  });

  // ==================================================================
  // cleanupOldCodes()
  // ==================================================================
  describe('cleanupOldCodes()', () => {
    it('should delete used and expired codes for user', async () => {
      db.query.mockResolvedValue([{ affectedRows: 3 }]);

      const result = await VerificationCodeModel.cleanupOldCodes(1);

      expect(result).toBe(3);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('DELETE FROM verification_codes');
      expect(sql).toContain('WHERE user_id = ?');
      expect(sql).toContain('AND (is_used = TRUE OR expires_at < NOW())');
      expect(params).toEqual([1]);
    });

    it('should return 0 if no codes to clean up', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await VerificationCodeModel.cleanupOldCodes(1);

      expect(result).toBe(0);
    });
  });

  // ==================================================================
  // invalidatePendingCodes()
  // ==================================================================
  describe('invalidatePendingCodes()', () => {
    it('should invalidate all pending codes for user and purpose', async () => {
      db.query.mockResolvedValue([{ affectedRows: 2 }]);

      const result = await VerificationCodeModel.invalidatePendingCodes(
        1,
        'profile_update'
      );

      expect(result).toBe(2);

      const [sql, params] = db.query.mock.calls[0];
      expect(sql).toContain('UPDATE verification_codes');
      expect(sql).toContain('SET is_used = TRUE');
      expect(sql).toContain('WHERE user_id = ?');
      expect(sql).toContain('AND purpose = ?');
      expect(sql).toContain('AND is_used = FALSE');
      expect(params).toEqual([1, 'profile_update']);
    });

    it('should return 0 if no pending codes exist', async () => {
      db.query.mockResolvedValue([{ affectedRows: 0 }]);

      const result = await VerificationCodeModel.invalidatePendingCodes(
        1,
        'account_deletion'
      );

      expect(result).toBe(0);
    });
  });
});
