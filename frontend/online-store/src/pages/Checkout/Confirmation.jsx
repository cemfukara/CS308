import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './Confirmation.module.css';
import useCartStore from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';

const Confirmation = () => {
  const navigate = useNavigate();
  const cart = useCartStore(state => state.cart || []);
  const clearCart = useCartStore(state => state.clearCart);

  const order = useMemo(() => {
    const raw = localStorage.getItem('recentOrder');
    return raw ? JSON.parse(raw) : null;
  }, []);

  const selectedAddress = useMemo(() => {
    if (order?.address) return order.address;
    const stored = localStorage.getItem('selectedAddress');
    return stored ? JSON.parse(stored) : null;
  }, [order]);

  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const formattedDate = createdAt ? createdAt.toLocaleString() : '';

  const paymentInfo = useMemo(() => {
    if (order?.payment) return order.payment;
    const stored = localStorage.getItem('payInfo');
    return stored ? JSON.parse(stored) : null;
  }, [order]);

  const items = order?.items ?? cart;

  const total = items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    return sum + price * qty;
  }, 0);

  useEffect(() => {
    if (!order) {
      const id = setTimeout(() => navigate('/'), 500);
      return () => clearTimeout(id);
    }
  }, [order, navigate]);

  useEffect(() => {
    // clear cart when leaving confirmation page
    return () => {
      clearCart().catch(err => console.error('Failed to clear cart:', err));
    };
  }, [clearCart]);

  if (!selectedAddress || !paymentInfo) {
    return (
      <div className={styles.confirmationContainer}>
        <p>Redirecting…</p>
      </div>
    );
  }

  const paymentLabel =
    paymentInfo.method === 'Credit Card'
      ? `${paymentInfo.method} •••• ${paymentInfo.last4 || ''}`
      : paymentInfo.method;

  const handleDownloadInvoice = () => {
    if (order?.id) {
      // Use backend-generated professional PDF
      window.open(`/api/invoice/${order.id}/pdf`, '_blank');
    }
  };

  return (
    <div className={`${styles.confirmationContainer} ${styles.printArea}`}>
      <header className={styles.header}>
        <div className={styles.iconWrap}>
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <div>
          <h1>Order placed successfully</h1>
          <p className={styles.orderMeta}>
            <span>
              Order ID: <strong>{order.id}</strong>
            </span>
            {formattedDate && (
              <>
                {' · '}
                <span>{formattedDate}</span>
              </>
            )}
          </p>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.infoColumn}>
          <div className={styles.infoCard}>
            <h2>Delivery address</h2>
            <p className={styles.addressText}>{selectedAddress}</p>
          </div>

          <div className={styles.infoCard}>
            <h2>Payment</h2>
            <p>{paymentLabel}</p>
          </div>
        </section>

        <section className={styles.summaryCard}>
          <h2>Order summary</h2>
          {items.length === 0 ? (
            <p className={styles.emptyNote}>Your order has been received.</p>
          ) : (
            <>
              <ul className={styles.itemList}>
                {items.map(item => (
                  <li key={item.id ?? item.model} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>Quantity: {item.quantity || 1}</span>
                    </div>
                    <span className={styles.itemPrice}>
                      {formatPrice(Number(item.price) * (item.quantity || 1), item.currency)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalValue}>{formatPrice(total, items[0]?.currency)}</span>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <button className={styles.secondaryBtn} onClick={() => navigate('/account/orders')}>
          View orders
        </button>
        <button className={styles.secondaryBtn} onClick={handleDownloadInvoice}>
          Download invoice (PDF)
        </button>
        <button className={styles.primaryBtn} onClick={() => navigate('/products')}>
          Continue shopping
        </button>
      </footer>
    </div>
  );
};

export default Confirmation;
