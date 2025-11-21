import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(storedOrders);
  }, []);

  const displayOrders = orders.map(order => ({
    ...order,
    status: order.status || 'Processing',
  }));

  return (
    <div className="orders-page">
      <h2>Order History</h2>

      {displayOrders.length === 0 ? (
        <p className="empty">You have no orders yet.</p>
      ) : (
        <div className="orders-list">
          {displayOrders.map(order => (
            <div className="order-card" key={order.id}>
              <div className="order-summary">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p>
                    Date:{' '}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : order.date || '—'}
                  </p>
                  <p>
                    Total: $
                    {(typeof order.total === 'number'
                      ? order.total
                      : Number(order.total || 0)
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="order-actions">
                  <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                  <button
                    className="details-btn"
                    onClick={() => navigate(`/account/orders/${order.id}`)}
                  >
                    See Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
