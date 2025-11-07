import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('loggedInUser');
    navigate('/login');
  }, [navigate]);

  return <p>Logging out...</p>;
};

export default Logout;
