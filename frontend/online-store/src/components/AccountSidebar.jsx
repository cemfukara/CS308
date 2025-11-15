import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AccountSidebar.css';

const AccountSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/auth');
  };

  return (
    <aside className="account-sidebar">
      <h3>My Account</h3>
      <ul>
        <li>
          <NavLink to="/account/profile">Profile Info</NavLink>
        </li>
        <li>
          <NavLink to="/account/addresses">Address Info</NavLink>
        </li>
        <li>
          <NavLink to="/account/orders">My Orders</NavLink>
        </li>
        <li>
          <NavLink to="/account/favorites">Favorites</NavLink>
        </li>
        <li>
          <NavLink to="/account/support">Support</NavLink>
        </li>
        <li>
          <NavLink to="/account/password">Change Password</NavLink>
        </li>
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default AccountSidebar;
