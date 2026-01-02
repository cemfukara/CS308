// backend/models/SupportAttachment.js
// Model for support attachment operations

import { db } from '../app/config/db.js';

/**
 * Create a new attachment record
 * @param {number} messageId
 * @param {object} fileData - Object containing file_name, file_path, file_type, file_size
 * @returns {Promise<number>} attachment_id of created attachment
 */
export async function createAttachment(messageId, fileData) {
  const { file_name, file_path, file_type, file_size } = fileData;

  const [result] = await db.query(
    `INSERT INTO support_attachments (message_id, file_name, file_path, file_type, file_size) 
     VALUES (?, ?, ?, ?, ?)`,
    [messageId, file_name, file_path, file_type, file_size]
  );

  return result.insertId;
}

/**
 * Get all attachments for a specific message
 * @param {number} messageId
 * @returns {Promise<Array>} Array of attachments
 */
export async function getAttachmentsByMessageId(messageId) {
  const [rows] = await db.query(
    `SELECT 
      attachment_id,
      message_id,
      file_name,
      file_path,
      file_type,
      file_size,
      created_at
    FROM support_attachments
    WHERE message_id = ?`,
    [messageId]
  );

  return rows;
}

/**
 * Get a single attachment by ID
 * @param {number} attachmentId
 * @returns {Promise<object|null>} Attachment object or null
 */
export async function getAttachmentById(attachmentId) {
  const [rows] = await db.query(
    `SELECT 
      attachment_id,
      message_id,
      file_name,
      file_path,
      file_type,
      file_size,
      created_at
    FROM support_attachments
    WHERE attachment_id = ?`,
    [attachmentId]
  );

  return rows[0] || null;
}

/**
 * Delete an attachment
 * @param {number} attachmentId
 * @returns {Promise<boolean>} Success status
 */
export async function deleteAttachment(attachmentId) {
  const [result] = await db.query(
    `DELETE FROM support_attachments WHERE attachment_id = ?`,
    [attachmentId]
  );

  return result.affectedRows > 0;
}

/**
 * Get attachment with chat context (for permission checking)
 * @param {number} attachmentId
 * @returns {Promise<object|null>} Attachment with chat info
 */
export async function getAttachmentWithChatContext(attachmentId) {
  const [rows] = await db.query(
    `SELECT 
      sa.attachment_id,
      sa.message_id,
      sa.file_name,
      sa.file_path,
      sa.file_type,
      sa.file_size,
      sm.chat_id,
      sc.user_id,
      sc.agent_user_id,
      sc.guest_identifier
    FROM support_attachments sa
    JOIN support_messages sm ON sa.message_id = sm.message_id
    JOIN support_chats sc ON sm.chat_id = sc.chat_id
    WHERE sa.attachment_id = ?`,
    [attachmentId]
  );

  return rows[0] || null;
}
