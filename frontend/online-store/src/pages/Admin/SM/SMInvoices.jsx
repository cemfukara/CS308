// src/pages/SM/SMInvoices.jsx

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import styles from '../Admin.module.css';
import { formatPrice } from '@/utils/formatPrice';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SMInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const printRef = useRef();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);

      const res = await api.get('/orders');
      const list = res?.orders ?? [];

      const mapped = list.map(o => ({
        order_id: o.order_id,
        customer: o.customer_email || '—',
        email: o.customer_email || '—',
        address: o.shipping_address || '—',
        date: o.created_at ? new Date(o.created_at) : null,
        status: o.status,
        total: o.total_price,
      }));

      setInvoices(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }

  // ------------ SEARCH + DATE FILTER ------------
  function applyFilters() {
    let data = [...invoices];

    const q = searchQuery.toLowerCase().trim();

    if (q !== '') {
      data = data.filter(
        inv =>
          String(inv.order_id).includes(q) ||
          inv.customer.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0);
      data = data.filter(inv => inv.date >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(inv => inv.date <= to);
    }

    setFiltered(data);
  }

  useEffect(() => {
    applyFilters();
  }, [searchQuery, fromDate, toDate, invoices]);

  // ------------ INVOICE DETAILS ------------
  async function openInvoice(inv) {
    try {
      setLoadingInvoice(true);

      const res = await api.get(`/orders/${inv.order_id}`);

      setSelectedInvoice({
        ...inv,
        items: res.items ?? [],
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load invoice details.');
    } finally {
      setLoadingInvoice(false);
    }
  }

  function closeInvoice() {
    setSelectedInvoice(null);
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // ------------ SAVE PDF (placeholder only) ------------
  const savePDF = () => {
    alert('PDF export coming soon!');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Invoice Management</span>
      </div>
      <h1 className={styles.title}>Invoices</h1>

      {/* SEARCH / DATE FILTER BAR */}
      <div className={styles.controlsRow}>
        <input
          type="text"
          placeholder="Search by ID, customer, or status..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <div className={styles.filterGroup}>
          <label>From:</label>
          <DatePicker
            selected={fromDate}
            onChange={date => setFromDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className={styles.datePickerInput}
            wrapperClassName={styles.datePickerInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label>To:</label>
          <DatePicker
            selected={toDate}
            onChange={date => setToDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className={styles.datePickerInput}
            wrapperClassName={styles.datePickerInput}
          />
        </div>
      </div>

      {loading && <p>Loading invoices…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr className={styles.tr}>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody className={styles.tbody}>
            {filtered.map(inv => (
              <tr key={inv.order_id} className={styles.tr}>
                <td className={styles.td}>{inv.order_id}</td>
                <td className={styles.td}>{inv.customer}</td>
                <td className={styles.td}>{formatDate(inv.date)}</td>

                <td className={styles.td}>
                  <span className={`${styles.statusBadge} ${styles['status_' + inv.status]}`}>
                    {inv.status}
                  </span>
                </td>

                <td className={styles.td}>{formatPrice(inv.total, inv.currency)}</td>

                <td className={styles.td}>
                  <button className={styles.editBtn} onClick={() => openInvoice(inv)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} ref={printRef}>
            <h2 className={styles.modalTitle}>Invoice #{selectedInvoice.order_id}</h2>

            <p className={styles.modalText}>
              <strong>Customer:</strong> {selectedInvoice.customer}
            </p>
            <p className={styles.modalText}>
              <strong>Email:</strong> {selectedInvoice.email}
            </p>
            <p className={styles.modalText}>
              <strong>Address:</strong> {selectedInvoice.address}
            </p>
            <p className={styles.modalText}>
              <strong>Date:</strong> {formatDate(selectedInvoice.date)}
            </p>

            <h3 className={styles.modalSubtitle}>Items</h3>

            {loadingInvoice && <p>Loading items…</p>}

            <ul className={styles.itemList}>
              {(selectedInvoice.items || []).map((item, idx) => (
                <li key={idx} className={styles.item}>
                  {item.name} — {item.quantity} ×{' '}
                  {formatPrice(item.price_at_purchase, selectedInvoice.currency)}
                </li>
              ))}
            </ul>

            <p className={styles.modalText}>
              <strong>Total:</strong> {formatPrice(selectedInvoice.total, selectedInvoice.currency)}{' '}
              TL
            </p>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeInvoice}>
                Close
              </button>
              <button className={styles.editBtn} onClick={() => window.print()}>
                Print
              </button>
              <button className={styles.confirmDeleteBtn} onClick={savePDF}>
                Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
