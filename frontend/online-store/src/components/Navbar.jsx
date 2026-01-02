import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore'; //
import Dropdown from '@/components/Dropdown';

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  // Get cart from store with safety check
  const cart = useCartStore(state => state.cart);

  // Calculate total items safely (prevents crash if cart is null/undefined/not array)
  const cartItemCount = Array.isArray(cart)
    ? cart.reduce((acc, item) => acc + (item.quantity || 0), 0)
    : 0;

  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        const res = await fetch('/api/categories', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();

        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setCategories([]);
        console.error(e);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map(c => ({
      label: c.name,
      value: c.name,
    })),
  ];

  // ✅ Keep navbar search in sync with URL ?search=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentSearch = params.get('search') || '';
    setSearchQuery(currentSearch);
  }, [location.search]);

  const handleSearchChange = e => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    const trimmed = searchQuery.trim();

    const params = new URLSearchParams(location.search);
    if (trimmed) {
      params.set('search', trimmed);
    } else {
      params.delete('search');
    }

    navigate(`/products?${params.toString()}`);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Profile icon click
  const handleProfileClick = () => {
    if (user) {
      // Logged in → open/close dropdown
      setShowDropdown(prev => !prev);
    } else {
      // Not logged in → go to auth page
      navigate('/auth');
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    logout(); // clears cookie + authStore.user
    setShowDropdown(false);
    navigate('/auth');
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar">
        {/* ---------- Left: Logo ---------- */}
        <div className="navbar-left">
          <Link to="/" className="logo">
            <svg
              width="220"
              height="48"
              viewBox="0 0 220 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#grad)" />

              <path
                d="M14 16H24C26 16 28 14 30 14H34"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="36" cy="14" r="2.6" fill="white" />

              <path
                d="M14 24H26C28 24 30 26 32 26H36"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="38" cy="26" r="2.6" fill="white" />

              <path d="M14 32H22" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="24" cy="32" r="2.6" fill="white" />

              <text
                x="64"
                y="32"
                fontSize="26"
                fontWeight="700"
                fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                fill="#111"
              >
                TechZone
              </text>

              <defs>
                <linearGradient
                  id="grad"
                  x1="0"
                  y1="0"
                  x2="48"
                  y2="48"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
          </Link>
        </div>

        {/* ---------- Center: Search ---------- */}
        <form className="navbar-center" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search for products..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {/* ---------- Right: Profile + Cart ---------- */}
        <div className="navbar-right" ref={dropdownRef}>
          {/* 👤 Profile Icon */}
          <span className="nav-link" aria-label="Profile" onClick={handleProfileClick}>
            <span className="nav-icon">
              <FontAwesomeIcon icon={faUser} />
            </span>
          </span>

          {/* ✅ Dropdown (only when logged in) */}
          {user && showDropdown && (
            <div className="profile-dropdown">
              <Link to="/account/profile" onClick={() => setShowDropdown(false)}>
                Profile Info
              </Link>
              <Link to="/account/orders" onClick={() => setShowDropdown(false)}>
                Orders
              </Link>
              <Link to="/account/addresses" onClick={() => setShowDropdown(false)}>
                Addresses
              </Link>
              <Link to="/account/favorites" onClick={() => setShowDropdown(false)}>
                Favorites
              </Link>
              <Link to="/account/support" onClick={() => setShowDropdown(false)}>
                Support
              </Link>

              {/* 🛠 Admin link only for PM / dev */}
              {user.role === 'product manager' ||
              user.role === 'dev' ||
              user.role === 'sales manager' ? (
                <Link to="/admin" onClick={() => setShowDropdown(false)}>
                  Admin Panel
                </Link>
              ) : null}

              {user.role === 'support agent' && <Link to="/admin/support/queue">Support</Link>}

              <button onClick={handleLogout}>Logout</button>
            </div>
          )}

          {/* 🛒 Cart Icon */}
          <Link to="/cart" className="nav-link" aria-label="Cart">
            <span className="nav-icon cart-icon-container">
              <FontAwesomeIcon icon={faCartShopping} />
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </span>
          </Link>
        </div>
      </nav>

      <div className="category-bar">
        <div className="category-filter-row">
          {/* ✅ All Products button (LEFT) */}
          <button
            className="all-products-btn"
            onClick={() => navigate('/products')}
            style={{ marginLeft: 'auto', marginTop: '22px' }}
          >
            All Products
          </button>

          {/* Categories dropdown */}
          <div className="category-filter">
            <Dropdown
              label="Categories"
              value={new URLSearchParams(location.search).get('category') || ''}
              options={categoryOptions}
              onChange={value => {
                const params = new URLSearchParams(location.search);

                if (value) params.set('category', value);
                else params.delete('category');

                navigate(`/products?${params.toString()}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
