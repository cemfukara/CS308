// src/pages/SM/SMInvoices.jsx

import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";
import styles from "./SMInvoices.module.css";

export default function SMInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const printRef = useRef();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);

      const res = await api.get("/orders");
      const list = res?.orders ?? [];

      const mapped = list.map((o) => ({
        order_id: o.order_id,
        customer: o.customer_email || "—",
        email: o.customer_email || "—",
        address: o.shipping_address || "—",
        date: o.created_at ? new Date(o.created_at) : null,
        status: o.status,
        total: o.total_price,
      }));

      setInvoices(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  // ------------ SEARCH + DATE FILTER ------------
  function applyFilters() {
    let data = [...invoices];

    const q = searchQuery.toLowerCase().trim();

    if (q !== "") {
      data = data.filter((inv) =>
        String(inv.order_id).includes(q) ||
        inv.customer.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter((inv) => inv.date >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      data = data.filter((inv) => inv.date <= to);
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
      setError("Failed to load invoice details.");
    } finally {
      setLoadingInvoice(false);
    }
  }

  function closeInvoice() {
    setSelectedInvoice(null);
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB");
  }

  // ------------ SAVE PDF (placeholder only) ------------
  const savePDF = () => {
    alert("PDF export coming soon!");
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Invoices</h1>

      {/* SEARCH / DATE FILTER BAR */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by ID, customer, or status"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className={styles.dateGroup}>
          <label>From:</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

          <label>To:</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {loading && <p>Loading invoices…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total (TL)</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.order_id}>
                <td>{inv.order_id}</td>
                <td>{inv.customer}</td>
                <td>{formatDate(inv.date)}</td>

                <td>
                  <span className={`${styles.status} ${styles[inv.status] || ""}`}>
                    {inv.status}
                  </span>
                </td>

                <td>{Number(inv.total).toFixed(2)}</td>

                <td>
                  <button className={styles.viewBtn} onClick={() => openInvoice(inv)}>
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
            <h2>Invoice #{selectedInvoice.order_id}</h2>

            <p><strong>Customer:</strong> {selectedInvoice.customer}</p>
            <p><strong>Email:</strong> {selectedInvoice.email}</p>
            <p><strong>Address:</strong> {selectedInvoice.address}</p>
            <p><strong>Date:</strong> {formatDate(selectedInvoice.date)}</p>

            <h3>Items</h3>

            {loadingInvoice && <p>Loading items…</p>}

            <ul>
              {(selectedInvoice.items || []).map((item, idx) => (
                <li key={idx}>
                  {item.product_name} — {item.quantity} ×{" "}
                  {Number(item.price_at_purchase).toFixed(2)}
                </li>
              ))}
            </ul>

            <p><strong>Total:</strong> {Number(selectedInvoice.total).toFixed(2)} TL</p>

            <div className={styles.modalActions}>
              <button className={styles.closeBtn} onClick={closeInvoice}>Close</button>
              <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
              <button className={styles.pdfBtn} onClick={savePDF}>Save PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
