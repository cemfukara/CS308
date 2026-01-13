import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

import {
  getChatMessages,
  getChatContext,
  uploadChatAttachment,
  getAttachmentDownloadUrl,
} from '@/lib/supportChatApi';

import { connectSupportSocket, authenticateSupportSocket } from '@/socket/supportSocket';

import styles from '@/pages/Admin/Admin.module.css';

export default function SupportAgentChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);

  const isSupportAgent = useMemo(() => !!user && user.role === 'support agent', [user]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);

  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState(null);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const listenersAttachedRef = useRef(false); // ✅ ADD THIS
  const messagesRef = useRef([]); // ✅ Track current messages for async functions

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    messagesRef.current = messages; // Keep ref in sync
  }, [messages]);

  // 1) Load initial data (REST)
  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        setError('');

        const [msgRes, ctxRes] = await Promise.all([
          getChatMessages(chatId),
          getChatContext(chatId),
        ]);

        if (!mounted) return;
        setMessages(msgRes.messages || []);
        setContext(ctxRes.chat || null);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load chat');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [chatId]);

  // 2) Socket join for realtime
  useEffect(() => {
    if (!isSupportAgent) return;

    if (!socketRef.current) {
      socketRef.current = connectSupportSocket();
    }

    const s = socketRef.current;

    if (listenersAttachedRef.current) return; // 🚨 PREVENT DUPLICATES
    listenersAttachedRef.current = true;

    (async () => {
      try {
        await authenticateSupportSocket();
        s.emit('agent:join-chat', { chatId });
      } catch (e) {
        setError(e?.message || 'Socket auth failed');
      }
    })();

    const onJoined = payload => {
      if (String(payload?.chatId) === String(chatId)) {
        setMessages(payload.messages || []);
      }
    };

    const onNewMessage = msg => {
      if (String(msg?.chat_id) !== String(chatId)) return;
      setMessages(prev => [...prev, msg]);
    };

    const onMessageUpdated = updatedMsg => {
      if (String(updatedMsg?.chat_id) !== String(chatId)) return;
      console.log('📎 Agent received message:updated event:', updatedMsg);
      setMessages(prev =>
        prev.map(m => (m.message_id === updatedMsg.message_id ? updatedMsg : m))
      );
    };

    const onError = e => setError(e?.message || 'Socket error');
    const onChatEnded = payload => {
      if (String(payload?.chatId) !== String(chatId)) return;

      console.log('CHAT ENDED RECEIVED (agent)', payload);

      // now it is safe to leave
      navigate('/admin/support/active');
    };

    s.on('chat:joined', onJoined);
    s.on('message:new', onNewMessage);
    s.on('message:updated', onMessageUpdated);
    s.on('error', onError);
    s.on('chat:ended', onChatEnded);

    return () => {
      s.off('chat:joined', onJoined);
      s.off('message:new', onNewMessage);
      s.off('message:updated', onMessageUpdated);
      s.off('error', onError);
      s.off('chat:ended', onChatEnded);
      listenersAttachedRef.current = false; // ✅ reset on unmount
    };
  }, [isSupportAgent, chatId]);

  function pickFile(e) {
    const f = e.target.files?.[0] || null;
    setPendingFile(f);
    e.target.value = '';
  }

  async function sendAgentMessage() {
    if (!socketRef.current) return;
    if (!input.trim() && !pendingFile) return;

    setError('');
    const s = socketRef.current;

    const text = input.trim();
    const sendingFile = !!pendingFile;
    const placeholderText = text.length ? text : sendingFile ? '📎 Attachment' : '';

    if (placeholderText) {
      s.emit('agent:send-message', { chatId, messageText: placeholderText });
    }

    setInput('');

    if (sendingFile) {
      const file = pendingFile;
      setPendingFile(null);

      const msgId = await waitForLatestAgentMessageId(4000);
      if (!msgId) {
        setError('Could not attach file: messageId not received');
        return;
      }

      try {
        await uploadChatAttachment(chatId, msgId, file);
      } catch (e) {
        setError(e?.message || 'Upload failed');
      }
    }
  }

  function waitForLatestAgentMessageId(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      const tick = () => {
        // Use messagesRef.current to get the latest messages (avoid stale closure)
        const last = [...messagesRef.current].reverse().find(m => m.sender_type === 'agent');
        if (last?.message_id) return resolve(last.message_id);
        if (Date.now() - start > timeoutMs) return resolve(null);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  function handleResolve() {
    const s = socketRef.current;

    if (!s) {
      setError('Socket not connected');
      return;
    }

    console.log('RESOLVE CLICKED', chatId);

    // ONLY emit. The listener is already attached in the useEffect.
    s.emit('agent:resolve-chat', { chatId });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title} style={{ marginBottom: 4 }}>
            Support Chat #{chatId}
          </h2>
          <div className={styles.pageInfo}>
            {context?.status ? `Status: ${context.status}` : ''}
          </div>
        </div>

        <div className={styles.titleActions} style={{ display: 'flex', gap: 10 }}>
          <button className={styles.hideButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <button className={styles.searchButton} onClick={handleResolve}>
            Resolve
          </button>
        </div>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : (
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: '1.6fr 1fr',
            gap: 14,
            alignItems: 'start',
          }}
        >
          {/* CHAT COLUMN */}
          <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 14, borderBottom: '1px solid #e5e7eb' }}>
              <b>Conversation</b>
            </div>

            <div
              style={{ padding: 14, maxHeight: 520, overflowY: 'auto', display: 'grid', gap: 10 }}
            >
              {messages.map(m => (
                <Bubble key={m.message_id} msg={m} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', padding: 12, display: 'flex', gap: 10 }}>
              <label
                className={styles.hideButton}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                📎
                <input
                  hidden
                  type="file"
                  onChange={pickFile}
                  accept="image/*,application/pdf,video/*"
                />
              </label>

              <input
                className={styles.searchInput}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a reply…"
                onKeyDown={e => e.key === 'Enter' && sendAgentMessage()}
              />

              <button className={styles.searchButton} onClick={sendAgentMessage}>
                Send
              </button>
            </div>

            {pendingFile ? (
              <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb' }}>
                <span className={styles.pageInfo}>
                  Attached: <b>{pendingFile.name}</b>
                </span>
                <button
                  className={styles.deleteBtn}
                  style={{ marginLeft: 10 }}
                  onClick={() => setPendingFile(null)}
                >
                  remove
                </button>
              </div>
            ) : null}
          </div>

          {/* CONTEXT SIDEBAR */}
          <div className={styles.card}>
            <h3 style={{ marginTop: 0 }}>Customer Context</h3>
            {!context ? (
              <div className={styles.emptyState}>No context found.</div>
            ) : (
              <>
                <Section title="Profile">
                  {context.customer_profile ? (
                    <>
                      <div>Email: {context.customer_profile.email}</div>
                      <div>User ID: {context.customer_profile.user_id}</div>
                    </>
                  ) : (
                    <div className={styles.pageInfo}>Guest user</div>
                  )}
                </Section>

                <Section title="Recent Orders">
                  {Array.isArray(context.recent_orders) && context.recent_orders.length > 0 ? (
                    context.recent_orders.map(o => (
                      <div
                        key={o.order_id}
                        style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
                      >
                        <div>
                          <b>#{o.order_id}</b> — {o.status}
                        </div>
                        <div className={styles.pageInfo}>
                          {new Date(o.created_at || o.order_date).toLocaleString()} • ₺
                          {o.total_price}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.pageInfo}>No recent orders.</div>
                  )}
                </Section>

                <Section title="Cart Items">
                  {Array.isArray(context.cart_items) && context.cart_items.length > 0 ? (
                    context.cart_items.map(ci => (
                      <div
                        key={ci.product_id}
                        style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
                      >
                        <div>
                          {ci.name} × <b>{ci.quantity}</b>
                        </div>
                        <div className={styles.pageInfo}>₺{ci.price}</div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.pageInfo}>Cart is empty.</div>
                  )}
                </Section>

                <Section title="Wishlist">
                  {Array.isArray(context.wishlist_items) && context.wishlist_items.length > 0 ? (
                    context.wishlist_items.map(w => (
                      <div
                        key={w.product_id}
                        style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}
                      >
                        <div>{w.name}</div>
                        <div className={styles.pageInfo}>₺{w.price}</div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.pageInfo}>Wishlist is empty.</div>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>{children}</div>
    </div>
  );
}

function Bubble({ msg }) {
  // Minimal bubble styling; keeps your layout clean.
  const isAgent = msg?.sender_type === 'agent';

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await fetch(getAttachmentDownloadUrl(attachmentId), {
        method: 'GET',
        credentials: 'include', // Important: send cookies for authentication
      });

      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        alert('Failed to download attachment. Please try again.');
        return;
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'attachment';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: isAgent ? '#eef2ff' : '#ffffff',
        }}
      >
        <div style={{ fontSize: 13 }}>{msg?.message_text}</div>

        {Array.isArray(msg?.attachments) && msg.attachments.length > 0 ? (
          <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
            {msg.attachments.map(a => (
              <button
                key={a.attachment_id || a.url || a.file_name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownloadAttachment(a.attachment_id, a.file_name);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px 0',
                  font: 'inherit',
                  textAlign: 'left',
                  position: 'relative',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
                onMouseLeave={(e) => e.target.style.color = '#2563eb'}
              >
                📎 {a.file_name || 'attachment'}
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.pageInfo} style={{ marginTop: 6 }}>
          {msg?.created_at ? new Date(msg.created_at).toLocaleString() : ''}
        </div>
      </div>
    </div>
  );
}
