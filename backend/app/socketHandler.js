// backend/app/socketHandler.js
// Socket.io event handlers for real-time chat communication

import * as SupportChat from '../models/SupportChat.js';
import * as SupportMessage from '../models/SupportMessage.js';
import jwt from 'jsonwebtoken';

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    let currentUser = null;
    let currentChatId = null;

    // Authenticate socket connection
    socket.on('authenticate', async (data) => {
      try {
        const { token, guestId } = data;

        if (token) {
          // Authenticated user
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          currentUser = {
            user_id: decoded.user_id,
            role: decoded.role,
            email: decoded.email,
            isGuest: false,
          };
        } else if (guestId) {
          // Guest user
          currentUser = {
            guest_id: guestId,
            isGuest: true,
          };
        }

        socket.emit('authenticated', { success: true, user: currentUser });
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    // Customer joins a chat room
    socket.on('customer:join-chat', async (data) => {
      try {
        const { chatId } = data;

        // Verify chat access
        const chat = await SupportChat.getChatById(chatId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        // Check permission
        const hasAccess =
          (currentUser &&
            !currentUser.isGuest &&
            chat.user_id === currentUser.user_id) ||
          (currentUser &&
            currentUser.isGuest &&
            chat.guest_identifier === currentUser.guest_id);

        if (!hasAccess) {
          return socket.emit('error', { message: 'Access denied' });
        }

        currentChatId = chatId;
        socket.join(`chat_${chatId}`);

        // Get chat messages
        const messages = await SupportMessage.getMessagesByChatId(chatId);

        socket.emit('chat:joined', { chatId, messages });
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Customer sends a message
    socket.on('customer:send-message', async (data) => {
      try {
        const { chatId, messageText } = data;

        if (!currentChatId || currentChatId != chatId) {
          return socket.emit('error', { message: 'Not in this chat room' });
        }

        const senderUserId = currentUser?.isGuest
          ? null
          : currentUser?.user_id;

        // Create message
        const messageId = await SupportMessage.createMessage(
          chatId,
          'customer',
          senderUserId,
          messageText
        );

        // Get the created message
        const message = await SupportMessage.getMessageById(messageId);

        // Broadcast to all in the chat room
        io.to(`chat_${chatId}`).emit('message:new', {
          ...message,
          attachments: [],
        });

        // Notify agent queue if chat is waiting
        const chat = await SupportChat.getChatById(chatId);
        if (chat.status === 'waiting') {
          io.to('agent_queue').emit('queue:update');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Agent joins the queue room
    socket.on('agent:join-queue', async () => {
      try {
        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.join('agent_queue');

        // Send current waiting chats
        const waitingChats = await SupportChat.getWaitingChats();
        socket.emit('queue:chats', { chats: waitingChats });
      } catch (error) {
        console.error('Error joining queue:', error);
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    // Agent claims a chat
    socket.on('agent:claim-chat', async (data) => {
      try {
        const { chatId } = data;

        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        const success = await SupportChat.claimChat(
          chatId,
          currentUser.user_id
        );

        if (!success) {
          return socket.emit('error', {
            message: 'Chat not available or already claimed',
          });
        }

        // Join the chat room
        currentChatId = chatId;
        socket.join(`chat_${chatId}`);

        // Get chat with context
        const chatWithContext =
          await SupportChat.getChatWithCustomerContext(chatId);
        const messages = await SupportMessage.getMessagesByChatId(chatId);

        socket.emit('chat:claimed', {
          chat: chatWithContext,
          messages,
        });

        // Notify customer that agent joined
        io.to(`chat_${chatId}`).emit('agent:joined', {
          agent_email: currentUser.email,
        });

        // Update agent queue
        io.to('agent_queue').emit('queue:update');
      } catch (error) {
        console.error('Error claiming chat:', error);
        socket.emit('error', { message: 'Failed to claim chat' });
      }
    });

    // Agent joins an already-claimed chat
    socket.on('agent:join-chat', async (data) => {
      try {
        const { chatId } = data;

        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        const chat = await SupportChat.getChatById(chatId);
        if (!chat || chat.agent_user_id !== currentUser.user_id) {
          return socket.emit('error', { message: 'Access denied' });
        }

        currentChatId = chatId;
        socket.join(`chat_${chatId}`);

        const messages = await SupportMessage.getMessagesByChatId(chatId);
        socket.emit('chat:joined', { chatId, messages });
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Agent sends a message
    socket.on('agent:send-message', async (data) => {
      try {
        const { chatId, messageText } = data;

        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        if (!currentChatId || currentChatId != chatId) {
          return socket.emit('error', { message: 'Not in this chat room' });
        }

        // Create message
        const messageId = await SupportMessage.createMessage(
          chatId,
          'agent',
          currentUser.user_id,
          messageText
        );

        // Get the created message
        const message = await SupportMessage.getMessageById(messageId);

        // Broadcast to all in the chat room
        io.to(`chat_${chatId}`).emit('message:new', {
          ...message,
          sender_email: currentUser.email,
          attachments: [],
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { chatId, userType } = data;
      socket.to(`chat_${chatId}`).emit('typing:user', { userType });
    });

    socket.on('typing:stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('typing:stop');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
