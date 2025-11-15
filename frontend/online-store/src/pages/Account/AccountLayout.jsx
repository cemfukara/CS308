import React from 'react';
import { Outlet } from 'react-router-dom';
import AccountSidebar from '../../components/AccountSidebar'; // ✅ FIXED PATH
import './AccountLayout.css';

const AccountLayout = () => {
  return (
    <div className="account-layout">
      <AccountSidebar />
      <div className="account-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AccountLayout;
