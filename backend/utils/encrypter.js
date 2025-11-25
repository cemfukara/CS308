// Helper functions to encrypt and decrypt data
import crypto from 'crypto';

// Helper function for encrypting PII's
export const encrypt = (text) => {
  if (text === null || text === undefined) return null;

  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

// Helper function for decrypting PII's
export const decrypt = (encrypted) => {
  if (b64 === null || b64 === undefined) return null;

  const data = Buffer.from(encrypted, 'base64');
  if (data.length < 12 + 16) return null;

  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ciphertext = data.slice(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
  return decrypted;
};
