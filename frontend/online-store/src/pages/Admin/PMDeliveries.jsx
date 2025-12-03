import { useEffect, useState } from "react";
import styles from "./PMDeliveries.module.css";

export default function PMDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [selected, setSelected] = useState(null); // modal item

  useEffect(() => {
    loadDeliveries();
  }, []);

  async function loadDeliveries() {
    setDeliveries([
      {
        delivery_id: 1,
        order_id: 101,
        customer: "John Doe",
        product: "iPhone 14",
        quantity: 1,
        total_price: 899.99,
        address: "Example Street 123, Istanbul",
        status: "Processing",
        items: [
          {
            name: "iPhone 14",
            quantity: 1,
            price_at_purchase: 899.99,
            cost: 449.99,
          }
        ]
      },
      {
        delivery_id: 2,
        order_id: 102,
        customer: "Sarah Smith",
        product: "Laptop X",
        quantity: 1,
        total_price: 1499.99,
        address: "Another Street 55, Ankara",
        status: "Delivered",
        items: [
          {
            name: "Laptop X",
            quantity: 1,
            price_at_purchase: 1499.99,
            cost: 749.99,
          }
        ]
      }
    ]);
  }

  function toggleSelect(id) {
    setSelectedDeliveries((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function applyBulkStatus() {
    if (!bulkStatus || selectedDeliveries.length === 0) return;

    const updated = deliveries.map((d) =>
      selectedDeliveries.includes(d.delivery_id)
        ? { ...d, status: bulkStatus }
        : d
    );

    setDeliveries(updated);
    setSelectedDeliveries([]);
    setBulkStatus("");
  }

  function openModal(delivery) {
    setSelected({ ...delivery });
  }

  function closeModal() {
    setSelected(null);
  }

  function saveStatusUpdate() {
    setDeliveries(prev =>
      prev.map(d =>
        d.delivery_id === selected.delivery_id
          ? { ...selected }
          : d
      )
    );
    closeModal();
  }

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        Product Manager <span className={styles.sep}>/</span> Delivery Management
      </div>

      <h1 className={styles.title}>Delivery Management</h1>

      {/* Bulk Action Bar */}
      <div className={styles.bulkBar}>
        <select
          value={bulkStatus}
          onChange={(e) => setBulkStatus(e.target.value)}
          className={styles.bulkSelect}
        >
          <option value="">Select Status</option>
          <option value="Processing">Processing</option>
          <option value="In-Transit">In-Transit</option>
          <option value="Delivered">Delivered</option>
        </select>

        <button className={styles.applyBtn} onClick={applyBulkStatus}>
          Apply to Selected
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>Delivery ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total Price</th>
              <th>Address</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {deliveries.map((item) => (
              <tr key={item.delivery_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDeliveries.includes(item.delivery_id)}
                    onChange={() => toggleSelect(item.delivery_id)}
                  />
                </td>
                <td>{item.delivery_id}</td>
                <td>{item.order_id}</td>
                <td>{item.customer}</td>
                <td>{item.product}</td>
                <td>{item.quantity}</td>
                <td>${item.total_price.toFixed(2)}</td>
                <td>{item.address}</td>

                <td>
                  <span
                    className={
                      item.status === "Delivered"
                        ? styles.delivered
                        : item.status === "In-Transit"
                        ? styles.inTransit
                        : styles.processing
                    }
                  >
                    {item.status}
                  </span>
                </td>

                <td>
                  <button
                    className={styles.viewBtn}
                    onClick={() => openModal(item)}
                  >
                    View Full Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Invoice #{selected.order_id}</h2>

            <p><strong>Customer:</strong> {selected.customer}</p>
            <p><strong>Address:</strong> {selected.address}</p>

            <h3>Items</h3>
            <ul>
              {selected.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} — {i.quantity} × ${i.price_at_purchase}
                </li>
              ))}
            </ul>

            <p><strong>Total Price:</strong> ${selected.total_price.toFixed(2)}</p>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={selected.status === "Delivered"}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    status: e.target.checked ? "Delivered" : "Processing"
                  })
                }
              />
              Mark as Delivered
            </label>

            <div className={styles.modalActions}>
              <button className={styles.saveBtn} onClick={saveStatusUpdate}>
                Save
              </button>
              <button className={styles.closeBtn} onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
