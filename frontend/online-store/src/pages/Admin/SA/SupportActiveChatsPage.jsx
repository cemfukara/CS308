import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

import { getAgentActiveChats } from '@/lib/supportChatApi';
import { connectSupportSocket, authenticateSupportSocket } from '@/socket/supportSocket';

import styles from '@/pages/Admin/Admin.module.css';

export default function SupportActiveChatsPage() {
  const navigate = useNavigate();

  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);

  const isSupportAgent = useMemo(() => !!user && user.role === 'support agent', [user]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chats, setChats] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 1) Load active chats (REST)
  useEffect(() => {
    let mounted = true;

    async function loadActive() {
      try {
        setLoading(true);
        setError('');
        const data = await getAgentActiveChats(); // { chats: [...] }
        if (!mounted) return;
        setChats(data?.chats || []);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load active chats');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadActive();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // 2) Refresh on queue updates (optional)
  useEffect(() => {
    if (!isSupportAgent) return;

    const s = connectSupportSocket();
    let cleanup = () => {};

    (async () => {
      try {
        await authenticateSupportSocket({ token });

        s.emit('agent:join-queue');

        const onQueueUpdate = () => setRefreshKey(k => k + 1);
        const onError = e => setError(e?.message || 'Socket error');

        s.on('queue:update', onQueueUpdate);
        s.on('error', onError);

        cleanup = () => {
          s.off('queue:update', onQueueUpdate);
          s.off('error', onError);
        };
      } catch (e) {
        setError(e?.message || 'Socket authentication failed');
      }
    })();

    return () => cleanup();
  }, [isSupportAgent, token]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleRow}>
        <h2 className={styles.title} style={{ marginBottom: 0 }}>
          Active Chats
        </h2>

        <div className={styles.titleActions}>
          <button className={styles.searchButton} onClick={() => setRefreshKey(k => k + 1)}>
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {!loading && chats.length === 0 ? (
        <div className={styles.emptyState}>No active chats yet. Go to the queue to claim one.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Chat</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Created</th>
                <th className={styles.th}>Claimed</th>
                <th className={styles.th}>Unread</th>
                <th className={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody className={styles.tbody}>
              {chats.map(c => (
                <tr
                  key={c.chat_id}
                  className={styles.tr}
                  title="Open chat"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/support/chat/${c.chat_id}`)}
                >
                  <td className={styles.td}>
                    <b>#{c.chat_id}</b>{' '}
                    <span className={styles.categoryBadge}>{c.status || 'active'}</span>
                  </td>

                  <td className={styles.td}>
                    {c.customer_email
                      ? c.customer_email
                      : c.user_id
                        ? `user_id=${c.user_id}`
                        : 'Guest'}
                  </td>

                  <td className={styles.td}>
                    {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                  </td>

                  <td className={styles.td}>
                    {c.claimed_at ? new Date(c.claimed_at).toLocaleString() : '-'}
                  </td>

                  <td className={styles.td}>
                    <span className={styles.categoryBadge}>{c.unread_count ?? 0}</span>
                  </td>

                  <td className={styles.td} onClick={e => e.stopPropagation()}>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editBtn}
                        onClick={() => navigate(`/admin/support/chat/${c.chat_id}`)}
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading ? (
                <tr className={styles.tr}>
                  <td className={styles.td} colSpan={6}>
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
