// you can run these tests by typing "npm run test:models" in the terminal


import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQuery } = vi.hoisted(() => {
    return { mockQuery: vi.fn() };
});

vi.mock('../../app/config/db.js', () => ({
    db: {
        query: mockQuery,
    },
}));

// 2. Mock Encrypter
vi.mock('../../utils/encrypter.js', () => ({
    encrypt: vi.fn((val) => `enc_${val}`),
    decrypt: vi.fn((val) => (val && val.startsWith('enc_') ? val.replace('enc_', '') : val)),
}));

import * as UserModel from '../../models/User.js';

describe('User Model Unit Tests', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    describe('findByEmail', () => {
        it('should execute SELECT query with correct email', async () => {
            const mockUser = { user_id: 1, email: 'test@example.com' };
            mockQuery.mockResolvedValueOnce([[mockUser]]);

            const result = await UserModel.findByEmail('test@example.com');

            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = ?',
                ['test@example.com']
            );
            expect(result).toEqual(mockUser);
        });

        it('should return undefined if user not found', async () => {
            mockQuery.mockResolvedValueOnce([[]]); // Empty rows

            const result = await UserModel.findByEmail('unknown@example.com');

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE email = ?',
                ['unknown@example.com']
            );
            expect(result).toBeUndefined();
        });
    });

    describe('createUser', () => {
        it('should encrypt fields and execute INSERT query', async () => {
            mockQuery.mockResolvedValueOnce([{ insertId: 101 }]);

            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                passwordHash: 'hashed_pw_123',
                taxId: 'TAX123'
            };

            const newId = await UserModel.createUser(
                userData.firstName,
                userData.lastName,
                userData.email,
                userData.passwordHash,
                userData.taxId
            );

            expect(newId).toBe(101);

            // Verify SQL
            const expectedSql = `INSERT INTO users (
      email,
      password_hash,
      first_name_encrypted,
      last_name_encrypted,
      tax_id_encrypted
    ) VALUES (?, ?, ?, ?, ?)`;

            // Check strict SQL match logic (might need to normalize whitespace if implementation varies)
            // The implementation uses a template literal with newlines, so we match that structure.

            const lastCallArgs = mockQuery.mock.calls[0];
            const sqlArg = lastCallArgs[0];
            const paramsArg = lastCallArgs[1];

            expect(sqlArg).toContain('INSERT INTO users');
            expect(sqlArg).toContain('VALUES (?, ?, ?, ?, ?)');

            // Verify params (should be encrypted)
            expect(paramsArg).toEqual([
                'john@example.com',
                'hashed_pw_123',
                'enc_John',      // Encrypted first name
                'enc_Doe',       // Encrypted last name
                'enc_TAX123'     // Encrypted tax id
            ]);
        });

        it('should handle missing taxId (null)', async () => {
            mockQuery.mockResolvedValueOnce([{ insertId: 102 }]);

            await UserModel.createUser(
                'Jane',
                'Doe',
                'jane@example.com',
                'hashed_pw_456',
                null
            );

            const paramsArg = mockQuery.mock.calls[0][1];
            // Param index 4 is taxId
            expect(paramsArg[4]).toBeNull();
        });
    });

    describe('findById', () => {
        it('should fetch user and decrypt sensitive fields', async () => {
            const dbRow = {
                user_id: 1,
                email: 'test@example.com',
                first_name_encrypted: 'enc_John',
                last_name_encrypted: 'enc_Doe',
                address_encrypted: 'enc_123 St',
                phone_encrypted: 'enc_555-0100',
                tax_id_encrypted: 'enc_TX99'
            };

            mockQuery.mockResolvedValueOnce([[dbRow]]);

            const user = await UserModel.findById(1);

            expect(mockQuery).toHaveBeenCalledWith(
                'SELECT * FROM users WHERE user_id = ?',
                [1]
            );

            // Verify decryption logic
            expect(user.first_name).toBe('John');
            expect(user.last_name).toBe('Doe');
            expect(user.address).toBe('123 St');
            expect(user.phone).toBe('555-0100');
            expect(user.tax_id).toBe('TX99');
        });

        it('should return null if user not found', async () => {
            mockQuery.mockResolvedValueOnce([[]]);
            const user = await UserModel.findById(999);
            expect(user).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('should dynamically build UPDATE query for provided fields', async () => {
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const userId = 5;
            const fields = {
                email: 'new@example.com',
                first_name_encrypted: 'enc_NewName'
            };

            const success = await UserModel.updateUserProfile(userId, fields);

            expect(success).toBe(true);

            const [sql, params] = mockQuery.mock.calls[0];

            // Verify dynamic SQL construction
            expect(sql).toContain('UPDATE users');
            expect(sql).toContain('SET email = ?, first_name_encrypted = ?');
            expect(sql).toContain('WHERE user_id = ?');

            // Verify params order: values then userId
            expect(params).toEqual(['new@example.com', 'enc_NewName', 5]);
        });

        it('should return false if no fields provided', async () => {
            const result = await UserModel.updateUserProfile(1, {});
            expect(result).toBe(false);
            expect(mockQuery).not.toHaveBeenCalled();
        });
    });

    describe('deleteUser', () => {
        it('should execute DELETE query', async () => {
            mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const success = await UserModel.deleteUser(10);

            expect(success).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM users WHERE user_id = ?',
                [10]
            );
        });
    });
});
