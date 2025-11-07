import React, { useState } from 'react';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSendReset = () => {
    setErrorMsg('');

    const users = JSON.parse(localStorage.getItem('users')) || [];

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const userExists = users.find(u => u.email === email);
    if (!userExists) {
      setErrorMsg('No account found with this email.');
      return;
    }

    // ✅ Mock sending reset link
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="forgot-container">
        <div className="forgot-card confirmation-card">
          <div className="checkmark-circle">
            <div className="checkmark">✓</div>
          </div>
          <h2>Reset Link Sent</h2>
          <p>
            A password reset link has been sent to <strong>{email}</strong>. <br />
            Please check your inbox.
          </p>
          <button className="back-to-login-btn" onClick={() => (window.location.href = '/auth')}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>
        <p>Enter your registered email address to reset your password.</p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setErrorMsg('');
          }}
        />

        {errorMsg && <p className="error-msg">{errorMsg}</p>}

        <button className="send-btn" onClick={handleSendReset}>
          Send Reset Link
        </button>

        <p className="back-to-login" onClick={() => (window.location.href = '/auth')}>
          Back to Login
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
