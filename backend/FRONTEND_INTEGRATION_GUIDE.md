# Frontend Integration Example

This file provides example code snippets for integrating the profile update and account deletion features in your React frontend.

## Profile Update Component Example

```javascript
// ProfileUpdateForm.jsx
import { useState } from 'react';

function ProfileUpdateForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    tax_id: '',
    password: ''
  });
  
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Step 1: Request profile update
  const handleSaveInformation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Filter out empty fields
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== '')
      );

      const response = await fetch('http://localhost:5000/api/users/profile/request-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message} (sent to ${data.email})`);
        setShowCodeInput(true);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm with verification code
  const handleConfirmUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/users/profile/confirm-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setShowCodeInput(false);
        setVerificationCode('');
        // Reset form or redirect as needed
        setTimeout(() => {
          window.location.reload(); // Reload to show updated profile
        }, 1500);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-update-form">
      <h2>Update Profile Information</h2>
      
      {message && <div className="message">{message}</div>}

      {!showCodeInput ? (
        <form onSubmit={handleSaveInformation}>
          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter new first name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter new last name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter new email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tax_id">Tax ID</label>
            <input
              type="text"
              id="tax_id"
              name="tax_id"
              value={formData.tax_id}
              onChange={handleChange}
              placeholder="Enter tax ID"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (optional)"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Save Information'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirmUpdate}>
          <h3>Email Verification</h3>
          <p>A 6-digit verification code has been sent to your email.</p>
          <p>Please check your inbox and enter the code below.</p>
          
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              pattern="[0-9]{6}"
              required
            />
          </div>

          <button type="submit" disabled={loading || verificationCode.length !== 6}>
            {loading ? 'Verifying...' : 'Confirm Update'}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              setShowCodeInput(false);
              setVerificationCode('');
            }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

export default ProfileUpdateForm;
```

## Account Deletion Component Example

```javascript
// AccountDeletionButton.jsx
import { useState } from 'react';

function AccountDeletionButton() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1: Request account deletion
  const handleRequestDeletion = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/users/account/request-deletion', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`⚠️ ${data.message}`);
        setShowConfirmModal(false);
        setShowCodeInput(true);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm account deletion
  const handleConfirmDeletion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/users/account/confirm-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-deletion">
      <button 
        className="danger-button"
        onClick={() => setShowConfirmModal(true)}
      >
        Cancel Account
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>⚠️ Delete Account?</h2>
            <p>
              <strong>WARNING:</strong> This action is IRREVERSIBLE!
            </p>
            <p>
              All your data including orders, reviews, and personal information 
              will be permanently deleted from our system.
            </p>
            <p>Are you absolutely sure you want to continue?</p>
            
            <div className="modal-actions">
              <button 
                className="danger-button"
                onClick={handleRequestDeletion}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Yes, Delete My Account'}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Code Input */}
      {showCodeInput && (
        <div className="modal">
          <div className="modal-content">
            <h2>Account Deletion Verification</h2>
            <p>
              A verification code has been sent to your email. 
              Enter the code below to permanently delete your account.
            </p>
            
            {message && <div className="message">{message}</div>}

            <form onSubmit={handleConfirmDeletion}>
              <div className="form-group">
                <label htmlFor="deletion-code">Verification Code</label>
                <input
                  type="text"
                  id="deletion-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="submit"
                  className="danger-button"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Deleting...' : 'Confirm Deletion'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowCodeInput(false);
                    setVerificationCode('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && !showCodeInput && !showConfirmModal && (
        <div className="message">{message}</div>
      )}
    </div>
  );
}

export default AccountDeletionButton;
```

## Example CSS Styling

```css
/* styles.css */

.profile-update-form,
.account-deletion {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button[type="submit"] {
  background-color: #4CAF50;
  color: white;
}

button[type="submit"]:hover {
  background-color: #45a049;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.danger-button {
  background-color: #f44336;
  color: white;
}

.danger-button:hover {
  background-color: #da190b;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.message {
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background-color: #f0f0f0;
}
```

## Usage in Your Profile Page

```javascript
// ProfilePage.jsx
import ProfileUpdateForm from './ProfileUpdateForm';
import AccountDeletionButton from './AccountDeletionButton';

function ProfilePage() {
  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      
      <ProfileUpdateForm />
      
      <hr />
      
      <div className="danger-zone">
        <h2>Danger Zone</h2>
        <p>Permanently delete your account and all associated data.</p>
        <AccountDeletionButton />
      </div>
    </div>
  );
}

export default ProfilePage;
```

## Important Notes

1. **Credentials**: Always use `credentials: 'include'` in fetch requests to send cookies
2. **Base URL**: Replace `http://localhost:5000` with your actual API base URL
3. **Validation**: Add client-side validation before sending requests
4. **Error Handling**: Implement proper error handling and user feedback
5. **Loading States**: Show loading indicators during API calls
6. **Security**: Never store verification codes in localStorage
7. **UX**: Consider adding a countdown timer for code expiration (15 minutes)

## Advanced Features to Consider

- Auto-fill current user data in the form
- Show password strength indicator
- Add email format validation
- Implement rate limiting on the frontend
- Add "Resend Code" functionality
- Show countdown timer for code expiration
- Add confirmation checkbox for account deletion
- Implement proper routing after successful operations
