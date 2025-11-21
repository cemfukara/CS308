import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Payment.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCcVisa, faCcMastercard } from '@fortawesome/free-brands-svg-icons';
import useCartStore from '../../store/cartStore';

const Payment = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'card' | 'cod'
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const cart = useCartStore(state => state.cart || []);

  useEffect(() => {
    const stored = localStorage.getItem('selectedAddress');
    if (stored) {
      setAddress(JSON.parse(stored));
    }
  }, []);

  const handleBack = () => {
    navigate('/checkout');
  };

  const getCardDigits = () => cardNumber.replace(/\D/g, '');

  const getCardType = () => {
    const digits = getCardDigits();
    if (digits.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
    return null;
  };

  const handleCardNumberChange = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16); // up to 16 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4); // MMYY
    let formatted = digits;

    if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setExpiry(formatted);
  };

  const handleCvvChange = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4); // 3–4 digits
    setCvv(digits);
  };

  const isValidExpiry = () => {
    const cleaned = expiry.replace(/\D/g, '');
    if (cleaned.length < 4) return false;
    const mm = parseInt(cleaned.slice(0, 2), 10);
    const yy = parseInt(cleaned.slice(2), 10);
    if (Number.isNaN(mm) || Number.isNaN(yy)) return false;
    if (mm < 1 || mm > 12) return false;
    return true;
  };

  const isCardValid = (() => {
    if (cardName.trim() === '') return false;

    const digits = getCardDigits();
    if (digits.length < 13) return false; // very loose check, usually 16
    if (!isValidExpiry()) return false;
    if (cvv.length < 3) return false;
    return true;
  })();

  const canPay = paymentMethod === 'cod' || isCardValid;

  const handlePay = () => {
    if (!canPay) return;
    setIsPaying(true);
    const digits = getCardDigits();
    const payInfo =
      paymentMethod === 'cod'
        ? { method: 'Cash on Delivery' }
        : {
            method: 'Credit Card',
            cardName: cardName.trim(),
            last4: digits.slice(-4),
            cardType: getCardType(),
          };
    localStorage.setItem('payInfo', JSON.stringify(payInfo));

    const items = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: item.quantity || 1,
      currency: item.currency || '$',
      image: item.image || null,
    }));

    const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const order = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      address,
      payment: payInfo,
      items,
      total,
    };

    localStorage.setItem('recentOrder', JSON.stringify(order));

    const rawOrders = localStorage.getItem('orders');
    const oldOrders = rawOrders ? JSON.parse(rawOrders) : [];
    localStorage.setItem('orders', JSON.stringify([...oldOrders, order]));

    setTimeout(() => {
      setIsPaying(false);
      navigate('/checkout/confirmation');
    }, 1000);
  };

  if (!address) {
    return (
      <div className={styles.paymentContainer}>
        <h2>Payment</h2>
        <p>No address selected.</p>
        <button className={styles.backBtn} onClick={handleBack}>
          Back to address selection
        </button>
      </div>
    );
  }

  const cardType = getCardType();

  return (
    <div className={styles.paymentContainer}>
      <h2>Payment</h2>

      <section className={styles.summaryBox}>
        <h3>Deliver to</h3>
        <p>{address}</p>
        <button className={styles.changeBtn} onClick={handleBack}>
          Change address
        </button>
      </section>

      <section className={styles.methodBox}>
        <h3>Choose payment method</h3>
        <label className={styles.methodOption}>
          <input
            type="radio"
            name="paymentMethod"
            value="card"
            checked={paymentMethod === 'card'}
            onChange={() => setPaymentMethod('card')}
          />
          <span>Credit Card</span>
        </label>
        <label className={styles.methodOption}>
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
          />
          <span>Cash on Delivery</span>
        </label>
      </section>

      {paymentMethod === 'card' && (
        <section className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <h3>Card details</h3>
            {cardType && (
              <div className={styles.cardBrand}>
                <FontAwesomeIcon icon={cardType === 'visa' ? faCcVisa : faCcMastercard} />
                <span>{cardType === 'visa' ? 'Visa' : 'Mastercard'}</span>
              </div>
            )}
          </div>
          <div className={styles.fieldRow}>
            <label>
              Name on card
              <input
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                placeholder="Full name"
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label>
              Card number
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
              />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <label>
              Expiry
              <input type="text" value={expiry} onChange={handleExpiryChange} placeholder="MM/YY" />
            </label>
            <label>
              CVV
              <input type="password" value={cvv} onChange={handleCvvChange} placeholder="***" />
            </label>
          </div>
        </section>
      )}
      <button
        className={`${styles.payBtn} ${isPaying ? styles.loading : ''}`}
        onClick={handlePay}
        disabled={!canPay || isPaying}
        title={
          paymentMethod === 'card' && !isCardValid ? 'Fill in all card fields correctly to pay' : ''
        }
      >
        {isPaying
          ? 'Processing...'
          : paymentMethod === 'cod'
            ? 'Place order (Cash on Delivery)'
            : 'Pay now'}
        {isPaying && <span className={styles.spinner} />}
      </button>
    </div>
  );
};

export default Payment;
