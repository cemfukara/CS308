import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

import { getWaitingQueue } from '@/lib/supportChatApi';
import { connectSupportSocket, authenticateSupportSocket } from '@/socket/supportSocket';

import styles from '@/pages/Admin/Admin.module.css';

export default function SupportQueuePage() {
  const navigate = useNavigate();

  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chats, setChats] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const socketReady = useMemo(() => !!user && user.role === 'support agent', [user]);

  // 1) Load initial queue (REST)
  useEffect(() => {
    let mounted = true;

    async function loadQueue() {
      try {
        setLoading(true);
        setError('');
        const data = await getWaitingQueue(); // { chats: [...] }
        if (!mounted) return;
        setChats(data?.chats || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load waiting queue');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadQueue();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // 2) Hook socket queue updates (real-time)
  useEffect(() => {
    if (!socketReady) return;

    const s = connectSupportSocket();
    let cleanup = () => {};

    (async () => {
      try {
        await authenticateSupportSocket({ token });

        s.emit('agent:join-queue');

        const onQueueChats = payload => {
          setChats(payload?.chats || []);
        };

        const onQueueUpdate = () => {
          setRefreshKey(k => k + 1);
        };

        const onError = e => {
          setError(e?.message || 'Socket error');
        };

        s.on('queue:chats', onQueueChats);
        s.on('queue:update', onQueueUpdate);
        s.on('error', onError);

        cleanup = () => {
          s.off('queue:chats', onQueueChats);
          s.off('queue:update', onQueueUpdate);
          s.off('error', onError);
        };
      } catch (e) {
        setError(e?.message || 'Socket authentication failed');
      }
    })();

    return () => cleanup();
  }, [socketReady, token]);

  // 3) Claim chat (socket-first)
  // 3) Claim chat (socket-first)
  async function claim(chatId) {
    setError('');
    const s = connectSupportSocket();
  
    try {
      // 🔑 AUTHENTICATE FIRST (THIS IS CRITICAL)
      await authenticateSupportSocket({ token });
  
      s.once('chat:claimed', payload => {
        const claimedChatId = payload?.chat?.chat_id || chatId;
        navigate(`/admin/support/chat/${claimedChatId}`);
      });
  
      s.once('error', e => {
        setError(e?.message || 'Failed to claim chat');
      });
  
      s.emit('agent:claim-chat', { chatId });
    } catch (e) {
      setError(e?.message || 'Socket authentication failed');
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <h2 className={styles.title} style={{ marginBottom: 0 }}>
          Support Queue
        </h2>

        <div className={styles.titleActions}>
          <button className={styles.searchButton} onClick={() => setRefreshKey(k => k + 1)}>
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.pageInfo} style={{ marginBottom: 10 }}>
        Waiting chats: <b>{chats.length}</b>
        {loading ? (
          <span className={styles.loadingPill} style={{ marginLeft: 10 }}>
            Loading
          </span>
        ) : null}
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {!loading && chats.length === 0 ? (
        <div className={styles.emptyState}>No waiting chats right now.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Chat</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Messages</th>
                <th className={styles.th}>Created</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody className={styles.tbody}>
              {chats.map(c => (
                <tr key={c.chat_id} className={styles.tr}>
                  <td className={styles.td}>
                    <b>#{c.chat_id}</b>{' '}
                    <span className={styles.categoryBadge} title="Status">
                      {c.status || 'waiting'}
                    </span>
                  </td>

                  <td className={styles.td}>
                    {c.customer_email
                      ? c.customer_email
                      : c.user_id
                        ? `user_id=${c.user_id}`
                        : 'Guest'}
                  </td>

                  <td className={styles.td}>{c.message_count ?? 0}</td>

                  <td className={styles.td}>
                    {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                  </td>

                  <td className={styles.td}>
                    <div className={styles.actionButtons}>
                      <button className={styles.editBtn} onClick={() => claim(c.chat_id)}>
                        Claim
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? (
                <tr className={styles.tr}>
                  <td className={styles.td} colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
