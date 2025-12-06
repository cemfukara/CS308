// src/pages/Admin/PMDeliveries.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatPrice } from '@/utils/formatPrice.js';
import Dropdown from '@/components/Dropdown';
import styles from '../Admin.module.css';

export default function PMDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders');
      setDeliveries(res.orders ?? []);
    } catch (err) {
      console.error('Failed to load deliveries', err);
      setError('Failed to load deliveries. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(orderId) {
    setSelectedDeliveries(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }

  async function updateStatus(orderId, newStatus) {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { status: newStatus });

      setDeliveries(prev =>
        prev.map(order => (order.order_id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selectedDeliveries.length === 0) return;
    for (const id of selectedDeliveries) {
      // eslint-disable-next-line no-await-in-loop
      await updateStatus(id, bulkStatus);
    }
    setSelectedDeliveries([]);
    setBulkStatus('');
  }

  async function openInvoice(order) {
    try {
      setLoadingInvoice(true);
      setError('');
      const res = await api.get(`/orders/${order.order_id}`);
      setSelectedOrder({
        ...res.order,
        items: res.items ?? [],
      });
    } catch (err) {
      console.error('Failed to load invoice', err);
      setError('Failed to load invoice. Please try again.');
    } finally {
      setLoadingInvoice(false);
    }
  }

  function closeInvoice() {
    setSelectedOrder(null);
  }

  function filteredDeliveries() {
    let list = deliveries;

    if (hideCompleted) {
      list = list.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    }

    if (showOnlyCompleted) {
      list = list.filter(o => o.status === 'delivered' || o.status === 'cancelled');
    }

    return list;
  }

  function statusClass(status) {
    switch (status) {
      case 'delivered':
        return `${styles.statusBadge} ${styles.status_delivered}`;
      case 'in-transit':
        return `${styles.statusBadge} ${styles.status_inTransit}`;
      case 'cancelled':
        return `${styles.statusBadge} ${styles.status_cancelled}`;
      default:
        return `${styles.statusBadge} ${styles.status_processing}`;
    }
  }

  const visibleDeliveries = filteredDeliveries();
  const hasData = visibleDeliveries.length > 0;

  return (
    <div className={styles.wrapper}>
      {/* breadcrumbs same vibe as AdminProducts */}
      <nav className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Delivery Management</span>
      </nav>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Delivery Management</h1>
        {loading && <span className={styles.loadingPill}>Loading deliveries…</span>}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* controls row uses same layout as products controlsRow */}
      <div className={styles.controlsRow}>
        <div className={styles.leftGroup}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className={styles.sortLabel}>Bulk Status</span>

            <Dropdown
              value={bulkStatus}
              onChange={v => setBulkStatus(v)}
              options={[
                { label: 'Select status', value: '' },
                { label: 'Processing', value: 'processing' },
                { label: 'In-Transit', value: 'in-transit' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
            />
          </div>

          <button
            type="button"
            className={styles.searchButton}
            style={{ marginTop: 'auto' }}
            onClick={applyBulkStatus}
            disabled={!bulkStatus || selectedDeliveries.length === 0}
          >
            Apply to Selected
          </button>
        </div>

        <div className={styles.rightControls}>
          <button
            type="button"
            className={styles.hideButton}
            onClick={() => {
              setHideCompleted(prev => !prev);
              setShowOnlyCompleted(false);
            }}
          >
            {hideCompleted ? 'Show All' : 'Hide Completed'}
          </button>

          <button
            type="button"
            className={styles.hideButton}
            onClick={() => {
              setShowOnlyCompleted(prev => !prev);
              setHideCompleted(false);
            }}
          >
            {showOnlyCompleted ? 'Show All' : 'Show Completed'}
          </button>
        </div>
      </div>

      {/* table styled like AdminProducts */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}></th>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Items</th>
              <th className={styles.th}>Address</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {!hasData && !loading && (
              <tr className={styles.tr}>
                <td className={styles.td} colSpan={10}>
                  <div className={styles.emptyState}>No deliveries found.</div>
                </td>
              </tr>
            )}

            {visibleDeliveries.map(order => (
              <tr key={order.order_id} className={styles.tr}>
                <td className={styles.td}>
                  <input
                    type="checkbox"
                    checked={selectedDeliveries.includes(order.order_id)}
                    onChange={() => toggleSelect(order.order_id)}
                  />
                </td>
                <td className={styles.td}>{order.order_id}</td>
                <td className={styles.td}>{order.customer_email || '—'}</td>
                <td className={styles.td}>{order.item_count}</td>
                <td className={styles.td}>{order.shipping_address}</td>
                <td className={styles.td}>
                  {formatPrice(order.total_price, order.currency || 'TL')}
                </td>
                <td className={styles.td}>
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('en-GB') : '—'}
                </td>
                <td className={styles.td}>
                  <span className={statusClass(order.status)}>{order.status}</span>
                </td>
                <td className={styles.td}>
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => openInvoice(order)}
                    >
                      View Invoice
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      disabled={updatingId === order.order_id}
                      onClick={() =>
                        updateStatus(
                          order.order_id,
                          order.status === 'processing'
                            ? 'in-transit'
                            : order.status === 'in-transit'
                              ? 'delivered'
                              : 'delivered'
                        )
                      }
                    >
                      {order.status === 'processing'
                        ? 'Mark In-Transit'
                        : order.status === 'in-transit'
                          ? 'Mark Delivered'
                          : 'Delivered'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* invoice modal reusing theme modal styles */}
      {selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              Invoice #{selectedOrder.order_id}
              {loadingInvoice && (
                <span className={styles.loadingPill} style={{ marginLeft: 8 }}>
                  Loading…
                </span>
              )}
            </h2>

            <p className={styles.modalText}>
              <strong>Customer:</strong> {selectedOrder.customer_email}
            </p>
            <p className={styles.modalText}>
              <strong>Address:</strong> {selectedOrder.shipping_address}
            </p>

            <h3 className={styles.modalTitle}>Items</h3>
            <ul className={styles.modalList}>
              {selectedOrder.items.map((item, idx) => (
                <li key={idx} className={styles.modalText}>
                  {item.product_name} — {item.quantity} ×{' '}
                  {formatPrice(item.price_at_purchase, selectedOrder.currency || 'TL')}
                </li>
              ))}
            </ul>

            <p className={styles.modalText}>
              <strong>Total:</strong>{' '}
              {formatPrice(selectedOrder.total_price, selectedOrder.currency || 'TL')}
            </p>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={closeInvoice}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
