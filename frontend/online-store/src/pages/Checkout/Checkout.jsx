import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './Checkout.module.css';

const Checkout = () => {
  const navigate = useNavigate();
  const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
  const [selectedAddress, setSelectedAddress] = useState(null);

  const handleContinue = () => {
    if (!selectedAddress) {
      alert('Please select an address');
      return;
    }
    localStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
    navigate('/checkout/payment');
  };

  return (
    <div className={styles.checkoutContainer}>
      <h2>Select Delivery Address</h2>

      <div className={styles.addressList}>
        {addresses.length === 0 ? (
          <p>No saved addresses.</p>
        ) : (
          addresses.map((address, index) => (
            <label
              key={index}
              className={`${styles.addressCard} ${selectedAddress === address ? styles.selected : ''}`}
            >
              <input
                type="radio"
                name="selectedAddress"
                value={address}
                checked={selectedAddress === address}
                onChange={() => setSelectedAddress(address)}
              ></input>
              <span style={{ marginLeft: '8px' }}>{address}</span>
            </label>
          ))
        )}

        <button className={styles.newAddressBtn} onClick={() => navigate('/account/addresses')}>
          <FontAwesomeIcon icon={faPlus} />
          Add new address
        </button>
      </div>

      <button className={styles.continueBtn} onClick={handleContinue} disabled={!selectedAddress}>
        Continue
      </button>
    </div>
  );
};
export default Checkout;
