// src/socket/supportSocket.js

import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '') ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5173';

let socket = null;

export function connectSupportSocket() {
  if (socket && socket.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true, // cookie auth if needed
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function getSupportSocket() {
  return socket;
}

export function disconnectSupportSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Authenticate socket using either:
 * - token (logged in user)
 * - guestId (guest chat)
 */
export function authenticateSupportSocket({ token, guestId }) {
  const s = connectSupportSocket();

  return new Promise((resolve, reject) => {
    const onOk = payload => {
      s.off('authenticated', onOk);
      s.off('connect_error', onErr);
      if (payload?.success) resolve(payload);
      else reject(new Error(payload?.error || 'Socket auth failed'));
    };

    const onErr = err => {
      s.off('authenticated', onOk);
      s.off('connect_error', onErr);
      reject(err);
    };

    s.on('authenticated', onOk);
    s.on('connect_error', onErr);

    s.emit('authenticate', { token, guestId });
  });
}
