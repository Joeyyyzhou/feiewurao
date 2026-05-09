import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
        加载中…
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;
  return children;
}
