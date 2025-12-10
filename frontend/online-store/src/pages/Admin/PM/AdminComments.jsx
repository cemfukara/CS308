// src/pages/PM/PMComments.jsx
import { useEffect, useMemo, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { fetchPendingComments, approveComment, rejectComment } from '@/lib/reviewApi';
import styles from '../Admin.module.css'; // ⬅️ adjust path if needed
import { Link } from 'react-router-dom';

const PMComments = () => {
  const user = useAuthStore(state => state.user);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // future-proof
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 🔐 guard – only PM + dev
  if (!user || (user.role !== 'product manager' && user.role !== 'dev')) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Comment Moderation</h2>
        </div>
        <p>You must be a Product Manager or Dev to view this page.</p>
      </div>
    );
  }

  // 📥 load pending comments on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const rows = await fetchPendingComments();
        setComments(rows || []);
      } catch (err) {
        console.error('Failed to load pending comments:', err);
        setError(err.message || 'Failed to load pending comments');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // 🔍 search + (future) status filter
  const filtered = useMemo(() => {
    let result = comments;

    if (statusFilter !== 'all') {
      result = result.filter(c => (c.status || 'pending') === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        c =>
          (c.product_name && c.product_name.toLowerCase().includes(q)) ||
          (c.comment_text && c.comment_text.toLowerCase().includes(q)) ||
          (c.user_email && c.user_email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [comments, search, statusFilter]);

  // simple client-side pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleApprove = async reviewId => {
    try {
      setActionLoadingId(reviewId);
      await approveComment(reviewId);
      setComments(prev => prev.filter(c => c.review_id !== reviewId));
    } catch (err) {
      console.error('Failed to approve comment:', err);
      alert(err.message || 'Failed to approve comment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async reviewId => {
    try {
      setActionLoadingId(reviewId);
      await rejectComment(reviewId);
      setComments(prev => prev.filter(c => c.review_id !== reviewId));
    } catch (err) {
      console.error('Failed to reject comment:', err);
      alert(err.message || 'Failed to reject comment');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <a href="/admin" className={styles.crumbLink}>
          Admin
        </a>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Comment Moderation</span>
      </div>

      {/* title row */}
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Pending Comments</h2>
        {loading && <span className={styles.loadingPill}>Loading…</span>}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* controls row: search + (future) status filter */}
      <div className={styles.controlsRow}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by product, comment, or user email…"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <div className={styles.rightControls}>
          <div className={styles.filterGroup}>
            <span className={styles.sortLabel}>Status</span>
            <select
              className={styles.bulkSelect}
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="pending">Pending only</option>
              <option value="all">All (future)</option>
            </select>
          </div>
        </div>
      </div>

      {/* table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Product</th>
              <th className={styles.th}>User</th>
              <th className={styles.th}>Rating</th>
              <th className={styles.th}>Comment</th>
              <th className={styles.th}>Created</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {paginated.length === 0 && !loading && (
              <tr className={styles.tr}>
                <td className={styles.td} colSpan={8}>
                  <div className={styles.emptyState}>No pending comments 🎉</div>
                </td>
              </tr>
            )}

            {paginated.map(row => (
              <tr key={row.review_id} className={styles.tr}>
                <td className={styles.td}>#{row.review_id}</td>
                <td className={styles.td}>
                  <Link to={`/products/${row.product_id}`} className={styles.tableLink}>
                    {row.product_name}
                  </Link>
                </td>

                <td className={styles.td}>
                  {row.user_email
                    ? `${row.user_email} (ID: ${row.user_id})`
                    : `User #${row.user_id}`}
                </td>
                <td className={styles.td}>{row.rating}/5</td>
                <td className={styles.td}>{row.comment_text || <em>No comment text</em>}</td>
                <td className={styles.td}>
                  {row.created_at && new Date(row.created_at).toLocaleString('tr-TR')}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${styles.status_processing}`}>
                    {row.status || 'pending'}
                  </span>
                </td>
                <td className={styles.td}>
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      disabled={actionLoadingId === row.review_id}
                      onClick={() => handleApprove(row.review_id)}
                    >
                      {actionLoadingId === row.review_id ? '...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      disabled={actionLoadingId === row.review_id}
                      onClick={() => handleReject(row.review_id)}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {filtered.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PMComments;
