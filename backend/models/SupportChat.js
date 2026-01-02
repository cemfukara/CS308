// backend/models/SupportChat.js
// Model for support chat operations

import { db } from '../app/config/db.js';

/**
 * Create a new support chat
 * @param {number|null} userId - User ID for authenticated users, null for guests
 * @param {string|null} guestIdentifier - UUID for guest users
 * @returns {Promise<number>} chat_id of the created chat
 */
export async function createChat(userId, guestIdentifier) {
  const [result] = await db.query(
    `INSERT INTO support_chats (user_id, guest_identifier, status) 
     VALUES (?, ?, 'waiting')`,
    [userId, guestIdentifier]
  );

  return result.insertId;
}

/**
 * Get chat by ID with basic info
 * @param {number} chatId
 * @returns {Promise<object|null>} Chat object or null if not found
 */
export async function getChatById(chatId) {
  const [rows] = await db.query(
    `SELECT 
      chat_id,
      user_id,
      guest_identifier,
      agent_user_id,
      status,
      created_at,
      claimed_at,
      closed_at
    FROM support_chats
    WHERE chat_id = ?`,
    [chatId]
  );

  return rows[0] || null;
}

/**
 * Get all waiting (unclaimed) chats for agent queue
 * @returns {Promise<Array>} Array of waiting chats
 */
export async function getWaitingChats() {
  const [rows] = await db.query(
    `SELECT 
      sc.chat_id,
      sc.user_id,
      sc.guest_identifier,
      sc.status,
      sc.created_at,
      u.email AS customer_email,
      (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.chat_id) AS message_count
    FROM support_chats sc
    LEFT JOIN users u ON sc.user_id = u.user_id
    WHERE sc.status = 'waiting'
    ORDER BY sc.created_at ASC`
  );

  return rows;
}

/**
 * Get active chats assigned to a specific agent
 * @param {number} agentUserId
 * @returns {Promise<Array>} Array of active chats
 */
export async function getActiveChats(agentUserId) {
  const [rows] = await db.query(
    `SELECT 
      sc.chat_id,
      sc.user_id,
      sc.guest_identifier,
      sc.status,
      sc.created_at,
      sc.claimed_at,
      u.email AS customer_email,
      (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.chat_id AND is_read = FALSE AND sender_type = 'customer') AS unread_count
    FROM support_chats sc
    LEFT JOIN users u ON sc.user_id = u.user_id
    WHERE sc.agent_user_id = ? 
      AND sc.status IN ('active', 'waiting')
    ORDER BY sc.created_at DESC`,
    [agentUserId]
  );

  return rows;
}

/**
 * Claim a chat (assign to an agent)
 * @param {number} chatId
 * @param {number} agentUserId
 * @returns {Promise<boolean>} Success status
 */
export async function claimChat(chatId, agentUserId) {
  const [result] = await db.query(
    `UPDATE support_chats 
     SET agent_user_id = ?,
         status = 'active',
         claimed_at = NOW()
     WHERE chat_id = ? 
       AND status = 'waiting'`,
    [agentUserId, chatId]
  );

  return result.affectedRows > 0;
}

/**
 * Update chat status
 * @param {number} chatId
 * @param {string} status - One of: 'waiting', 'active', 'resolved', 'closed'
 * @returns {Promise<boolean>} Success status
 */
export async function updateChatStatus(chatId, status) {
  const updateData = [status];
  const closedStatuses = ['resolved', 'closed'];

  let query = `UPDATE support_chats SET status = ?`;

  if (closedStatuses.includes(status)) {
    query += `, closed_at = NOW()`;
  }

  query += ` WHERE chat_id = ?`;
  updateData.push(chatId);

  const [result] = await db.query(query, updateData);

  return result.affectedRows > 0;
}

/**
 * Get chat with full customer context (orders, cart, wishlist)
 * @param {number} chatId
 * @returns {Promise<object|null>} Chat with customer context
 */
export async function getChatWithCustomerContext(chatId) {
  // Get chat details
  const chat = await getChatById(chatId);
  if (!chat || !chat.user_id) {
    return chat; // Return basic chat for guest users
  }

  // Get customer profile
  const [userRows] = await db.query(
    `SELECT user_id, email, created_at FROM users WHERE user_id = ?`,
    [chat.user_id]
  );
  chat.customer_profile = userRows[0] || null;

  // Get recent orders (last 5)
  const [orders] = await db.query(
    `SELECT 
      order_id,
      status,
      total_price,
      order_date,
      created_at
    FROM orders
    WHERE user_id = ? AND status != 'cart'
    ORDER BY created_at DESC
    LIMIT 5`,
    [chat.user_id]
  );
  chat.recent_orders = orders;

  // Get current cart items
  const [cartRows] = await db.query(
    `SELECT order_id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1`,
    [chat.user_id]
  );

  if (cartRows.length > 0) {
    const [cartItems] = await db.query(
      `SELECT 
        oi.product_id,
        p.name,
        oi.quantity,
        p.price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?`,
      [cartRows[0].order_id]
    );
    chat.cart_items = cartItems;
  } else {
    chat.cart_items = [];
  }

  // Get wishlist items
  const [wishlist] = await db.query(
    `SELECT 
      w.product_id,
      p.name,
      p.price
    FROM wishlists w
    JOIN products p ON w.product_id = p.product_id
    WHERE w.user_id = ?`,
    [chat.user_id]
  );
  chat.wishlist_items = wishlist;

  return chat;
}

/**
 * Get chats by user ID (for customer chat history)
 * @param {number} userId
 * @returns {Promise<Array>} Array of user's chats
 */
export async function getChatsByUserId(userId) {
  const [rows] = await db.query(
    `SELECT 
      sc.chat_id,
      sc.status,
      sc.created_at,
      sc.closed_at,
      (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.chat_id) AS message_count,
      (SELECT message_text FROM support_messages WHERE chat_id = sc.chat_id ORDER BY created_at DESC LIMIT 1) AS last_message
    FROM support_chats sc
    WHERE sc.user_id = ?
    ORDER BY sc.created_at DESC`,
    [userId]
  );

  return rows;
}

/**
 * Get chats by guest identifier
 * @param {string} guestIdentifier
 * @returns {Promise<Array>} Array of guest's chats
 */
export async function getChatsByGuestIdentifier(guestIdentifier) {
  const [rows] = await db.query(
    `SELECT 
      sc.chat_id,
      sc.status,
      sc.created_at,
      sc.closed_at,
      (SELECT COUNT(*) FROM support_messages WHERE chat_id = sc.chat_id) AS message_count
    FROM support_chats sc
    WHERE sc.guest_identifier = ?
    ORDER BY sc.created_at DESC`,
    [guestIdentifier]
  );

  return rows;
}
