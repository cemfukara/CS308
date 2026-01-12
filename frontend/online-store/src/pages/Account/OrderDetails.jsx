import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useCartStore from '@/store/cartStore';
import './OrderDetails.css';
import { getOrderById } from '@/lib/ordersApi';
import { formatPrice } from '@/utils/formatPrice';
import { api } from '@/lib/api'; 

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

  const handleRepurchase = async item => {
    const cartItem = {
      product_id: item.product_id,
      name: item.name,
      model: item.model,
      price: Number(item.price_at_purchase || 0),
      quantity: 1,
    };

    await addToCart(cartItem);

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
          {formatPrice(Number(item.price_at_purchase || 0), order.currency)}
        </p>
      </div>
    ));
  };

  const handleRefundRequest = async (item) => {
    const reason = prompt(`Please enter a reason for returning "${item.name}":`);
    if (reason === null) return; // cancelled

    try {
      await api.post('/refunds/request', {
        orderId: order.order_id,
        orderItemId: item.order_item_id,
        quantity: item.quantity, 
        reason: reason
      });
      toast.success('Refund request submitted! The Sales Manager will review it.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit refund request.');
    }
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
  const invoiceAddress = 'Invoice address same as delivery';

  // Check eligibility: Delivered AND < 30 days
  const isDelivered = order.status === 'delivered';
  const orderDate = new Date(order.order_date);
  const diffTime = Math.abs(new Date() - orderDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  const isWithin30Days = diffDays <= 30;
  const canRefund = isDelivered && isWithin30Days;

  return (
    <div className="order-details-page">
      <button className="back-btn" onClick={() => navigate('/account/orders')}>
        ← Back to Orders
      </button>

      <div className="order-details-card">
        <h2>Order Details #{order.order_id}</h2>
        <p style={{marginBottom: '5px'}}>Ordered on: {new Date(order.order_date).toLocaleDateString()}</p>
        <p style={{marginBottom: '20px'}}>Status: <span style={{fontWeight:'bold', textTransform:'capitalize'}}>{order.status}</span></p>

        <div className="order-items">
          {order.items.map(item => {
            const lineTotal = Number(item.price_at_purchase || 0) * (item.quantity || 1);

            return (
              <div className="order-item-row" key={item.order_item_id}>
                <div className="item-left">
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <p className="item-desc">Model: {item.model || 'Not specified'}</p>
                    <p>Quantity: {item.quantity}</p>
                    
                    <div style={{marginTop: '10px', display: 'flex', alignItems: 'center'}}>
                        <button className="repurchase-btn" onClick={() => handleRepurchase(item)}>
                          Repurchase
                        </button>

                        {canRefund && (
                        <button 
                            className="refund-btn" 
                            onClick={() => handleRefundRequest(item)}
                        >
                            Refund
                        </button>
                        )}
                    </div>
                  </div>
                </div>

                <div className="item-price">
                  <span className="price-current">{formatPrice(lineTotal, order.currency)}</span>
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
              <span>{formatPrice(subtotal, order.currency)}</span>
            </div>
            {discount > 0 && (
                <div className="summary-item">
                <span>Discount</span>
                <span>- {formatPrice(discount, order.currency)}</span>
                </div>
            )}
            <div className="summary-item">
              <span>Delivery</span>
              <span>{delivery > 0 ? `${formatPrice(delivery, order.currency)}` : 'Free'}</span>
            </div>
            <div className="summary-item total">
              <strong>Total Paid</strong>
              <strong className="total-price">{formatPrice(total, order.currency)}</strong>
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