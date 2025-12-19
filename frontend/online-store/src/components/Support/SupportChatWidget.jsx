import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './SupportChatWidget.module.css';

import {
  initiateChat,
  uploadChatAttachment,
  getAttachmentDownloadUrl,
} from '../../api/supportChatApi';

import { connectSupportSocket, authenticateSupportSocket } from '../../socket/supportSocket';

export default function SupportChatWidget({ isLoggedIn = false, token = null }) {
  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 || !!pendingFile, [input, pendingFile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openChat() {
    setOpen(true);

    if (!chatId) {
      const data = await initiateChat();
      setChatId(data.chat_id);
      setGuestId(data.guest_identifier || null);
    }

    if (!socketRef.current) {
      socketRef.current = connectSupportSocket();
      await authenticateSupportSocket({
        token: isLoggedIn ? token : null,
        guestId: !isLoggedIn ? guestId : null,
      });

      socketRef.current.emit('customer:join-chat', {
        chatId: chatId || undefined,
      });

      socketRef.current.on('chat:joined', p => setMessages(p.messages || []));
      socketRef.current.on('message:new', m => setMessages(prev => [...prev, m]));
      socketRef.current.on('error', e => {
        setError(e.message || 'Socket error');
        setStatus('error');
      });
    }
  }

  async function sendMessage() {
    if (!canSend || !socketRef.current) return;

    socketRef.current.emit('customer:send-message', {
      chatId,
      messageText: input || '📎 Attachment',
    });

    setInput('');

    if (pendingFile) {
      const file = pendingFile;
      setPendingFile(null);

      setTimeout(async () => {
        const last = [...messages].reverse().find(m => m.sender_type === 'customer');
        if (last?.message_id) {
          await uploadChatAttachment(chatId, last.message_id, file);
          socketRef.current.emit('customer:join-chat', { chatId });
        }
      }, 300);
    }
  }

  return (
    <>
      <button className={styles.fab} onClick={open ? () => setOpen(false) : openChat}>
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
              <button className={styles.headerBtn} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.messages}>
              {messages.map(m => (
                <MessageBubble key={m.message_id} msg={m} />
              ))}
              <div ref={bottomRef} />
            </div>

            <div className={styles.composer}>
              <label className={styles.attachBtn}>
                📎
                <input type="file" hidden onChange={e => setPendingFile(e.target.files[0])} />
              </label>

              <input
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message…"
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />

              <button className={styles.sendBtn} disabled={!canSend} onClick={sendMessage}>
                Send
              </button>
            </div>

            {pendingFile && (
              <div className={styles.fileChip}>
                Attached: {pendingFile.name}
                <button className={styles.fileChipRemove} onClick={() => setPendingFile(null)}>
                  remove
                </button>
              </div>
            )}

            <div className={styles.footerHint}>Images, PDFs, and videos are supported</div>
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

        <div className={styles.meta}>{new Date(msg.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
}
