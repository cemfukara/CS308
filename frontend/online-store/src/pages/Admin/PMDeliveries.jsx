// src/pages/Admin/PMDeliveries.jsx

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import styles from "./PMDeliveries.module.css";

export default function PMDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [hideCompleted, setHideCompleted] = useState(false);
  const [showOnlyCompleted, setShowOnlyCompleted] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    try {
      setLoading(true);
      const res = await api.get("/orders");
      setDeliveries(res.orders ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load deliveries.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(orderId) {
    setSelectedDeliveries(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }

  async function updateStatus(orderId, newStatus) {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { status: newStatus });

      setDeliveries(prev =>
        prev.map(o =>
          o.order_id === orderId ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update delivery status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function applyBulkStatus() {
    if (!bulkStatus || selectedDeliveries.length === 0) return;
    for (const id of selectedDeliveries) {
      await updateStatus(id, bulkStatus);
    }
    setSelectedDeliveries([]);
    setBulkStatus("");
  }

  async function openInvoice(order) {
    try {
      setLoadingInvoice(true);
      const res = await api.get(`/orders/${order.order_id}`);
      setSelectedOrder({
        ...res.order,
        items: res.items ?? []
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load invoice.");
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
      list = list.filter(
        o => o.status !== "delivered" && o.status !== "cancelled"
      );
    }

    if (showOnlyCompleted) {
      list = list.filter(
        o => o.status === "delivered" || o.status === "cancelled"
      );
    }

    return list;
  }

  function statusClass(status) {
    if (status === "delivered") return styles.delivered;
    if (status === "in-transit") return styles.inTransit;
    return styles.processing;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.breadcrumb}>
        Product Manager <span className={styles.sep}>/</span> Delivery Management
      </div>

      <h1 className={styles.title}>Delivery Management</h1>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className={styles.bulkBar}>
        <select
          value={bulkStatus}
          onChange={e => setBulkStatus(e.target.value)}
          className={styles.bulkSelect}
        >
          <option value="">Select Status</option>
          <option value="processing">Processing</option>
          <option value="in-transit">In-Transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button className={styles.applyBtn} onClick={applyBulkStatus}>
          Apply to Selected
        </button>

        <button
          className={styles.hideBtn}
          onClick={() => {
            setHideCompleted(!hideCompleted);
            setShowOnlyCompleted(false);
          }}
        >
          {hideCompleted ? "Show All" : "Hide Completed"}
        </button>

        <button
          className={styles.showCompletedBtn}
          onClick={() => {
            setShowOnlyCompleted(!showOnlyCompleted);
            setHideCompleted(false);
          }}
        >
          {showOnlyCompleted ? "Show All" : "Show Completed"}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th />
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Address</th>
              <th>Total</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredDeliveries().map(order => (
              <tr key={order.order_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDeliveries.includes(order.order_id)}
                    onChange={() => toggleSelect(order.order_id)}
                  />
                </td>

                <td>{order.order_id}</td>
                <td>{order.customer_email}</td>
                <td>{order.item_count}</td>
                <td>{order.shipping_address}</td>
                <td>{Number(order.total_price).toFixed(2)}</td>

                <td>
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("en-GB")
                    : "—"}
                </td>

                <td>
                  <span className={statusClass(order.status)}>
                    {order.status}
                  </span>
                </td>

                {/* ⭐ HORIZONTAL BUTTONS ADDED HERE */}
                <td>
                  <div className={styles.actionRow}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => openInvoice(order)}
                    >
                      View Invoice
                    </button>

                    <button
                      className={styles.actionBtn}
                      disabled={updatingId === order.order_id}
                      onClick={() =>
                        updateStatus(
                          order.order_id,
                          order.status === "processing"
                            ? "in-transit"
                            : order.status === "in-transit"
                            ? "delivered"
                            : "delivered"
                        )
                      }
                    >
                      {order.status === "processing"
                        ? "Mark In-Transit"
                        : order.status === "in-transit"
                        ? "Mark Delivered"
                        : "Delivered"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Invoice #{selectedOrder.order_id}</h2>

            <p>
              <strong>Customer:</strong> {selectedOrder.customer_email}
            </p>
            <p>
              <strong>Address:</strong> {selectedOrder.shipping_address}
            </p>

            <h3>Items</h3>
            <ul>
              {selectedOrder.items.map((i, idx) => (
                <li key={idx}>
                  {i.product_name} — {i.quantity} ×{" "}
                  {Number(i.price_at_purchase).toFixed(2)}
                </li>
              ))}
            </ul>

            <p>
              <strong>Total:</strong>{" "}
              {Number(selectedOrder.total_price).toFixed(2)}
            </p>

            <div className={styles.modalActions}>
              <button className={styles.closeBtn} onClick={closeInvoice}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
