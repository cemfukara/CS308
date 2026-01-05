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

      if (!activeGuestId) {
        throw new Error('Guest ID missing during socket authentication');
      }

      await authenticateSupportSocket({ guestId: activeGuestId });

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

    socketRef.current.emit('customer:send-message', {
      chatId: activeId,
      messageText: input || '📎 Attachment',
    });

    setInput('');

    if (pendingFile) {
      setPendingFile(null);
      setTimeout(() => {
        socketRef.current.emit('customer:join-chat', {
          chatId: activeId,
        });
      }, 300);
    }
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

  return (
    <div className={`${styles.bubbleRow} ${mine ? styles.mine : styles.theirs}`}>
      <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
        {msg.message_text && <div className={styles.text}>{msg.message_text}</div>}

        {msg.attachments?.length > 0 && (
          <div className={styles.attachments}>
            {msg.attachments.map(a => (
              <a
                key={a.attachment_id}
                href={getAttachmentDownloadUrl(a.attachment_id)}
                target="_blank"
                rel="noreferrer"
                className={styles.attachmentLink}
              >
                📄 {a.file_name}
              </a>
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