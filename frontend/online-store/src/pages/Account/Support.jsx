import React, { useState } from 'react';
import './Support.css';

const Support = () => {
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    localStorage.setItem('lastSupportMessage', message);
    setMessage('');
    showSuccess('Your message has been submitted!');
  };

  const showSuccess = msg => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="support-card">
      <h2 className="support-title">Support</h2>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Describe your issue or question..."
        className="support-textarea"
      ></textarea>
      <button className="btn-send" onClick={handleSubmit}>
        Send Message
      </button>

      {successMessage && (
        <div className="popup-success">
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Support;
