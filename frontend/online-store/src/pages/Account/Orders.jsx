import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Orders.css';
import { getOrders, cancelOrder } from '@/lib/ordersApi';
import { formatPrice } from '@/utils/formatPrice';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getOrders();
        const list = res?.orders ?? res;
        if (!mounted) return;
        setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setOrders([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      await cancelOrder(orderId);

      // update UI instantly
      setOrders(prev =>
        prev.map(o =>
          o.order_id === orderId
            ? { ...o, status: 'cancelled' }
            : o
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to cancel order');
    }
  };

  const displayOrders = orders.map(order => ({
    ...order,
    status: order.status || 'processing',
  }));

  return (
    <div className="orders-page">
      <h2>Order History</h2>

      {displayOrders.length === 0 ? (
        <p className="empty">You have no orders yet.</p>
      ) : (
        <div className="orders-list">
          {displayOrders.map(order => (
            <div className="order-card" key={order.order_id}>
              <div className="order-summary">
                <div>
                  <h3>Order #{order.order_id}</h3>
                  <p>
                    Date:{' '}
                    {order.order_date || order.created_at
                      ? new Date(order.order_date || order.created_at).toLocaleString()
                      : '—'}
                  </p>
                  <p>Total: {formatPrice(order.total_price, order.currency)}</p>
                </div>

                <div className="order-actions">
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>

                  <button
                    className="details-btn"
                    onClick={() => navigate(`/account/orders/${order.order_id}`)}
                  >
                    See Details
                  </button>

                  {order.status === 'processing' && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancelOrder(order.order_id)}
                    >
                      Cancel Order
                    </button>
                  )}
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