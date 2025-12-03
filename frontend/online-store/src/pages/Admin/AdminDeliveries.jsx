// src/pages/Admin/AdminDeliveries.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import styles from './AdminDeliveries.module.css';
import Dropdown from '../../components/Dropdown'; // :contentReference[oaicite:0]{index=0}

const STATUS_FLOW = {
  processing: 'in-transit',
  'in-transit': 'delivered',
  delivered: null,
  cancelled: null,
};

const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Date – Newest first' },
  { value: 'created_asc', label: 'Date – Oldest first' },
  { value: 'status_asc', label: 'Status – A to Z' },
  { value: 'status_desc', label: 'Status – Z to A' },
  { value: 'id_asc', label: 'Order ID – Low to High' },
  { value: 'id_desc', label: 'Order ID – High to Low' },
];

function AdminDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortKey, setSortKey] = useState('created_desc');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders'); // { success, orders }
      const list = res?.orders ?? res;
      setDeliveries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load deliveries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const nextStatus = current => STATUS_FLOW[current] || null;

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!newStatus) return;

    try {
      setUpdatingId(orderId);
      setError('');
      await api.put(`/orders/${orderId}/status`, { status: newStatus });

      setDeliveries(prev =>
        prev.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ---- Filtering ----
  const filteredDeliveries = deliveries.filter(order => {
    if (!hideCompleted) return true;
    return order.status !== 'delivered' && order.status !== 'cancelled';
  });

  // ---- Sorting ----
  const sortedDeliveries = [...filteredDeliveries].sort((a, b) => {
    switch (sortKey) {
      case 'created_desc': {
        const da = a.created_at ? new Date(a.created_at) : 0;
        const db = b.created_at ? new Date(b.created_at) : 0;
        return db - da;
      }
      case 'created_asc': {
        const da = a.created_at ? new Date(a.created_at) : 0;
        const db = b.created_at ? new Date(b.created_at) : 0;
        return da - db;
      }
      case 'status_asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status_desc':
        return (b.status || '').localeCompare(a.status || '');
      case 'id_asc':
        return Number(a.order_id) - Number(b.order_id);
      case 'id_desc':
        return Number(b.order_id) - Number(a.order_id);
      default:
        return 0;
    }
  });

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Deliveries</span>
      </div>

      {/* Title + controls on same row */}
      <div className={styles.topRow}>
        <div className={styles.leftGroup}>
          <h1 className={styles.title}>Delivery Management</h1>
          {loading && <span className={styles.loadingPill}>Loading…</span>}
        </div>

        <div className={styles.rightControls}>
          <button
            type="button"
            className={styles.hideButton}
            onClick={() => setHideCompleted(prev => !prev)}
          >
            {hideCompleted ? 'Show Completed' : 'Hide Completed'}
          </button>

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>SORT</span>
            {/* pass empty label so Dropdown doesn't render its own title */}
            <Dropdown label="" value={sortKey} onChange={setSortKey} options={SORT_OPTIONS} />
          </div>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Items</th>
              <th className={styles.th}>Address</th>
              <th className={styles.th}>Total (TL)</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Next Action</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {!loading && sortedDeliveries.length === 0 && (
              <tr className={styles.tr}>
                <td colSpan={8} className={styles.td}>
                  <div className={styles.emptyState}>No deliveries found.</div>
                </td>
              </tr>
            )}

            {sortedDeliveries.map(order => {
              const nxt = nextStatus(order.status);

              return (
                <tr key={order.order_id} className={styles.tr}>
                  <td className={styles.td}>{order.order_id}</td>
                  <td className={styles.td}>{order.customer_email || '—'}</td>
                  <td className={styles.td}>{order.item_count ?? 0}</td>
                  <td className={styles.td}>{order.shipping_address || '—'}</td>

                  <td className={styles.td}>
                    {order.total_price != null ? Number(order.total_price).toFixed(2) : '—'}
                  </td>

                  <td className={styles.td}>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  <td className={styles.td}>
                    <span
                      className={`${styles.statusBadge} ${styles[`status_${order.status}`] || ''}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className={styles.td}>
                    {nxt ? (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        disabled={updatingId === order.order_id}
                        onClick={() => handleUpdateStatus(order.order_id, nxt)}
                      >
                        Mark as {nxt}
                      </button>
                    ) : (
                      <span className={styles.completedLabel}>Completed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDeliveries;
