import React, { useEffect, useState } from 'react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('orders')) || [];
    setOrders(stored);
  }, []);

  return (
    <div className="orders-card">
      <h2 className="orders-title">My Orders</h2>
      {orders.length === 0 ? (
        <p className="no-orders">You have no orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order, idx) => (
            <div key={idx} className="order-item">
              <h4>Order #{idx + 1}</h4>
              <p>Date: {order.date}</p>
              <p>Total: ${order.total}</p>
              <p>
                Status: <strong>{order.status}</strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
