// backend/tests/supportChat.test.js
// Unit tests for support chat system

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app/app.js';
import { db } from '../app/config/db.js';

describe('Support Chat System', () => {
  let authToken;
  let agentToken;
  let customerId;
  let agentId;
  let chatId;
  let customerEmail;
  let agentEmail;

  // Setup: Create test users and authenticate
  beforeAll(async () => {
    try {
      // Generate unique emails
      const timestamp = Date.now();
      customerEmail = `testcustomer-support-${timestamp}@test.com`;
      agentEmail = `testagent-support-${timestamp}@test.com`;

      // Create test customer
      const customerRes = await request(app).post('/api/users/register').send({
        first_name: 'Test',
        last_name: 'Customer',
        email: customerEmail,
        password: 'Test1234!',
      });

      if (customerRes.status !== 201) {
        console.error('Customer registration failed:', {
          status: customerRes.status,
          body: customerRes.body,
        });
        throw new Error(`Customer registration failed with status ${customerRes.status}`);
      }

      customerId = customerRes.body.user_id;
      console.log('Customer registered successfully:', customerId);

      // Login as customer using the SAME email
      const loginRes = await request(app).post('/api/users/login').send({
        email: customerEmail,
        password: 'Test1234!',
      });

      if (loginRes.status !== 200) {
        console.error('Customer login failed:', {
          status: loginRes.status,
          body: loginRes.body,
        });
        throw new Error(`Customer login failed with status ${loginRes.status}`);
      }

      // Extract cookie properly - it's an array
      if (loginRes.headers['set-cookie']) {
        authToken = loginRes.headers['set-cookie'];
        console.log('Customer authToken set successfully');
      } else {
        console.error('No set-cookie header in login response');
        throw new Error('Customer login did not return authentication cookie');
      }

      // Create test support agent manually in DB
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('Agent1234!', 10);

      const [agentResult] = await db.query(
        `INSERT INTO users (email, password_hash, role) 
         VALUES (?, ?, 'support agent')`,
        [agentEmail, hashedPassword]
      );
      agentId = agentResult.insertId;
      console.log('Agent created successfully:', agentId);

      const agentLoginRes = await request(app).post('/api/users/login').send({
        email: agentEmail,
        password: 'Agent1234!',
      });

      if (agentLoginRes.status !== 200) {
        console.error('Agent login failed:', {
          status: agentLoginRes.status,
          body: agentLoginRes.body,
        });
        throw new Error(`Agent login failed with status ${agentLoginRes.status}`);
      }

      // Extract cookie properly
      if (agentLoginRes.headers['set-cookie']) {
        agentToken = agentLoginRes.headers['set-cookie'];
        console.log('Agent authToken set successfully');
      } else {
        console.error('No set-cookie header in agent login response');
        throw new Error('Agent login did not return authentication cookie');
      }

      // Validate that both tokens are set
      if (!authToken || !agentToken) {
        throw new Error('Authentication tokens were not properly set during test setup');
      }
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Delete test data
    if (chatId) {
      await db.query('DELETE FROM support_chats WHERE chat_id = ?', [chatId]);
    }
    if (customerId) {
      await db.query('DELETE FROM users WHERE user_id = ?', [customerId]);
    }
    if (agentId) {
      await db.query('DELETE FROM users WHERE user_id = ?', [agentId]);
    }
  });

  describe('POST /api/support/chats - Initiate Chat', () => {
    it('should create a new chat for authenticated user', async () => {
      const res = await request(app)
        .post('/api/support/chats')
        .set('Cookie', authToken);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('chat_id');
      expect(res.body.message).toBe('Chat initiated successfully');

      chatId = res.body.chat_id;
    });

    it('should create a new chat for guest user', async () => {
      const res = await request(app).post('/api/support/chats');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('chat_id');
      expect(res.body).toHaveProperty('guest_identifier');
    });
  });

  describe('GET /api/support/chats - Get Customer Chats', () => {
    it('should return chat history for authenticated user', async () => {
      const res = await request(app)
        .get('/api/support/chats')
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/support/chats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/support/chats/:chatId/messages - Get Messages', () => {
    it('should return messages for a chat', async () => {
      const res = await request(app)
        .get(`/api/support/chats/${chatId}/messages`)
        .set('Cookie', authToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('messages');
      expect(Array.isArray(res.body.messages)).toBe(true);
    });

    it('should deny access to unauthorized users', async () => {
      const res = await request(app).get(
        `/api/support/chats/${chatId}/messages`
      );

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/support/queue - Agent Queue', () => {
    it('should return waiting chats for agents', async () => {
      const res = await request(app)
        .get('/api/support/queue')
        .set('Cookie', agentToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });

    it('should require agent role', async () => {
      const res = await request(app)
        .get('/api/support/queue')
        .set('Cookie', authToken);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/support/chats/:chatId/claim - Claim Chat', () => {
    it('should allow agent to claim a waiting chat', async () => {
      const res = await request(app)
        .post(`/api/support/chats/${chatId}/claim`)
        .set('Cookie', agentToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Chat claimed successfully');
    });

    it('should not allow claiming already claimed chat', async () => {
      const res = await request(app)
        .post(`/api/support/chats/${chatId}/claim`)
        .set('Cookie', agentToken);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/support/chats/:chatId/context - Customer Context', () => {
    it('should return customer context for agents', async () => {
      const res = await request(app)
        .get(`/api/support/chats/${chatId}/context`)
        .set('Cookie', agentToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chat');
      expect(res.body.chat).toHaveProperty('customer_profile');
      expect(res.body.chat).toHaveProperty('recent_orders');
      expect(res.body.chat).toHaveProperty('cart_items');
      expect(res.body.chat).toHaveProperty('wishlist_items');
    });
  });

  describe('GET /api/support/active - Active Chats', () => {
    it('should return active chats for agent', async () => {
      const res = await request(app)
        .get('/api/support/active')
        .set('Cookie', agentToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('chats');
      expect(Array.isArray(res.body.chats)).toBe(true);
    });
  });

  describe('PUT /api/support/chats/:chatId/close - Close Chat', () => {
    it('should allow agent to close chat', async () => {
      const res = await request(app)
        .put(`/api/support/chats/${chatId}/close`)
        .set('Cookie', agentToken)
        .send({ status: 'resolved' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Chat status updated successfully');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .put(`/api/support/chats/${chatId}/close`)
        .set('Cookie', agentToken)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });
});

describe('Support Chat Models', () => {
  let SupportChat;
  let SupportMessage;
  let testChatId;
  let testUserId = 1; // Assuming user 1 exists

  beforeAll(async () => {
    // Import models
    SupportChat = await import('../models/SupportChat.js');
    SupportMessage = await import('../models/SupportMessage.js');
  });

  beforeEach(async () => {
    // Create a test chat
    testChatId = await SupportChat.createChat(testUserId, null);
  });

  afterAll(async () => {
    // Cleanup
    if (testChatId) {
      await db.query('DELETE FROM support_chats WHERE chat_id = ?', [
        testChatId,
      ]);
    }
  });

  describe('SupportChat Model', () => {
    it('should create a chat', async () => {
      expect(testChatId).toBeTypeOf('number');
      expect(testChatId).toBeGreaterThan(0);
    });

    it('should retrieve chat by ID', async () => {
      const chat = await SupportChat.getChatById(testChatId);
      expect(chat).toBeTruthy();
      expect(chat.chat_id).toBe(testChatId);
      expect(chat.status).toBe('waiting');
    });

    it('should get waiting chats', async () => {
      const waiting = await SupportChat.getWaitingChats();
      expect(Array.isArray(waiting)).toBe(true);
    });

    it('should claim a chat', async () => {
      const agentId = 1; // Assuming agent user exists
      const success = await SupportChat.claimChat(testChatId, agentId);
      expect(success).toBe(true);

      const chat = await SupportChat.getChatById(testChatId);
      expect(chat.status).toBe('active');
      expect(chat.agent_user_id).toBe(agentId);
    });

    it('should update chat status', async () => {
      const success = await SupportChat.updateChatStatus(testChatId, 'closed');
      expect(success).toBe(true);

      const chat = await SupportChat.getChatById(testChatId);
      expect(chat.status).toBe('closed');
      expect(chat.closed_at).toBeTruthy();
    });
  });

  describe('SupportMessage Model', () => {
    it('should create a message', async () => {
      const messageId = await SupportMessage.createMessage(
        testChatId,
        'customer',
        testUserId,
        'Test message'
      );

      expect(messageId).toBeTypeOf('number');
      expect(messageId).toBeGreaterThan(0);
    });

    it('should retrieve messages by chat ID', async () => {
      await SupportMessage.createMessage(
        testChatId,
        'customer',
        testUserId,
        'Message 1'
      );
      await SupportMessage.createMessage(
        testChatId,
        'agent',
        testUserId,
        'Message 2'
      );

      const messages = await SupportMessage.getMessagesByChatId(testChatId);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should mark messages as read', async () => {
      await SupportMessage.createMessage(
        testChatId,
        'customer',
        testUserId,
        'Unread message'
      );

      const success = await SupportMessage.markMessagesAsRead(
        testChatId,
        'customer'
      );
      expect(success).toBe(true);
    });

    it('should count unread messages', async () => {
      await SupportMessage.createMessage(
        testChatId,
        'customer',
        testUserId,
        'Another message'
      );

      const count = await SupportMessage.getUnreadCount(testChatId, 'customer');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
