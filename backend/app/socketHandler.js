// backend/app/socketHandler.js
// Socket.io event handlers for real-time chat communication

import * as SupportChat from '../models/SupportChat.js';
import * as SupportMessage from '../models/SupportMessage.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import logger from '../utils/logger.js';

/**
 * Initialize Socket.io event handlers
 * @param {Server} io - Socket.io server instance
 */
export function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
    });

    let currentUser = null;
    let currentChatId = null;

    // -----------------------------
    // AUTHENTICATE SOCKET
    // -----------------------------
    socket.on('authenticate', async (data) => {
      try {
        const { token, guestId } = data || {};

        let jwtToken = token;

        // 🔑 FALLBACK: read token from cookies (MAIN FIX)
        if (!jwtToken && socket.handshake.headers.cookie) {
          const cookies = cookie.parse(socket.handshake.headers.cookie);
          jwtToken = cookies.token;
        }

        if (jwtToken) {
          const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
          currentUser = {
            user_id: decoded.user_id,
            role: decoded.role,
            email: decoded.email,
            isGuest: false,
          };

          socket.currentUser = currentUser;
        } else if (guestId) {
          currentUser = {
            guest_id: guestId,
            isGuest: true,
          };
          socket.currentUser = currentUser;
        } else {
          currentUser = null;
        }

        logger.info('Socket authenticated', {
          socketId: socket.id,
          user: currentUser,
          authType: jwtToken ? 'jwt' : 'guest',
        });

        socket.emit('authenticated', { success: true, user: currentUser });
      } catch (error) {
        logger.warn('Socket authentication failed', {
          socketId: socket.id,
          error: error.message,
        });
        socket.emit('authenticated', {
          success: false,
          error: 'Invalid token',
        });
      }
    });

    // -----------------------------
    // CUSTOMER JOINS CHAT
    // -----------------------------
    socket.on('customer:join-chat', async ({ chatId }) => {
      try {
        const chat = await SupportChat.getChatById(chatId);
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

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

        logger.info('Customer joined chat', {
          socketId: socket.id,
          chatId,
          user: currentUser,
        });

        const messages = await SupportMessage.getMessagesByChatId(chatId);
        socket.emit('chat:joined', { chatId, messages });
      } catch (err) {
        logger.error('Customer failed to join chat', {
          socketId: socket.id,
          chatId,
          error: err,
        });
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // -----------------------------
    // CUSTOMER SEND MESSAGE
    // -----------------------------
    socket.on('customer:send-message', async ({ chatId, messageText }) => {
      try {
        socket.join(`chat_${chatId}`);
        const senderUserId = currentUser?.isGuest ? null : currentUser?.user_id;

        const messageId = await SupportMessage.createMessage(
          chatId,
          'customer',
          senderUserId,
          messageText
        );

        const message = await SupportMessage.getMessageById(messageId);

        io.to(`chat_${chatId}`).emit('message:new', {
          ...message,
          attachments: [],
        });

        const chat = await SupportChat.getChatById(chatId);
        if (chat.status === 'waiting') {
          io.to('agent_queue').emit('queue:update');
        }

        logger.info('Customer sent message', {
          chatId,
          socketId: socket.id,
          sender: currentUser,
          messageLength: messageText?.length,
        });
      } catch (err) {
        logger.error('Customer message failed', {
          chatId,
          socketId: socket.id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // -----------------------------
    // AGENT JOINS QUEUE
    // -----------------------------
    socket.on('agent:join-queue', async () => {
      try {
        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.join('agent_queue');
        const waitingChats = await SupportChat.getWaitingChats();
        socket.emit('queue:chats', { chats: waitingChats });

        logger.info('Agent joined queue', {
          socketId: socket.id,
          agentId: currentUser.user_id,
          email: currentUser.email,
        });
      } catch (err) {
        logger.error('Agent failed to join queue', {
          socketId: socket.id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    // -----------------------------
    // AGENT CLAIMS CHAT
    // -----------------------------
    socket.on('agent:claim-chat', async ({ chatId }) => {
      try {
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

        currentChatId = chatId;
        socket.join(`chat_${chatId}`);

        const chat = await SupportChat.getChatWithCustomerContext(chatId);
        const messages = await SupportMessage.getMessagesByChatId(chatId);

        socket.emit('chat:claimed', { chat, messages });
        io.to('agent_queue').emit('queue:update');
        io.to(`chat_${chatId}`).emit('agent:joined', {
          agent_email: currentUser.email,
        });

        logger.info('Chat claimed by agent', {
          chatId,
          agentId: currentUser.user_id,
          socketId: socket.id,
        });
      } catch (err) {
        logger.error('Agent failed to claim chat', {
          chatId,
          agentId: currentUser?.user_id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to claim chat' });
      }
    });

    // -----------------------------
    // AGENT JOINS CHAT
    // -----------------------------
    socket.on('agent:join-chat', async ({ chatId }) => {
      try {
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
      } catch (err) {
        logger.error('Agent failed to join chat', {
          socketId: socket.id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // -----------------------------
    // AGENT SEND MESSAGE
    // -----------------------------
    socket.on('agent:send-message', async ({ chatId, messageText }) => {
      try {
        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        if (!currentChatId || currentChatId != chatId) {
          return socket.emit('error', { message: 'Not in this chat room' });
        }

        const messageId = await SupportMessage.createMessage(
          chatId,
          'agent',
          currentUser.user_id,
          messageText
        );

        const message = await SupportMessage.getMessageById(messageId);

        io.to(`chat_${chatId}`).emit('message:new', {
          ...message,
          sender_email: currentUser.email,
          attachments: [],
        });

        logger.info('Agent sent message', {
          chatId,
          agentId: currentUser.user_id,
          messageLength: messageText?.length,
        });
      } catch (err) {
        logger.error('Agent message failed', {
          chatId,
          agentId: currentUser?.user_id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    // -----------------------------
    // AGENT RESOLVES CHAT  ✅ FIXED
    // -----------------------------
    socket.on('agent:resolve-chat', async ({ chatId }) => {
      try {
        if (!currentUser || currentUser.role !== 'support agent') {
          return socket.emit('error', { message: 'Access denied' });
        }

        if (!currentChatId || currentChatId !== chatId) {
          return socket.emit('error', { message: 'Not in this chat room' });
        }

        // 1️⃣ Update DB
        await SupportChat.updateChatStatus(chatId, 'resolved');

        // 2️⃣ Emit to agent (always works)
        socket.emit('chat:ended', {
          chatId,
          status: 'resolved',
        });

        // 3️⃣ Emit to EVERY socket that EVER joined the room
        io.to(`chat_${chatId}`).emit('chat:ended', {
          chatId,
          status: 'resolved',
        });

        // 4️⃣ 🔑 SAFETY NET: fetch chat & emit directly
        const chat = await SupportChat.getChatById(chatId);

        if (chat?.guest_identifier) {
          for (const [id, s] of io.of('/').sockets) {
            if (s.currentUser?.guest_id === chat.guest_identifier) {
              s.emit('chat:ended', { chatId, status: 'resolved' });
            }
          }
        }

        if (chat?.user_id) {
          for (const [id, s] of io.of('/').sockets) {
            if (s.currentUser?.user_id === chat.user_id) {
              s.emit('chat:ended', { chatId, status: 'resolved' });
            }
          }
        }
        logger.info('Chat resolved', {
          chatId,
          agentId: currentUser.user_id,
        });
      } catch (err) {
        logger.error('Failed to resolve chat', {
          chatId,
          agentId: currentUser?.user_id,
          error: err,
        });
        socket.emit('error', { message: 'Failed to resolve chat' });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        reason,
        user: socket.currentUser,
      });
    });
  });

  return io;
}
