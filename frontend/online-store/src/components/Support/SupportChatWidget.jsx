import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './SupportChatWidget.module.css';

import {
  initiateChat,
  uploadChatAttachment,
  getAttachmentDownloadUrl,
} from '../../lib/supportChatApi';

import { connectSupportSocket, authenticateSupportSocket } from '../../socket/supportSocket';

const GUEST_ID_KEY = 'support_guest_id';

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState(null);
  // null | 'waiting' | 'active' | 'ended'
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const activeChatIdRef = useRef(null);
  const listenersAttachedRef = useRef(false); // ✅ ONLY NEW REF
  const messagesRef = useRef([]); // ✅ Track current messages for async functions

  /* -----------------------------
     Restore guestId on first load
  ------------------------------ */
  useEffect(() => {
    const storedGuestId = localStorage.getItem(GUEST_ID_KEY);
    if (storedGuestId) {
      setGuestId(storedGuestId);
    }
  }, []);

  const canSend = useMemo(
    () =>
      chatStatus === 'active' &&
      (input.trim().length > 0 || !!pendingFile),
    [chatStatus, input, pendingFile]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    messagesRef.current = messages; // Keep ref in sync
  }, [messages]);

  async function openChat() {
    setOpen(true);

    let activeChatId = null;
    let activeGuestId = guestId || localStorage.getItem(GUEST_ID_KEY);

    /* -----------------------------
       Create / resume chat
    ------------------------------ */
    if (!activeChatId) {
      const data = await initiateChat();

      activeChatId = data.chat_id;
      activeChatIdRef.current = activeChatId;
      setMessages([]);
      setChatId(activeChatId);
      setChatStatus('waiting');

      if (data.guest_identifier) {
        activeGuestId = data.guest_identifier;
        setGuestId(activeGuestId);
        localStorage.setItem(GUEST_ID_KEY, activeGuestId);
      }
    } else {
      activeChatIdRef.current = activeChatId;
    }

    /* -----------------------------
       Connect & authenticate socket
    ------------------------------ */
    if (!socketRef.current) {
      socketRef.current = connectSupportSocket();

      // Logged-in users authenticate via cookies (withCredentials: true)
      // Guests authenticate via guestId
      await authenticateSupportSocket({ guestId: activeGuestId || undefined });

      socketRef.current.emit('customer:join-chat', {
        chatId: activeChatId,
      });

      socketRef.current.on('connect', () => {
        const activeId = activeChatIdRef.current;
        if (activeId) {
          socketRef.current.emit('customer:join-chat', { chatId: activeId });
        }
      });

      /* -----------------------------
         ATTACH SOCKET LISTENERS (ONCE)
      ------------------------------ */
      if (!listenersAttachedRef.current) {
        listenersAttachedRef.current = true;

        socketRef.current.on('agent:joined', () => {
          const activeId = activeChatIdRef.current;
          if (!activeId) return;
          setChatStatus('active');
        });

        socketRef.current.on('chat:ended', payload => {
          console.log('🔥 RAW chat:ended payload (customer)', payload);
          console.log('🔥 activeChatIdRef.current', activeChatIdRef.current);

          const endedChatId = payload?.chatId;

          if (String(activeChatIdRef.current) !== String(endedChatId)) {
            console.log('❌ chat:ended ignored – chatId mismatch');
            return;
          }

          console.log('✅ CHAT ENDED CONFIRMED (customer)');

          setChatStatus('ended');
          setInput('');
          setPendingFile(null);
        });

        socketRef.current.on('chat:joined', payload => {
          setMessages(payload.messages || []);
        });

        socketRef.current.on('message:new', message => {
          setMessages(prev => [...prev, message]);
        });

        socketRef.current.on('message:updated', updatedMessage => {
          console.log('📎 Received message:updated event:', updatedMessage);
          setMessages(prev =>
            prev.map(m =>
              m.message_id === updatedMessage.message_id ? updatedMessage : m
            )
          );
        });

        socketRef.current.on('error', e => {
          setError(e.message || 'Socket error');
        });
      }
    }
  }
  function detachSocketListeners(socket) {
    if (!socket) return;

    socket.off('agent:joined');
    socket.off('chat:ended');
    socket.off('chat:joined');
    socket.off('message:new');
    socket.off('message:updated');
    socket.off('error');
  }
  function resetChat() {
    setChatId(null);
    setMessages([]);
    setChatStatus(null);
    setInput('');
    setPendingFile(null);

    activeChatIdRef.current = null;

    // ✅ allow openChat() to attach listeners again
    listenersAttachedRef.current = false;

    // ✅ force a fresh socket + fresh room join on next openChat()
    if (socketRef.current) {
      detachSocketListeners(socketRef.current); // 👈 THIS IS THE FIX
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }

  async function sendMessage() {
    if (chatStatus !== 'active') return;
    const activeId = chatId || activeChatIdRef.current;
    if (!canSend || !socketRef.current || !activeId) return;

    const text = input.trim();
    const sendingFile = !!pendingFile;
    const messageText = text.length ? text : sendingFile ? '📎 Attachment' : '';

    // Send message via socket
    socketRef.current.emit('customer:send-message', {
      chatId: activeId,
      messageText,
    });

    setInput('');

    // If there's a file, upload it after the message is created
    if (sendingFile) {
      const file = pendingFile;
      setPendingFile(null);

      try {
        // Wait for the message to appear in the messages array
        const msgId = await waitForLatestCustomerMessageId(4000);
        if (!msgId) {
          console.error('Could not get message ID for attachment upload');
          return;
        }

        console.log('Uploading attachment for message:', msgId);

        // Upload the attachment
        await uploadChatAttachment(activeId, msgId, file);

        console.log('Attachment uploaded successfully');
        // No need to re-join - message:updated listener will handle the update
      } catch (error) {
        console.error('Failed to upload attachment:', error);
      }
    }
  }

  function waitForLatestCustomerMessageId(timeoutMs) {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        // Use messagesRef.current to get the latest messages (avoid stale closure)
        const last = [...messagesRef.current].reverse().find(m => m.sender_type === 'customer');
        if (last?.message_id) return resolve(last.message_id);
        if (Date.now() - start > timeoutMs) return resolve(null);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  return (
    <>
      <button
        className={styles.fab}
        onClick={open ? () => setOpen(false) : openChat}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <div>
                <div className={styles.title}>Support</div>
                <div className={styles.sub}>We’re here to help</div>
              </div>
              <button
                className={styles.headerBtn}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.messages}>
              {chatStatus === 'waiting' && (
                <div className={styles.systemMessage}>Waiting for agent…</div>
              )}
              {chatStatus === 'active' && (
                <div className={styles.systemMessage}>Chat started</div>
              )}
              {chatStatus === 'ended' && (
                <div className={styles.systemMessage}>Chat ended</div>
              )}
              {chatStatus === 'ended' && (
                <div className={styles.systemActions}>
                  <button
                    className={styles.newChatBtn}
                    onClick={() => {
                      resetChat();
                      setOpen(false);

                      // let React finish resetting state
                      setTimeout(() => {
                        openChat();
                      }, 0);
                    }}
                  >
                    Start new chat
                  </button>
                </div>
              )}

              {messages.map(m => (
                <MessageBubble key={m.message_id} msg={m} />
              ))}

              <div ref={bottomRef} />
            </div>

            <div className={styles.composer}>
              <label className={styles.attachBtn}>
                📎
                <input
                  type="file"
                  hidden
                  onChange={e => setPendingFile(e.target.files[0])}
                />
              </label>

              <input
                className={styles.input}
                value={input}
                disabled={chatStatus !== 'active'}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  chatStatus === 'ended'
                    ? 'Chat has ended'
                    : 'Type a message…'
                }
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />

              <button
                className={styles.sendBtn}
                disabled={!canSend}
                onClick={sendMessage}
              >
                Send
              </button>
            </div>

            {pendingFile && (
              <div className={styles.fileChip}>
                Attached: {pendingFile.name}
                <button
                  className={styles.fileChipRemove}
                  onClick={() => setPendingFile(null)}
                >
                  remove
                </button>
              </div>
            )}

            <div className={styles.footerHint}>
              Images, PDFs, and videos are supported
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }) {
  const mine = msg.sender_type === 'customer';

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
    <div className={`${styles.bubbleRow} ${mine ? styles.mine : styles.theirs}`}>
      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {msg.message_text && <div className={styles.text}>{msg.message_text}</div>}

        {msg.attachments?.length > 0 && (
          <div className={styles.attachments}>
            {msg.attachments.map(a => (
              <button
                key={a.attachment_id}
                onClick={() => handleDownloadAttachment(a.attachment_id, a.file_name)}
                className={styles.attachmentLink}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  font: 'inherit',
                }}
              >
                📄 {a.file_name}
              </button>
            ))}
          </div>
        )}

        <div className={styles.meta}>
          {new Date(msg.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
}