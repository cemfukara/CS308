import React, { useEffect, useState } from 'react';
import './ProfileInfo.css';

const ProfileInfo = () => {
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    emailVerified: true,
    phoneVerified: true,
  });

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [mockEmailCode, setMockEmailCode] = useState('');
  const [mockPhoneCode, setMockPhoneCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [error, setError] = useState('');

  // ✅ success notification popup
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const logged = JSON.parse(localStorage.getItem('loggedInUser'));
    if (logged) {
      setUser({
        fullName: logged.fullName || '',
        email: logged.email || '',
        phone: logged.phone || '',
        emailVerified: typeof logged.emailVerified === 'boolean' ? logged.emailVerified : true,
        phoneVerified: typeof logged.phoneVerified === 'boolean' ? logged.phoneVerified : true,
      });
      setForm({
        fullName: logged.fullName || '',
        email: logged.email || '',
        phone: logged.phone || '',
      });
    }
  }, []);

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  const isValidPhone = phone => /^\d{10,15}$/.test(String(phone).trim());

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));

    if (name === 'email') setUser(p => ({ ...p, emailVerified: false }));
    if (name === 'phone') setUser(p => ({ ...p, phoneVerified: false }));
  };

  // ===== EMAIL VERIFICATION =====
  const startEmailVerification = () => {
    setError('');
    if (!isValidEmail(form.email)) {
      setError('Please enter a valid email before verification.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setMockEmailCode(code);
    setEmailCode('');
    setShowEmailPopup(true);
  };

  const confirmEmailVerification = () => {
    if (emailCode.trim() === mockEmailCode) {
      setUser(p => ({ ...p, emailVerified: true }));
      setShowEmailPopup(false);
      showSuccess('Email verified successfully!');
    } else {
      setError('Invalid email verification code.');
    }
  };

  // ===== PHONE VERIFICATION =====
  const startPhoneVerification = () => {
    setError('');
    if (!isValidPhone(form.phone)) {
      setError('Please enter a valid phone number before verification.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setMockPhoneCode(code);
    setPhoneCode('');
    setShowPhonePopup(true);
  };

  const confirmPhoneVerification = () => {
    if (phoneCode.trim() === mockPhoneCode) {
      setUser(p => ({ ...p, phoneVerified: true }));
      setShowPhonePopup(false);
      showSuccess('Phone verified successfully!');
    } else {
      setError('Invalid phone verification code.');
    }
  };

  // ===== SAVE PROFILE =====
  const saveInformation = () => {
    if (!form.fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('Please provide a valid email.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Please provide a valid phone number (10–15 digits).');
      return;
    }
    if (!user.emailVerified || !user.phoneVerified) {
      setError('Please verify your email and phone before saving.');
      return;
    }

    const updatedUser = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: (JSON.parse(localStorage.getItem('loggedInUser')) || {}).password,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    };
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx = users.findIndex(
      u => u.email === user.email || (u.fullName === user.fullName && u.phone === user.phone)
    );
    if (idx > -1) users[idx] = { ...users[idx], ...updatedUser };
    else users.push(updatedUser);
    localStorage.setItem('users', JSON.stringify(users));

    setUser(updatedUser);
    setError('');
    showSuccess('Profile updated successfully!');
  };

  const cancelAccount = () => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filtered = users.filter(u => u.email !== user.email);
    localStorage.setItem('users', JSON.stringify(filtered));
    localStorage.removeItem('loggedInUser');
    window.location.href = '/auth';
  };

  // ✅ reusable success popup
  const showSuccess = msg => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="profile-card">
      <h2 className="profile-title">Profile Information</h2>

      <label className="profile-label">Full Name</label>
      <input
        className="profile-input"
        type="text"
        name="fullName"
        value={form.fullName}
        onChange={onChange}
      />

      <label className="profile-label">Email</label>
      <div className="profile-row">
        <input
          className="profile-input"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
        />
        {user.emailVerified ? (
          <span className="chip chip-verified">Verified</span>
        ) : (
          <button className="chip chip-action" onClick={startEmailVerification}>
            Verify
          </button>
        )}
      </div>

      <label className="profile-label">Phone</label>
      <div className="profile-row">
        <input
          className="profile-input"
          type="text"
          name="phone"
          value={form.phone}
          onChange={onChange}
        />
        {user.phoneVerified ? (
          <span className="chip chip-verified">Verified</span>
        ) : (
          <button className="chip chip-action" onClick={startPhoneVerification}>
            Verify
          </button>
        )}
      </div>

      {error && <p className="profile-error">{error}</p>}

      <button className="btn btn-save" onClick={saveInformation}>
        Save Information
      </button>
      <button className="btn btn-cancel" onClick={cancelAccount}>
        Cancel Account
      </button>

      {/* Email popup */}
      {showEmailPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Email Verification</h3>
            <p>Enter the 6-digit code sent to your email.</p>
            <p className="mock-hint">
              (Mock code: <strong>{mockEmailCode}</strong>)
            </p>
            <input
              type="text"
              maxLength={6}
              value={emailCode}
              onChange={e => setEmailCode(e.target.value)}
              placeholder="Enter code"
              className="popup-input"
            />
            <div className="popup-buttons">
              <button className="popup-confirm" onClick={confirmEmailVerification}>
                Confirm
              </button>
              <button className="popup-cancel" onClick={() => setShowEmailPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone popup */}
      {showPhonePopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Phone Verification</h3>
            <p>Enter the 6-digit code sent to your phone.</p>
            <p className="mock-hint">
              (Mock code: <strong>{mockPhoneCode}</strong>)
            </p>
            <input
              type="text"
              maxLength={6}
              value={phoneCode}
              onChange={e => setPhoneCode(e.target.value)}
              placeholder="Enter code"
              className="popup-input"
            />
            <div className="popup-buttons">
              <button className="popup-confirm" onClick={confirmPhoneVerification}>
                Confirm
              </button>
              <button className="popup-cancel" onClick={() => setShowPhonePopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SUCCESS POPUP */}
      {successMessage && (
        <div className="popup-success">
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
