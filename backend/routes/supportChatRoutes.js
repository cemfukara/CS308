// backend/routes/supportChatRoutes.js
// Routes for support chat REST API

import express from 'express';
import * as supportChatController from '../app/controllers/supportChatController.js';
import {
  authenticate,
  optionalAuthenticate,
  authorizeRoles,
} from '../app/middlewares/authMiddleware.js';
import upload from '../app/middlewares/uploadMiddleware.js';

const router = express.Router();

// ============================================================
// CUSTOMER ENDPOINTS (authenticated or guest)
// ============================================================

// Initiate new chat (optional auth - supports both authenticated users and guests)
router.post(
  '/chats',
  optionalAuthenticate,
  supportChatController.initiateChat
);

// Get my chat history (auth required)
router.get('/chats', authenticate, supportChatController.getCustomerChats);

// Get messages for a specific chat (optional auth - supports both authenticated users and guests)
router.get(
  '/chats/:chatId/messages',
  optionalAuthenticate,
  supportChatController.getChatMessages
);

// Upload attachment to a message (optional auth - supports both authenticated users and guests)
router.post(
  '/chats/:chatId/attachments',
  optionalAuthenticate,
  upload.single('file'),
  supportChatController.uploadAttachment
);

// Download attachment (optional auth - supports agents, authenticated users, and guests)
router.get(
  '/attachments/:attachmentId',
  optionalAuthenticate,
  supportChatController.downloadAttachment
);

// ============================================================
// AGENT ENDPOINTS (require 'support agent' role)
// ============================================================

// Get waiting chats queue
router.get(
  '/queue',
  authenticate,
  authorizeRoles(['support agent']),
  supportChatController.getWaitingQueue
);

// Get agent's active chats
router.get(
  '/active',
  authenticate,
  authorizeRoles(['support agent']),
  supportChatController.getActiveChats
);

// Claim a chat from queue
router.post(
  '/chats/:chatId/claim',
  authenticate,
  authorizeRoles(['support agent']),
  supportChatController.claimChat
);

// Get chat with customer context
router.get(
  '/chats/:chatId/context',
  authenticate,
  authorizeRoles(['support agent']),
  supportChatController.getChatWithContext
);

// Close/resolve a chat
router.put(
  '/chats/:chatId/close',
  authenticate,
  authorizeRoles(['support agent']),
  supportChatController.closeChat
);

export default router;
