import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  // While we don't know yet
  if (loading) return null; // or a spinner if you want

  // Not logged in → go to /auth
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Logged in but not PM or dev → kick to home
  if (user.role !== 'product manager' && user.role !== 'dev' && user.role !== 'sales manager') {
    return <Navigate to="/" replace />;
  }

  return children;
}
