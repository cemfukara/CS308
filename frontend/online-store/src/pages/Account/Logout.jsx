import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear login data only — not the entire state immediately
    localStorage.removeItem('loggedInUser');

    // Small delay gives React time to update Navbar before redirect
    setTimeout(() => {
      navigate('/auth');
    }, 100);
  }, [navigate]);

  return null;
};

export default Logout;
