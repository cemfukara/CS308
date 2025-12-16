// backend/models/SupportMessage.js
// Model for support message operations

import { db } from '../app/config/db.js';

/**
 * Create a new message in a chat
 * @param {number} chatId
 * @param {string} senderType - 'customer' or 'agent'
 * @param {number|null} senderUserId - User ID of sender (null for guests)
 * @param {string|null} messageText - Text content (null for attachment-only messages)
 * @returns {Promise<number>} message_id of created message
 */
export async function createMessage(
  chatId,
  senderType,
  senderUserId,
  messageText
) {
  const [result] = await db.query(
    `INSERT INTO support_messages (chat_id, sender_type, sender_user_id, message_text) 
     VALUES (?, ?, ?, ?)`,
    [chatId, senderType, senderUserId, messageText]
  );

  return result.insertId;
}

/**
 * Get all messages for a specific chat
 * @param {number} chatId
 * @returns {Promise<Array>} Array of messages with attachments
 */
export async function getMessagesByChatId(chatId) {
  const [messages] = await db.query(
    `SELECT 
      sm.message_id,
      sm.chat_id,
      sm.sender_type,
      sm.sender_user_id,
      sm.message_text,
      sm.created_at,
      sm.is_read,
      u.email AS sender_email
    FROM support_messages sm
    LEFT JOIN users u ON sm.sender_user_id = u.user_id
    WHERE sm.chat_id = ?
    ORDER BY sm.created_at ASC`,
    [chatId]
  );

  // Get attachments for each message
  for (const message of messages) {
    const [attachments] = await db.query(
      `SELECT 
        attachment_id,
        file_name,
        file_path,
        file_type,
        file_size,
        created_at
      FROM support_attachments
      WHERE message_id = ?`,
      [message.message_id]
    );
    message.attachments = attachments;
  }

  return messages;
}

/**
 * Mark messages as read
 * @param {number} chatId
 * @param {string} senderType - Mark messages from this sender type as read
 * @returns {Promise<boolean>} Success status
 */
export async function markMessagesAsRead(chatId, senderType) {
  const [result] = await db.query(
    `UPDATE support_messages 
     SET is_read = TRUE
     WHERE chat_id = ? 
       AND sender_type = ? 
       AND is_read = FALSE`,
    [chatId, senderType]
  );

  return result.affectedRows > 0;
}

/**
 * Get unread message count for a chat
 * @param {number} chatId
 * @param {string} forSenderType - Count unread messages FROM this sender type
 * @returns {Promise<number>} Count of unread messages
 */
export async function getUnreadCount(chatId, forSenderType) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS unread_count
     FROM support_messages
     WHERE chat_id = ? 
       AND sender_type = ? 
       AND is_read = FALSE`,
    [chatId, forSenderType]
  );

  return rows[0].unread_count || 0;
}

/**
 * Get a single message by ID
 * @param {number} messageId
 * @returns {Promise<object|null>} Message object or null
 */
export async function getMessageById(messageId) {
  const [rows] = await db.query(
    `SELECT 
      message_id,
      chat_id,
      sender_type,
      sender_user_id,
      message_text,
      created_at,
      is_read
    FROM support_messages
    WHERE message_id = ?`,
    [messageId]
  );

  return rows[0] || null;
}
