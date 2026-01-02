import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

export default function RequireSupportAgent({ children }) {
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);

  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== 'support agent') {
    return <Navigate to="/" replace />;
  }

  return children;
}
