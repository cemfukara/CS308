import React, { useEffect, useState } from 'react';
import './Addresses.css';

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('addresses')) || [];
    setAddresses(stored);
  }, []);

  const addAddress = () => {
    if (!newAddress.trim()) return;
    const updated = [...addresses, newAddress];
    localStorage.setItem('addresses', JSON.stringify(updated));
    setAddresses(updated);
    setNewAddress('');
    showSuccess('New address added successfully!');
  };

  const deleteAddress = index => {
    const updated = addresses.filter((_, i) => i !== index);
    localStorage.setItem('addresses', JSON.stringify(updated));
    setAddresses(updated);
    showSuccess('Address removed successfully!');
  };

  const showSuccess = msg => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="address-card">
      <h2 className="address-title">My Addresses</h2>

      <div className="address-input-group">
        <input
          type="text"
          placeholder="Enter new address"
          value={newAddress}
          onChange={e => setNewAddress(e.target.value)}
          className="address-input"
        />
        <button onClick={addAddress} className="btn-add">
          Add
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="no-address">No addresses added yet.</p>
      ) : (
        <ul className="address-list">
          {addresses.map((addr, index) => (
            <li key={index} className="address-item">
              <span>{addr}</span>
              <button onClick={() => deleteAddress(index)} className="btn-delete">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {successMessage && (
        <div className="popup-success">
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Addresses;
