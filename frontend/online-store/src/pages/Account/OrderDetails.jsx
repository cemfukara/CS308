import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useCartStore from '../../store/cartStore';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCartStore();

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const found = storedOrders.find(o => String(o.id) === String(id));
    setOrder(found || null);
  }, [id]);

  const handleRepurchase = item => {
    addToCart(item);

    const imageUrl = new URL(`../../assets/${item.image}`, import.meta.url).href;

    toast.custom(t => (
      <div
        className={`toast-box ${t.visible ? 'animate-enter' : 'animate-leave'}`}
        style={{
          background: '#6b7280',
          borderRadius: '12px',
          padding: '16px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.25)',
        }}
      >
        <img
          src={imageUrl}
          alt={item.name}
          style={{
            width: '65px',
            height: '65px',
            borderRadius: '8px',
            objectFit: 'cover',
            border: '1px solid #ccc',
          }}
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>{item.name}</h3>
          <p style={{ color: '#00FF7F', fontWeight: '600' }}>Added to cart</p>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              navigate('/cart');
            }}
            style={{
              background: '#1E3AFA',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              padding: '4px 10px',
              marginTop: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            View Cart
          </button>
        </div>
        <p
          style={{
            fontWeight: '800',
            fontSize: '1.2rem',
            color: '#00FF7F',
          }}
        >
          ${item.price.toFixed(2)}
        </p>
      </div>
    ));
  };

  if (!order) {
    return (
      <div className="order-details-page">
        <p className="empty">Order not found.</p>
        <button className="back-btn" onClick={() => navigate('/account/orders')}>
          ← Back to Orders
        </button>
      </div>
    );
  }

  const subtotal = order.originalTotal || order.total;
  const discount = order.discount || (order.originalTotal ? order.originalTotal - order.total : 0);
  const delivery = order.deliveryCost || 0;
  const total = order.total;
  const deliveryAddress =
    order.deliveryAddress || '123 Main Street, Istanbul, Türkiye (default delivery)';
  const invoiceAddress =
    order.invoiceAddress || '456 Billing Avenue, Istanbul, Türkiye (default invoice)';

  return (
    <div className="order-details-page">
      <button className="back-btn" onClick={() => navigate('/account/orders')}>
        ← Back to Orders
      </button>

      <div className="order-details-card">
        <h2>Order Details</h2>

        <div className="order-items">
          {order.items.map((item, i) => {
            const imageUrl = new URL(`../../assets/${item.image}`, import.meta.url).href;

            return (
              <div className="order-item-row" key={i}>
                <div className="item-left">
                  <img src={imageUrl} alt={item.name} className="item-img" />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="item-desc">Model: {item.model || 'Not specified'}</p>
                    <p>Quantity: {item.quantity}</p>
                    <button className="repurchase-btn" onClick={() => handleRepurchase(item)}>
                      Repurchase
                    </button>
                  </div>
                </div>

                <div className="item-price">
                  <span className="price-current">
                    {(item.price * item.quantity).toFixed(2)} TL
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="order-summary">
          <h3>Summary</h3>
          <div className="summary-column">
            <div className="summary-item">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} TL</span>
            </div>
            <div className="summary-item">
              <span>Discount</span>
              <span>- {discount.toFixed(2)} TL</span>
            </div>
            <div className="summary-item">
              <span>Delivery</span>
              <span>{delivery > 0 ? `${delivery.toFixed(2)} TL` : 'Free'}</span>
            </div>
            <div className="summary-item total">
              <strong>Total Paid</strong>
              <strong className="total-price">{total.toFixed(2)} TL</strong>
            </div>
          </div>
        </div>

        <div className="address-section">
          <div>
            <h4>Delivery Address</h4>
            <p>{deliveryAddress}</p>
          </div>
          <div>
            <h4>Invoice Address</h4>
            <p>{invoiceAddress}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
