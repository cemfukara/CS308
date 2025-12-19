// src/api/supportChatApi.js

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5173';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // IMPORTANT: cookie-based auth
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const message =
      (data && data.message) || (typeof data === 'string' && data) || 'Request failed';
    throw new Error(message);
  }

  return data;
}

// --------------------
// CUSTOMER ENDPOINTS
// --------------------

export async function initiateChat() {
  // POST /api/support/chats
  return request(`/api/support/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getChatMessages(chatId) {
  // GET /api/support/chats/:chatId/messages
  return request(`/api/support/chats/${chatId}/messages`);
}

export async function uploadChatAttachment(chatId, messageId, file) {
  // POST /api/support/chats/:chatId/attachments
  // expects upload.single('file') + messageId in body  :contentReference[oaicite:0]{index=0}
  const form = new FormData();
  form.append('file', file);
  form.append('messageId', String(messageId));

  const res = await fetch(`${API_BASE}/api/support/chats/${chatId}/attachments`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

export function getAttachmentDownloadUrl(attachmentId) {
  // GET /api/support/attachments/:attachmentId
  return `${API_BASE}/api/support/attachments/${attachmentId}`;
}

// --------------------
// AGENT ENDPOINTS
// --------------------

export async function getWaitingQueue() {
  // GET /api/support/queue
  return request(`/api/support/queue`);
}

export async function getAgentActiveChats() {
  // GET /api/support/active
  return request(`/api/support/active`);
}

export async function claimChat(chatId) {
  // POST /api/support/chats/:chatId/claim
  return request(`/api/support/chats/${chatId}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getChatContext(chatId) {
  // GET /api/support/chats/:chatId/context
  return request(`/api/support/chats/${chatId}/context`);
}

export async function closeChat(chatId, status) {
  // PUT /api/support/chats/:chatId/close with {status: 'resolved'|'closed'}
  return request(`/api/support/chats/${chatId}/close`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
