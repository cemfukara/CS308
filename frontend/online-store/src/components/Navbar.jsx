import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import useAuthStore from '../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

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
            TechZone
          </Link>
        </div>

        {/* ---------- Center: Search ---------- */}
        <div className="navbar-center">
          <input type="text" placeholder="Search for products..." className="search-input" />
          <button className="search-button">Search</button>
        </div>

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

              <button onClick={handleLogout}>Logout</button>
            </div>
          )}

          {/* 🛒 Cart Icon */}
          <Link to="/cart" className="nav-link" aria-label="Cart">
            <span className="nav-icon">
              <FontAwesomeIcon icon={faCartShopping} />
            </span>
          </Link>
        </div>
      </nav>

      {/* ---------- Category Bar ---------- */}
      <div className="category-bar">
        <ul className="categories">
          <li className="category-item">
            <Link to="/products">All Products</Link>
          </li>
          <li className="category-item">
            <span>Phones</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=smartphones">Smartphones</Link>
              </li>
              <li>
                <Link to="/products?category=cases">Cases & Accessories</Link>
              </li>
              <li>
                <Link to="/products?category=chargers">Chargers</Link>
              </li>
            </ul>
          </li>
          <li className="category-item">
            <span>Computers</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=laptops">Laptops</Link>
              </li>
              <li>
                <Link to="/products?category=desktops">Desktops</Link>
              </li>
              <li>
                <Link to="/products?category=monitors">Monitors</Link>
              </li>
            </ul>
          </li>
          <li className="category-item">
            <span>Accessories</span>
            <ul className="subcategory">
              <li>
                <Link to="/products?category=headphones">Headphones</Link>
              </li>
              <li>
                <Link to="/products?category=keyboards">Keyboards</Link>
              </li>
              <li>
                <Link to="/products?category=mice">Mice</Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
