import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useCartStore from '../../store/cartStore';
import './OrderDetails.css';
import { getOrderById } from '../../lib/ordersApi';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCartStore();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getOrderById(id);
        if (!mounted) return;
        const ord = res.order ?? null;
        const items = res.items ?? [];
        setOrder({ ...ord, items });
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setOrder(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleRepurchase = item => {
    const cartItem = {
      product_id: item.product_id,
      name: item.name,
      model: item.model,
      price: Number(item.price_at_purchase || 0),
      quantity: 1,
    };

    addToCart(cartItem);

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
          {Number(item.price_at_purchase || 0).toFixed(2)} TL
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

  const subtotal =
    order.items?.reduce(
      (sum, it) => sum + Number(it.price_at_purchase || 0) * (it.quantity || 1),
      0
    ) || 0;
  const total = Number(order.total_price || subtotal);
  const discount = subtotal - total;
  const delivery = 0;
  const deliveryAddress =
    order.shipping_address || '123 Main Street, Istanbul, Türkiye (default delivery)';
  const invoiceAddress = 'Invoice address same as delivery (placeholder)';

  return (
    <div className="order-details-page">
      <button className="back-btn" onClick={() => navigate('/account/orders')}>
        ← Back to Orders
      </button>

      <div className="order-details-card">
        <h2>Order Details</h2>

        <div className="order-items">
          {order.items.map(item => {
            const lineTotal = Number(item.price_at_purchase || 0) * (item.quantity || 1);

            return (
              <div className="order-item-row" key={item.order_item_id}>
                <div className="item-left">
                  {/* no image in DB yet → just text */}
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
                  <span className="price-current">{lineTotal.toFixed(2)} TL</span>
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
