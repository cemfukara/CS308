import React, { useState, useEffect } from 'react';
import './ChangePassword.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser) setUser(loggedInUser);
  }, []);

  const handleChangePassword = () => {
    if (!user) {
      setError('You must be logged in to change your password.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (currentPassword !== user.password) {
      setError('Current password is incorrect.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // ✅ Update password in both loggedInUser and users list
    const updatedUser = { ...user, password: newPassword };
    localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const idx = users.findIndex(u => u.email === user.email);
    if (idx > -1) users[idx].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));

    // Clear inputs + show success
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    showSuccess('Password updated successfully!');
  };

  const showSuccess = msg => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="password-card">
      <h2 className="password-title">Change Password</h2>

      <label className="password-label">Current Password</label>
      <input
        type="password"
        className="password-input"
        value={currentPassword}
        onChange={e => setCurrentPassword(e.target.value)}
        placeholder="Enter current password"
      />

      <label className="password-label">New Password</label>
      <input
        type="password"
        className="password-input"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        placeholder="Enter new password"
      />

      <label className="password-label">Confirm New Password</label>
      <input
        type="password"
        className="password-input"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
      />

      {error && <p className="password-error">{error}</p>}

      <button className="btn btn-save" onClick={handleChangePassword}>
        Save New Password
      </button>

      {/* ✅ Floating success popup */}
      {successMessage && (
        <div className="popup-success">
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;
