// src/socket/supportSocket.js

import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '') ||
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:5000';

let socket = null;

export function connectSupportSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true, // ✅ cookies sent automatically
    transports: ['websocket'],
    autoConnect: false,
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
 * Authenticate socket
 * - Logged-in users → cookie (automatic)
 * - Guests → guestId
 */
export function authenticateSupportSocket({ guestId } = {}) {
  const s = connectSupportSocket();

  return new Promise((resolve, reject) => {
    const onOk = payload => {
      cleanup();
      if (payload?.success) resolve(payload);
      else reject(new Error(payload?.error || 'Socket auth failed'));
    };

    const onErr = err => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      s.off('authenticated', onOk);
      s.off('connect_error', onErr);
    };

    if (!s.connected) {
      s.connect();
    }

    s.on('authenticated', onOk);
    s.on('connect_error', onErr);

    // ✅ DO NOT SEND TOKEN
    s.emit('authenticate', {
      guestId,
    });
  });
}