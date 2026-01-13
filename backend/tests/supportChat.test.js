// backend/tests/supportChat.test.js

import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import request from 'supertest';

// --------------------------------------------------
// DB MOCK (required by new db.js)
// --------------------------------------------------
vi.mock('../app/config/db.js', () => ({
  db: {
    query: vi.fn(),
  },
}));

// --------------------------------------------------
// IMPORT ROLE CONTROLLER FROM GLOBAL AUTH MOCK
// --------------------------------------------------
import { __setMockRole } from '../app/middlewares/authMiddleware.js';

// Import AFTER mocks
import app from '../app/app.js';
import { db } from '../app/config/db.js';

// --------------------------------------------------
// DB QUERY MOCK IMPLEMENTATION
// --------------------------------------------------
let chatIdCounter = 1;
let messageIdCounter = 1;

const mockDb = () => {
  db.query.mockImplementation(async (sql, params = []) => {
    // ---------------- USERS ----------------
    if (sql.includes('FROM users')) {
      return [[]];
    }

    // ---------------- SUPPORT CHATS ----------------
    if (sql.includes('INSERT INTO support_chats')) {
      return [{ insertId: chatIdCounter++ }];
    }

    if (sql.includes('SELECT') && sql.includes('support_chats')) {
      return [
        [
          {
            chat_id: params[0] ?? 1,
            status: 'waiting',
            agent_user_id: null,
          },
        ],
      ];
    }

    if (sql.includes('UPDATE support_chats')) {
      return [{ affectedRows: 1 }];
    }

    // ---------------- SUPPORT MESSAGES ----------------
    if (sql.includes('INSERT INTO support_messages')) {
      return [{ insertId: messageIdCounter++ }];
    }

    if (sql.includes('SELECT') && sql.includes('support_messages')) {
      return [[{ message: 'Hello' }, { message: 'Hi' }]];
    }

    return [[]];
  });
};

// --------------------------------------------------
// CONTROLLER TESTS
// --------------------------------------------------
describe('Support Chat System (Controllers)', () => {
  let chatId;

  beforeAll(() => {
    mockDb();
  });

  beforeEach(() => {
    __setMockRole('customer');
  });

  it('creates a new chat for authenticated user', async () => {
    const res = await request(app).post('/api/support/chats');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('chat_id');

    chatId = res.body.chat_id;
  });

  it('creates a new chat for guest user', async () => {
    __setMockRole(null);

    const res = await request(app).post('/api/support/chats');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('chat_id');
    expect(res.body).toHaveProperty('guest_identifier');
  });

  it('returns chat history for customer', async () => {
    const res = await request(app).get('/api/support/chats');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chats)).toBe(true);
  });

  it('returns messages for a chat', async () => {
    const res = await request(app).get(`/api/support/chats/${chatId}/messages`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });

  it('returns waiting chats for agent', async () => {
    __setMockRole('support agent');

    const res = await request(app).get('/api/support/queue');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chats)).toBe(true);
  });

  it('allows agent to claim a chat', async () => {
    __setMockRole('support agent');

    const res = await request(app).post(`/api/support/chats/${chatId}/claim`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/claimed/i);
  });

  it('returns customer context for agent', async () => {
    __setMockRole('support agent');

    const res = await request(app).get(`/api/support/chats/${chatId}/context`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('chat');
  });

  it('returns active chats for agent', async () => {
    __setMockRole('support agent');

    const res = await request(app).get('/api/support/active');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.chats)).toBe(true);
  });

  it('allows agent to close chat', async () => {
    __setMockRole('support agent');

    const res = await request(app)
      .put(`/api/support/chats/${chatId}/close`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  it('rejects invalid status update', async () => {
    __setMockRole('support agent');

    const res = await request(app)
      .put(`/api/support/chats/${chatId}/close`)
      .send({ status: 'invalid_status' });

    expect(res.status).toBe(400);
  });
});

// --------------------------------------------------
// MODEL TESTS
// --------------------------------------------------
describe('Support Chat Models', () => {
  let SupportChat;
  let SupportMessage;
  let testChatId;

  beforeAll(async () => {
    mockDb();
    SupportChat = await import('../models/SupportChat.js');
    SupportMessage = await import('../models/SupportMessage.js');
  });

  beforeEach(async () => {
    testChatId = await SupportChat.createChat(1, null);
  });

  it('creates a chat', async () => {
    expect(testChatId).toBeTypeOf('number');
  });

  it('retrieves chat by ID', async () => {
    const chat = await SupportChat.getChatById(testChatId);
    expect(chat.chat_id).toBe(testChatId);
  });

  it('claims a chat', async () => {
    const success = await SupportChat.claimChat(testChatId, 2);
    expect(success).toBe(true);
  });

  it('updates chat status', async () => {
    const success = await SupportChat.updateChatStatus(testChatId, 'closed');
    expect(success).toBe(true);
  });

  it('creates a message', async () => {
    const messageId = await SupportMessage.createMessage(
      testChatId,
      'customer',
      1,
      'Test message'
    );

    expect(messageId).toBeTypeOf('number');
  });

  it('retrieves messages by chat ID', async () => {
    const messages = await SupportMessage.getMessagesByChatId(testChatId);
    expect(Array.isArray(messages)).toBe(true);
  });
});
