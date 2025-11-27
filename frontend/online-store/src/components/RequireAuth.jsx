import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
