// backend/app/controllers/supportChatController.js
// Controllers for support chat REST API endpoints

import * as SupportChat from '../../models/SupportChat.js';
import * as SupportMessage from '../../models/SupportMessage.js';
import * as SupportAttachment from '../../models/SupportAttachment.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * Initiate a new support chat
 * POST /api/support/chats
 */
export async function initiateChat(req, res) {
  try {
    const userId = req.user?.user_id || null;
    let guestIdentifier = null;

    // For guest users, generate or retrieve guest identifier from cookie
    if (!userId) {
      guestIdentifier = req.cookies.guest_id || uuidv4();

      // Set cookie for guest user
      res.cookie('guest_id', guestIdentifier, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
      });
    }

    const chatId = await SupportChat.createChat(userId, guestIdentifier);

    res.status(201).json({
      message: 'Chat initiated successfully',
      chat_id: chatId,
      guest_identifier: guestIdentifier,
    });
  } catch (error) {
    console.error('Error initiating chat:', error);
    res.status(500).json({ message: 'Failed to initiate chat' });
  }
}

/**
 * Get customer's chat history (authenticated users only)
 * GET /api/support/chats
 */
export async function getCustomerChats(req, res) {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Authentication required to view chat history' });
    }

    const chats = await SupportChat.getChatsByUserId(userId);

    res.json({ chats });
  } catch (error) {
    console.error('Error fetching customer chats:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
}

/**
 * Get messages for a specific chat
 * GET /api/support/chats/:chatId/messages
 */
export async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;
    const userId = req.user?.user_id;
    const guestId = req.cookies.guest_id;

    // Verify access to this chat
    const chat = await SupportChat.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check permission: must be owner, agent, or guest with matching ID
    const isOwner = userId && chat.user_id === userId;
    const isAgent =
      req.user?.role === 'support agent' && chat.agent_user_id === userId;
    const isGuest = !chat.user_id && chat.guest_identifier === guestId;

    if (!isOwner && !isAgent && !isGuest) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await SupportMessage.getMessagesByChatId(chatId);

    // Mark messages as read based on user type
    if (isAgent) {
      await SupportMessage.markMessagesAsRead(chatId, 'customer');
    } else {
      await SupportMessage.markMessagesAsRead(chatId, 'agent');
    }

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

/**
 * Upload file attachment
 * POST /api/support/chats/:chatId/attachments
 */
export async function uploadAttachment(req, res) {
  try {
    const { chatId } = req.params;
    const { messageId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    // Verify message belongs to this chat
    const message = await SupportMessage.getMessageById(messageId);
    if (!message || message.chat_id != chatId) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const fileData = {
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_size: req.file.size,
    };

    const attachmentId = await SupportAttachment.createAttachment(
      messageId,
      fileData
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment_id: attachmentId,
      file_name: req.file.originalname,
      file_size: req.file.size,
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
}

/**
 * Download/serve attachment file
 * GET /api/support/attachments/:attachmentId
 */
export async function downloadAttachment(req, res) {
  try {
    const { attachmentId } = req.params;
    const userId = req.user?.user_id;
    const guestId = req.cookies.guest_id;

    // Get attachment with chat context for permission check
    const attachment =
      await SupportAttachment.getAttachmentWithChatContext(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check permission
    const isOwner = userId && attachment.user_id === userId;
    const isAgent =
      req.user?.role === 'support agent' && attachment.agent_user_id === userId;
    const isGuest =
      !attachment.user_id && attachment.guest_identifier === guestId;

    if (!isOwner && !isAgent && !isGuest) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Send file
    res.download(attachment.file_path, attachment.file_name);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
}

/**
 * Get chat with customer context (for agents)
 * GET /api/support/chats/:chatId/context
 */
export async function getChatWithContext(req, res) {
  try {
    const { chatId } = req.params;

    const chatWithContext =
      await SupportChat.getChatWithCustomerContext(chatId);

    if (!chatWithContext) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ chat: chatWithContext });
  } catch (error) {
    console.error('Error fetching chat context:', error);
    res.status(500).json({ message: 'Failed to fetch chat context' });
  }
}

/**
 * Get waiting chats queue (for agents)
 * GET /api/support/queue
 */
export async function getWaitingQueue(req, res) {
  try {
    const waitingChats = await SupportChat.getWaitingChats();

    res.json({ chats: waitingChats });
  } catch (error) {
    console.error('Error fetching waiting queue:', error);
    res.status(500).json({ message: 'Failed to fetch waiting queue' });
  }
}

/**
 * Get agent's active chats
 * GET /api/support/active
 */
export async function getActiveChats(req, res) {
  try {
    const agentUserId = req.user.user_id;

    const activeChats = await SupportChat.getActiveChats(agentUserId);

    res.json({ chats: activeChats });
  } catch (error) {
    console.error('Error fetching active chats:', error);
    res.status(500).json({ message: 'Failed to fetch active chats' });
  }
}

/**
 * Claim a chat from the queue (for agents)
 * POST /api/support/chats/:chatId/claim
 */
export async function claimChat(req, res) {
  try {
    const { chatId } = req.params;
    const agentUserId = req.user.user_id;

    const success = await SupportChat.claimChat(chatId, agentUserId);

    if (!success) {
      return res
        .status(400)
        .json({ message: 'Chat is not available or already claimed' });
    }

    res.json({ message: 'Chat claimed successfully' });
  } catch (error) {
    console.error('Error claiming chat:', error);
    res.status(500).json({ message: 'Failed to claim chat' });
  }
}

/**
 * Close/resolve a chat
 * PUT /api/support/chats/:chatId/close
 */
export async function closeChat(req, res) {
  try {
    const { chatId } = req.params;
    const { status } = req.body; // 'resolved' or 'closed'

    if (!['resolved', 'closed'].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'resolved' or 'closed'" });
    }

    const success = await SupportChat.updateChatStatus(chatId, status);

    if (!success) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json({ message: 'Chat status updated successfully' });
  } catch (error) {
    console.error('Error closing chat:', error);
    res.status(500).json({ message: 'Failed to close chat' });
  }
}
