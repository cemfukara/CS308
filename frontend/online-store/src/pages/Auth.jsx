import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './Auth.css';
import { api } from '../lib/api';
import useAuthStore from '../store/authStore';

const Auth = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [isLogin, setIsLogin] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    taxId: '',
    password: '',
    confirmPassword: '',
  });

  // Errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -----------------------------
  // REGISTER VALIDATION
  // -----------------------------
  const validateRegister = () => {
    const errs = {};

    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      errs.lastName = 'Last name is required.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email.';
    }

    if (!/^\d{10,15}$/.test(formData.phone.trim())) {
      errs.phone = 'Phone must be 10–15 digits.';
    }

    if (!/^\d{11}$/.test(formData.taxId.trim())) {
      errs.taxId = 'Tax ID must be 11 digits.';
    }

    if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // -----------------------------
  // REGISTER → POST /users/register
  // -----------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!validateRegister()) return;

    try {
      await api.post('/users/register', {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        tax_id: formData.taxId.trim(),
        password: formData.password,
      });

      toast.success('🎉 Account created successfully! You can now log in.');

      setIsLogin(true);
      setFieldErrors({});
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    }
  };

  // -----------------------------
  // LOGIN → POST /users/login
  // -----------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setLoginError('');

    try {
      await api.post('/users/login', {
        email: formData.email,
        password: formData.password,
      });

      try {
        const profile = await api.get('/users/profile');
        setUser(profile);
      } catch (e) {
        console.error('Profile fetch after login failed', e);
      }

      toast.success('✅ Welcome back!');
      navigate('/');
    } catch (err) {
      setLoginError('Invalid email or password.');
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
              setFieldErrors({});
              setLoginError('');
            }}
          >
            Log In
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false);
              setFieldErrors({});
              setLoginError('');
            }}
          >
            Register
          </button>
        </div>

        {/* LOGIN FORM – same layout as before */}
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

            <p
              className="forgot-password-link"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </p>

            {loginError && <p className="error">{loginError}</p>}

            <button type="submit">Log In</button>
          </form>
        ) : (
          // REGISTER FORM – same layout, but each field has aligned inline error
          <form onSubmit={handleRegister} className="auth-form">
            <h2>Create Account</h2>

            <div className="field">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              {fieldErrors.firstName && (
                <p className="field-error">{fieldErrors.firstName}</p>
              )}
            </div>

            <div className="field">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
              {fieldErrors.lastName && (
                <p className="field-error">{fieldErrors.lastName}</p>
              )}
            </div>

            <div className="field">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <p className="field-error">{fieldErrors.email}</p>
              )}
            </div>

            <div className="field">
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
              {fieldErrors.phone && (
                <p className="field-error">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="field">
              <input
                type="text"
                name="taxId"
                placeholder="Tax ID"
                value={formData.taxId}
                onChange={handleChange}
              />
              {fieldErrors.taxId && (
                <p className="field-error">{fieldErrors.taxId}</p>
              )}
            </div>

            <div className="field">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {fieldErrors.password && (
                <p className="field-error">{fieldErrors.password}</p>
              )}
            </div>

            <div className="field">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {fieldErrors.confirmPassword && (
                <p className="field-error">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button type="submit">Register</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;