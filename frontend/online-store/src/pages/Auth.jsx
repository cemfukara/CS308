import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Auth.css';
import { api } from '../lib/api'; // ✅ use your API helper
import useAuthStore from '../store/authStore';

const Auth = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  const [mockEmailCode, setMockEmailCode] = useState('');
  const [mockPhoneCode, setMockPhoneCode] = useState('');

  const [error, setError] = useState('');

  // Handle input
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') setEmailVerified(false);
    if (name === 'phone') setPhoneVerified(false);
  };

  // Validation helpers
  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = phone => /^\d{10,15}$/.test(phone.trim());

  // Email verification flow (mock)
  const handleEmailVerification = () => {
    if (!isValidEmail(formData.email)) {
      setError('Enter a valid email before verification.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockEmailCode(code);
    setShowEmailVerification(true);
    toast('📧 Mock code sent to your email.');
  };

  // Phone verification flow (mock)
  const handlePhoneVerification = () => {
    if (!isValidPhone(formData.phone)) {
      setError('Enter a valid phone number before verification.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockPhoneCode(code);
    setShowPhoneVerification(true);
    toast('📱 Mock code sent to your phone.');
  };

  // Confirm verification codes
  const confirmEmailCode = () => {
    if (emailCode.trim() === mockEmailCode) {
      setEmailVerified(true);
      setShowEmailVerification(false);
      toast.success('✅ Email verified successfully!');
    } else {
      toast.error('❌ Invalid code. Try again.');
    }
  };

  const confirmPhoneCode = () => {
    if (phoneCode.trim() === mockPhoneCode) {
      setPhoneVerified(true);
      setShowPhoneVerification(false);
      toast.success('✅ Phone verified successfully!');
    } else {
      toast.error('❌ Invalid code. Try again.');
    }
  };

  // -----------------------------
  // REGISTER → backend /users/register
  // -----------------------------
  const handleRegister = async e => {
    e.preventDefault();
    setError('');

    if (!emailVerified || !phoneVerified) {
      setError('Please verify your email and phone first.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // Backend expects full_name, email, password
      await api.post('/users/register', {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      toast.success('🎉 Account created successfully! You can now log in.');

      // Switch to login tab and keep email prefilled
      setIsLogin(true);
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setError('');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  // -----------------------------
  // LOGIN → backend /users/login
  // -----------------------------
  const handleLogin = async e => {
    e.preventDefault();
    setError('');

    try {
      // Backend login: sets JWT cookie + returns message
      await api.post('/users/login', {
        email: formData.email,
        password: formData.password,
      });

      try {
        const profile = await api.get('/users/profile');
        setUser(profile);
      } catch (e) {
        // if profile fails, we still at least logged in, but admin guard might not work
        console.error('Profile fetch after login failed', e);
      }

      toast.success('✅ Welcome back!');
      navigate('/'); // redirect to homepage
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Log In
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Register
          </button>
        </div>

        {/* LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Welcome Back</h2>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <p className="forgot-password-link" onClick={() => navigate('/forgot-password')}>
              Forgot your password?
            </p>

            {error && <p className="error">{error}</p>}
            <button type="submit">Log In</button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="auth-form">
            <h2>Create Account</h2>

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <div className="input-with-btn">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="verify-btn"
                onClick={handleEmailVerification}
                disabled={emailVerified}
              >
                {emailVerified ? 'Verified' : 'Verify'}
              </button>
            </div>

            <div className="input-with-btn">
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="verify-btn"
                onClick={handlePhoneVerification}
                disabled={phoneVerified}
              >
                {phoneVerified ? 'Verified' : 'Verify'}
              </button>
            </div>

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            {error && <p className="error">{error}</p>}
            <button type="submit">Register</button>
          </form>
        )}
      </div>

      {/* EMAIL VERIFICATION POPUP */}
      {showEmailVerification && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Email Verification</h3>
            <p>Enter the 6-digit code sent to your email.</p>
            <p style={{ fontSize: '13px', color: '#777' }}>
              (Mock code: <strong>{mockEmailCode}</strong>)
            </p>
            <input
              type="text"
              value={emailCode}
              onChange={e => setEmailCode(e.target.value)}
              placeholder="Enter code"
              maxLength="6"
            />
            <div className="popup-buttons">
              <button onClick={confirmEmailCode}>Confirm</button>
              <button onClick={() => setShowEmailVerification(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* PHONE VERIFICATION POPUP */}
      {showPhoneVerification && (
        <div className="popup-overlay">
          <div className="popup">
            <h3>Phone Verification</h3>
            <p>Enter the 6-digit code sent to your phone.</p>
            <p style={{ fontSize: '13px', color: '#777' }}>
              (Mock code: <strong>{mockPhoneCode}</strong>)
            </p>
            <input
              type="text"
              value={phoneCode}
              onChange={e => setPhoneCode(e.target.value)}
              placeholder="Enter code"
              maxLength="6"
            />
            <div className="popup-buttons">
              <button onClick={confirmPhoneCode}>Confirm</button>
              <button onClick={() => setShowPhoneVerification(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
