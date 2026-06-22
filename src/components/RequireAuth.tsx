import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,20,35,0.82)',
        backdropFilter: 'blur(12px)',
        color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '2px solid rgba(255,255,255,0.15)',
          borderTopColor: 'rgba(255,255,255,0.7)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          marginBottom: 16,
        }} />
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: 13,
          letterSpacing: 4, opacity: 0.6,
        }}>
          drifting…
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/register" replace />;
  return children;
}
