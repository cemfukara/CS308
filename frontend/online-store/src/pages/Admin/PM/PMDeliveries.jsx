import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, api } from '../../../lib/api';
import styles from '../Admin.module.css';
import { formatPrice } from '@/utils/formatPrice';

// Includes "refunded"
const STATUS_OPTIONS = ['processing', 'in-transit', 'delivered', 'refunded'];
const STATUS_FLOW = ['processing', 'in-transit', 'delivered', 'refunded'];
const TERMINAL_STATUSES = new Set(['cancelled', 'refunded']);
const completedStatuses = new Set(['delivered', 'cancelled', 'refunded']);

const PMDeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // all | hide | only
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  // ----------------------
  // Helpers
  // ----------------------
  const formatStatus = status => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'in-transit') return 'In transit';
    if (s === 'refunded') return 'Refunded';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const NEXT_STATUS_MAP = {
    processing: 'in-transit',
    'in-transit': 'delivered',
    delivered: 'refunded'
  };

  const getStatusClassName = status => {
    const s = (status || '').toLowerCase();
    if (s === 'processing') return `${styles.statusBadge} ${styles.status_processing}`;
    if (s === 'in-transit') return `${styles.statusBadge} ${styles.status_inTransit}`;
    if (s === 'delivered') return `${styles.statusBadge} ${styles.status_delivered}`;
    if (s === 'cancelled' || s === 'refunded')
      return `${styles.statusBadge} ${styles.status_cancelled}`;
    return styles.statusBadge;
  };

  // ----------------------
  // Fetch deliveries using api.js
  // ----------------------
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const data = await api.get('/deliveries');

      setDeliveries(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error('❌ Failed to fetch deliveries:', err);
      setErrorMsg('Failed to load deliveries from server.');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // ----------------------
  // Selection
  // ----------------------
  const toggleSelect = orderId => {
    const copy = new Set(selected);
    if (copy.has(orderId)) copy.delete(orderId);
    else copy.add(orderId);
    setSelected(copy);
  };
  const isValidTransition = (current, target) => {
    // allow keeping the same status (no-op)
    if (current === target) return true;
  
    // refunded is terminal (cannot move to anything else)
    if (current === 'refunded') return false;
  
    // special allowed case
    if (current === 'delivered' && target === 'refunded') return true;
  
    const currentIndex = STATUS_FLOW.indexOf(current);
    const targetIndex = STATUS_FLOW.indexOf(target);
  
    if (currentIndex === -1 || targetIndex === -1) return false;
  
    // normal forward-only, one-step rule
    return targetIndex === currentIndex + 1;
  };

  // ----------------------
  // Apply Status (uses api.patch)
  // ----------------------
  const applyStatus = async () => {
    if (!bulkStatus || selected.size === 0) return;
  
    try {
      setErrorMsg('');
  
      const invalidOrders = [];
  
      for (const id of selected) {
        const order = deliveries.find(o => o.order_id === id);
        if (!order) continue;
  
        // block only terminal states
        if (TERMINAL_STATUSES.has(order.status)) {
          invalidOrders.push(id);
          continue;
        }
  
        // enforce strict flow (incl delivered → refunded)
        if (!isValidTransition(order.status, bulkStatus)) {
          invalidOrders.push(id);
        }
      }
  
      if (invalidOrders.length > 0) {
        setErrorMsg(
          `Invalid status transition for order(s): ${invalidOrders.join(
            ', '
          )}. Status flow must be: processing → in-transit → delivered → refunded.`
        );
        return;
      }
  
      for (const id of selected) {
        await api.patch(`/deliveries/${id}/status`, { status: bulkStatus });
      }
  
      await fetchDeliveries();
      setSelected(new Set());
      setBulkStatus('');
    } catch (err) {
      console.error('Update error:', err);
      setErrorMsg(
        err?.response?.data?.message || 'Failed to update one or more deliveries.'
      );
    }
  };

  const advanceStatus = async order => {
    const current = order.status;
    const nextStatus = NEXT_STATUS_MAP[current];
  
    if (!nextStatus) return;
  
    try {
      setErrorMsg('');
      await api.patch(`/deliveries/${order.order_id}/status`, {
        status: nextStatus
      });
      await fetchDeliveries();
    } catch (err) {
      console.error('Failed to advance status:', err);
      setErrorMsg('Failed to update delivery status.');
    }
  };

  // ----------------------
  // Search + Filter
  // ----------------------
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredDeliveries = deliveries.filter(d => {
    const statusNorm = (d.status || '').toLowerCase();

    // Completed filter
    if (filterMode === 'hide' && completedStatuses.has(statusNorm)) return false;
    if (filterMode === 'only' && !completedStatuses.has(statusNorm)) return false;

    // Search filter
    if (!normalizedSearch) return true;

    // Search only by:
    //   - Delivery ID
    //   - Email
    //   - Status
    const haystack = [d.order_id, d.customer_email, statusNorm].join(' ').toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  // ----------------------
// Invoice
// ----------------------
const openInvoice = order => {
  setInvoiceError('');
  setInvoiceOrder(order);
  setInvoiceItems(Array.isArray(order.products) ? order.products : []);
};

  const closeInvoice = () => {
    setInvoiceOrder(null);
    setInvoiceItems([]);
    setInvoiceError('');
  };

  const handlePrintInvoice = () => window.print();

  // ----------------------
  // Render
  // ----------------------
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

      {/* Title */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Delivery Management</h1>
        {loading && <span className={styles.loadingPill}>Loading…</span>}
      </div>

      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      {/* Search + Filter */}
      <div className={styles.controlsRow}>
        <input
          type="text"
          placeholder="Search by ID, email, status..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className={styles.rightControls}>
          <button className={styles.hideButton} onClick={() => setFilterMode('hide')}>
            Hide Completed
          </button>
          <button className={styles.hideButton} onClick={() => setFilterMode('only')}>
            Show Completed
          </button>
          <button className={styles.hideButton} onClick={() => setFilterMode('all')}>
            Reset
          </button>
        </div>
      </div>

      {/* Bulk Update */}
      <div className={styles.pmBulkSection}>
        <div>
          <div className={styles.sortLabel}>Bulk Update Status</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className={styles.bulkSelect}
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
            >
              <option value="">Select…</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {formatStatus(s)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.searchButton}
              onClick={applyStatus}
              disabled={!bulkStatus || selected.size === 0}
            >
              Apply
            </button>
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span className={styles.pageInfo}>
            {filteredDeliveries.length} deliveries • {selected.size} selected
          </span>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>Select</th>
              <th className={styles.th}>Delivery ID</th>
              <th className={styles.th}>Customer ID</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Address</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Created</th>
              <th className={styles.th}>Invoice</th>
              <th className={styles.th}>Mark Status</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
  {filteredDeliveries.map(d => {
    const isSelected = selected.has(d.order_id);

    return (
      <tr
        key={d.order_id}
        className={isSelected ? `${styles.tr} ${styles['pm-selected-row']}` : styles.tr}
      >
        <td className={styles.td}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(d.order_id)}
          />
        </td>

        <td className={styles.td}>{d.order_id}</td>
        <td className={styles.td}>{d.user_id}</td>
        <td className={styles.td}>{d.customer_email}</td>

        <td className={styles.td}>
          {d.total_price != null ? formatPrice(Number(d.total_price)) : 'N/A'}
        </td>

        <td className={styles.td}>{d.shipping_address || 'N/A'}</td>

        <td className={styles.td}>
          <span className={getStatusClassName(d.status)}>
            {formatStatus(d.status)}
          </span>
        </td>

        <td className={styles.td}>
          {d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A'}
        </td>

        <td className={styles.td}>
          <button
            type="button"
            className={styles.pmViewBtn}
            onClick={() => openInvoice(d)}
          >
            View
          </button>
        </td>

        {/* 👇 MARK STATUS COLUMN */}
        <td className={styles.td}>
          {NEXT_STATUS_MAP[d.status] ? (
            <button
              type="button"
              className={styles.pmViewBtn}
              onClick={() => advanceStatus(d)}
            >
              Mark as {formatStatus(NEXT_STATUS_MAP[d.status])}
            </button>
          ) : (
            <span className={styles.muted}>—</span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
        </table>

        {filteredDeliveries.length === 0 && !loading && (
          <div className={styles.emptyState}>No deliveries to show.</div>
        )}
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className={styles.modalOverlay} onClick={closeInvoice}>
          <div
            className={`${styles.modal} ${styles.pmInvoiceModal} ${styles.printArea}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.invoiceHeader}>
              <div>
                <h2 className={styles.invoiceTitle}>Order Invoice #{invoiceOrder.order_id}</h2>
                <p className={styles.invoiceId}>Order ID: {invoiceOrder.order_id}</p>
              </div>

              <div className={styles.invoiceBrand}>
                <div className={styles.invoiceBrandName}>TechZone</div>
                <div className={styles.invoiceBrandSub}>Admin Panel</div>
              </div>
            </div>

            {/* Meta */}
            <div className={styles.invoiceMetaRow}>
              <div className={styles.invoiceMetaBlock}>
                <div className={styles.invoiceMetaTitle}>Billed To</div>
                <div className={styles.invoiceMetaLine}>
                  <span className={styles.invoiceMetaLabel}>Customer ID: </span>
                  <span className={styles.invoiceMetaValue}>{invoiceOrder.user_id}</span>
                </div>
                <div className={styles.invoiceMetaLine}>
                  <span className={styles.invoiceMetaLabel}>Email: </span>
                  <span className={styles.invoiceMetaValue}>{invoiceOrder.customer_email}</span>
                </div>
                <div className={styles.invoiceMetaLine}>
                  <span className={styles.invoiceMetaLabel}>Address: </span>
                  <span className={styles.invoiceMetaValue}>
                    {invoiceOrder.shipping_address || 'N/A'}
                  </span>
                </div>
              </div>

              <div className={`${styles.invoiceMetaBlock} ${styles.invoiceMetaBlockRight}`}>
                <div className={styles.invoiceMetaTitle}>Order Details</div>
                <div className={styles.invoiceMetaLine}>
                  <span className={styles.invoiceMetaLabel}>Date: </span>
                  <span className={styles.invoiceMetaValue}>
                    {invoiceOrder.created_at
                      ? new Date(invoiceOrder.created_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>

                <div className={styles.invoiceMetaLine}>
                  <span className={styles.invoiceMetaLabel}>Status: </span>
                  <span className={styles.invoiceStatusPill}>
                    {formatStatus(invoiceOrder.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className={styles.invoiceItemsTitle}>Order Items</div>

              <table className={styles.invoiceItemsTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceLoading && (
                    <tr>
                      <td colSpan={2} className={styles.invoiceEmptyRow}>
                        Loading invoice items…
                      </td>
                    </tr>
                  )}

                  {!invoiceLoading &&
                    invoiceItems.length > 0 &&
                    invoiceItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}

                  {!invoiceLoading && invoiceItems.length === 0 && (
                    <tr>
                      <td colSpan={2} className={styles.invoiceEmptyRow}>
                        No item details available for this order.
                      </td>
                    </tr>
                  )}

                  {invoiceError && <div className={styles.errorBanner}>{invoiceError}</div>}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className={styles.invoiceTotalsRow}>
              <div className={styles.invoiceTotalsSpacer} />
              <div className={styles.invoiceTotalsBox}>
                <div className={styles.invoiceTotalsLine}>
                  <span>Subtotal</span>
                  <span>
                    {invoiceOrder.total_price != null
                      ? `${formatPrice(Number(invoiceOrder.total_price))}`
                      : 'N/A'}
                  </span>
                </div>

                <div className={styles.invoiceTotalsLine}>
                  <span>Shipping</span>
                  <span>{formatPrice(0)}</span>
                </div>

                <div className={styles.invoiceTotalsLineStrong}>
                  <span>Total</span>
                  <span>
                    {invoiceOrder.total_price != null
                      ? `${formatPrice(Number(invoiceOrder.total_price))}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className={styles.modalActions}>
              <button className={`${styles.pmModalButton} ${styles.close}`} onClick={closeInvoice}>
                Close
              </button>

              <button
                className={`${styles.pmModalButton} ${styles.print}`}
                onClick={handlePrintInvoice}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMDeliveriesPage;

