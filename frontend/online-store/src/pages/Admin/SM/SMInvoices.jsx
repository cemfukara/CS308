import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import styles from "../Admin.module.css";
import { formatPrice } from "@/utils/formatPrice";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SMInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const printRef = useRef(null);

  // ---------------------------------------------------------
  // LOAD ALL INVOICES USING /api/invoice/range
  // ---------------------------------------------------------
  async function loadInvoices() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        start: "2000-01-01",
        end: "2100-01-01",
      });

      const res = await api.get(`/invoice/range?${params.toString()}`);

      const list = Array.isArray(res) ? res : [];

      const mapped = list.map((o) => ({
        order_id: o.order_id,
        customer: o.user_email || "—",
        email: o.user_email || "—",
        address: o.address || "—",
        date: o.order_date ? new Date(o.order_date) : null,
        status: o.status,
        total: o.total_price,
        currency: "TL",
      }));

      setInvoices(mapped);
      setFiltered(mapped);
    } catch (err) {
      console.error("INVOICE LOAD ERROR:", err);
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  // ---------------------------------------------------------
  // SEARCH + FILTER
  // ---------------------------------------------------------
  function applyFilters() {
    let data = [...invoices];
    const q = searchQuery.toLowerCase().trim();

    if (q !== "") {
      data = data.filter(
        (inv) =>
          String(inv.order_id).includes(q) ||
          inv.customer.toLowerCase().includes(q) ||
          inv.status.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      data = data.filter((inv) => inv.date && inv.date >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter((inv) => inv.date && inv.date <= to);
    }

    setFiltered(data);
  }

  useEffect(() => {
    applyFilters();
  }, [searchQuery, fromDate, toDate, invoices]);

  // ---------------------------------------------------------
  // OPEN INVOICE DETAILS
  // USE THE NEW BACKEND ROUTE YOU CREATED:
  //     /api/invoice/:orderId/json
  // This returns: { invoice, items }
  // ---------------------------------------------------------
  async function openInvoice(inv) {
    try {
      setLoadingInvoice(true);
      setError("");

      const res = await api.get(`/invoice/${inv.order_id}/json`);

      if (!res) {
        setSelectedInvoice({ ...inv, items: [] });
        return;
      }

      const invoice = res.invoice || {};
      const items = Array.isArray(res.items) ? res.items : [];

      setSelectedInvoice({
        ...inv,
        customer: invoice.customer_email || inv.customer,
        email: invoice.customer_email || inv.email,
        address: invoice.shipping_address || inv.address,
        items: items.map((it) => ({
          name: it.product_name || it.name || "Item",
          quantity: it.quantity ?? 1,
          price_at_purchase: it.price_at_purchase ?? 0,
        })),
      });
    } catch (err) {
      console.error("INVOICE DETAIL ERROR:", err);
      setSelectedInvoice({
        ...inv,
        items: [],
      });
    } finally {
      setLoadingInvoice(false);
    }
  }

  function closeInvoice() {
    setSelectedInvoice(null);
  }

  function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // ---------------------------------------------------------
  // SAVE PDF
  // Uses backend route:
  //     /api/invoice/:orderId/pdf
  // ---------------------------------------------------------
  const savePDF = () => {
    if (!selectedInvoice?.order_id) return;
    window.open(`/api/invoice/${selectedInvoice.order_id}/pdf`, "_blank");
  };

  // ---------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------
  return (
    <div className={styles.wrapper}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <Link to="/admin" className={styles.crumbLink}>
          Admin
        </Link>
        <span className={styles.crumbSeparator}>/</span>
        <span className={styles.crumbCurrent}>Invoice Management</span>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>Invoices</h1>
      </div>

      {/* Controls */}
      <div className={styles.controlsRow}>
        <input
          type="text"
          placeholder="Search by ID, customer, or status..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className={styles.filterGroup}>
          <label>From:</label>
          <DatePicker
            selected={fromDate}
            onChange={(date) => setFromDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className={styles.datePickerInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>To:</label>
          <DatePicker
            selected={toDate}
            onChange={(date) => setToDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className={styles.datePickerInput}
          />
        </div>
      </div>

      {loading && <p className={styles.loadingPill}>Loading invoices…</p>}
      {error && <p className={styles.errorBanner}>{error}</p>}

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
            {filtered.map((inv) => (
              <tr key={inv.order_id} className={styles.tr}>
                <td className={styles.td}>{inv.order_id}</td>
                <td className={styles.td}>{inv.customer}</td>
                <td className={styles.td}>{formatDate(inv.date)}</td>
                <td className={styles.td}>
                  <span
                    className={`${styles.statusBadge} ${
                      styles["status_" + inv.status] || ""
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className={styles.td}>
                  {formatPrice(inv.total, inv.currency)}
                </td>
                <td className={styles.td}>
                  <button
                    className={styles.editBtn}
                    onClick={() => openInvoice(inv)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && !loading && (
              <tr className={styles.tr}>
                <td className={styles.td} colSpan={6}>
                  No invoices found for this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL + PRINT AREA */}
      {selectedInvoice && (
        <div className={styles.modalOverlay}>
          <div
            className={`${styles.modal} ${styles.printArea}`}
            ref={printRef}
          >
            {/* HEADER */}
            <div className={styles.invoiceHeader}>
              <div>
                <h2 className={styles.invoiceTitle}>Invoice</h2>
                <p className={styles.invoiceId}>#{selectedInvoice.order_id}</p>
              </div>
              <div className={styles.invoiceBrand}>
                <div className={styles.invoiceBrandName}>TechZone</div>
                <div className={styles.invoiceBrandSub}>
                  Online Electronics Store
                </div>
              </div>
            </div>

            {/* META */}
            <div className={styles.invoiceMetaRow}>
              <div className={styles.invoiceMetaBlock}>
                <h3 className={styles.invoiceMetaTitle}>Billed to</h3>
                <p className={styles.invoiceMetaLine}>
                  {selectedInvoice.email}
                </p>
                {selectedInvoice.address !== "—" && (
                  <p className={styles.invoiceMetaLine}>
                    {selectedInvoice.address}
                  </p>
                )}
              </div>

              <div className={styles.invoiceMetaBlockRight}>
                <p className={styles.invoiceMetaLabel}>
                  Invoice date:{" "}
                  <span className={styles.invoiceMetaValue}>
                    {formatDate(selectedInvoice.date)}
                  </span>
                </p>
                <p className={styles.invoiceMetaLabel}>
                  Status:{" "}
                  <span className={styles.invoiceStatusPill}>
                    {selectedInvoice.status}
                  </span>
                </p>
              </div>
            </div>

            {/* ITEMS */}
            <h3 className={styles.invoiceItemsTitle}>Items</h3>

            {loadingInvoice && <p>Loading items…</p>}

            <table className={styles.invoiceItemsTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {(selectedInvoice.items || []).length === 0 &&
                  !loadingInvoice && (
                    <tr>
                      <td className={styles.invoiceEmptyRow} colSpan={4}>
                        No items found for this invoice.
                      </td>
                    </tr>
                  )}

                {(selectedInvoice.items || []).map((item, idx) => {
                  const qty = Number(item.quantity ?? 1);
                  const unit = Number(item.price_at_purchase ?? 0);
                  const lineTotal = qty * unit;

                  return (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{qty}</td>
                      <td>
                        {formatPrice(unit, selectedInvoice.currency)}
                      </td>
                      <td>
                        {formatPrice(lineTotal, selectedInvoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className={styles.invoiceTotalsRow}>
              <div className={styles.invoiceTotalsSpacer}></div>
              <div className={styles.invoiceTotalsBox}>
                <div className={styles.invoiceTotalsLine}>
                  <span>Subtotal</span>
                  <span>
                    {formatPrice(
                      selectedInvoice.total,
                      selectedInvoice.currency
                    )}
                  </span>
                </div>

                <div className={styles.invoiceTotalsLineStrong}>
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      selectedInvoice.total,
                      selectedInvoice.currency
                    )}{" "}
                    TL
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <p className={styles.invoiceFooterNote}>
              This is a system-generated invoice from TechZone.
            </p>

            {/* ACTION BUTTONS */}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeInvoice}>
                Close
              </button>
              <button
                className={styles.editBtn}
                onClick={() => window.print()}
              >
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

