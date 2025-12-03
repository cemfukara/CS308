import { useEffect, useState } from "react";
import styles from "./SMInvoices.module.css";

// TEMP: mock API until backend /api/admin/invoices is ready
async function mockGetInvoices() {
  return [
    {
      order_id: 101,
      customer: "John Doe",
      date: "2025-01-10",
      total: 1499.99,
      status: "Paid",
      email: "john@example.com",
      items: [
        { name: "Laptop X", quantity: 1, price: 1499.99 }
      ],
      address: "Example Street 123, Istanbul, Türkiye",
      payment_method: "Credit Card"
    },
    {
      order_id: 102,
      customer: "Jane Smith",
      date: "2025-01-15",
      total: 899.49,
      status: "Paid",
      email: "jane@example.com",
      items: [
        { name: "iPhone 14", quantity: 1, price: 899.49 }
      ],
      address: "Another Street 55, Ankara, Türkiye",
      payment_method: "Credit Card"
    },
    {
      order_id: 103,
      customer: "Can Yılmaz",
      date: "2025-02-01",
      total: 299.99,
      status: "Refunded",
      email: "can@example.com",
      items: [
        { name: "Mechanical Keyboard", quantity: 1, price: 299.99 }
      ],
      address: "Tech Ave 9, Izmir, Türkiye",
      payment_method: "Bank Transfer"
    }
  ];
}

export default function SMInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      // Replace with real backend when ready, e.g.:
      // const params = new URLSearchParams();
      // if (startDate) params.append("from", startDate);
      // if (endDate) params.append("to", endDate);
      // const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      // const data = await res.json();
      const data = await mockGetInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(list) {
    return list.filter((inv) => {
      const dateOk =
        (!startDate || inv.date >= startDate) &&
        (!endDate || inv.date <= endDate);

      const term = search.trim().toLowerCase();
      const searchOk =
        term === "" ||
        String(inv.order_id).includes(term) ||
        inv.customer.toLowerCase().includes(term);

      return dateOk && searchOk;
    });
  }

  const filteredInvoices = applyFilters(invoices);

  function openInvoice(inv) {
    setSelectedInvoice(inv);
  }

  function closeInvoice() {
    setSelectedInvoice(null);
  }

  function handlePrintInvoice() {
    if (!selectedInvoice) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const itemsHtml = (selectedInvoice.items || [])
      .map(
        (item) =>
          `<tr>
            <td>${item.name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">$${item.price.toFixed(2)}</td>
          </tr>`
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Invoice #${selectedInvoice.order_id}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
          h1 { font-size: 22px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          th { text-align: left; background: #f3f4f6; }
          .totals { margin-top: 16px; text-align: right; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>Invoice #${selectedInvoice.order_id}</h1>
        <p><strong>Customer:</strong> ${selectedInvoice.customer}</p>
        <p><strong>Email:</strong> ${selectedInvoice.email || "-"}</p>
        <p><strong>Address:</strong> ${selectedInvoice.address || "-"}</p>
        <p><strong>Date:</strong> ${selectedInvoice.date}</p>
        <p><strong>Payment Method:</strong> ${selectedInvoice.payment_method || "-"}</p>

        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          Total: $${selectedInvoice.total.toFixed(2)}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function handleDownloadPdf() {
    // When backend is ready, backend can return a real PDF:
    // window.open(`/api/admin/invoices/${selectedInvoice.order_id}/pdf`, "_blank");
    // For now, re-use print dialog so they can "Save as PDF" in the browser
    handlePrintInvoice();
  }

  return (
    <div className={styles.wrapper}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        Sales Manager <span className={styles.separator}>/</span> Invoice Management
      </div>

      <h1 className={styles.title}>Invoice Management</h1>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroupWide}>
          <label className={styles.filterLabel}>Search (Order ID or Customer)</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            placeholder="e.g. 101 or John Doe"
          />
        </div>
      </div>

      {/* Loading / empty states */}
      {loading ? (
        <div className={styles.infoBox}>Loading invoices...</div>
      ) : filteredInvoices.length === 0 ? (
        <div className={styles.infoBox}>No invoices found for this filter.</div>
      ) : null}

      {/* Table */}
      {!loading && filteredInvoices.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeaderRow}>
            <h2 className={styles.tableTitle}>Invoices</h2>
            <span className={styles.tableSubtitle}>
              Showing {filteredInvoices.length} of {invoices.length} invoice(s)
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.order_id}>
                    <td>{inv.order_id}</td>
                    <td>{inv.customer}</td>
                    <td>{inv.date}</td>
                    <td>
                      <span
                        className={
                          inv.status === "Paid"
                            ? styles.statusPaid
                            : inv.status === "Refunded"
                            ? styles.statusRefunded
                            : styles.statusOther
                        }
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td>${inv.total.toFixed(2)}</td>
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={() => openInvoice(inv)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Invoice #{selectedInvoice.order_id}</h2>
              <button
                className={styles.modalCloseIcon}
                onClick={closeInvoice}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3>Customer</h3>
                <p>{selectedInvoice.customer}</p>
                {selectedInvoice.email && <p>{selectedInvoice.email}</p>}
                {selectedInvoice.address && <p>{selectedInvoice.address}</p>}
              </div>

              <div className={styles.modalSection}>
                <h3>Details</h3>
                <p><strong>Date:</strong> {selectedInvoice.date}</p>
                {selectedInvoice.payment_method && (
                  <p><strong>Payment:</strong> {selectedInvoice.payment_method}</p>
                )}
                <p><strong>Status:</strong> {selectedInvoice.status}</p>
                <p><strong>Total:</strong> ${selectedInvoice.total.toFixed(2)}</p>
              </div>

              <div className={styles.modalSection}>
                <h3>Items</h3>
                {(selectedInvoice.items || []).length === 0 ? (
                  <p>No item details available.</p>
                ) : (
                  <ul className={styles.itemsList}>
                    {selectedInvoice.items.map((item, idx) => (
                      <li key={idx}>
                        {item.quantity} × {item.name} — ${item.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={handlePrintInvoice}
              >
                Print Invoice
              </button>
              <button
                className={styles.secondaryButton}
                onClick={handleDownloadPdf}
              >
                Save as PDF
              </button>
              <button className={styles.primaryButton} onClick={closeInvoice}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
