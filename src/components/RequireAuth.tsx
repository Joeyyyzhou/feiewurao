import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import BgVideo from './BgVideo';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <>
        <BgVideo />
        <div style={{
          position: 'relative', zIndex: 1,
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          letterSpacing: 4,
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontSize: 14,
            color: 'rgba(255,255,255,0.62)',
            letterSpacing: 6,
            textShadow: '0 1px 12px rgba(0,0,0,0.5)',
            marginBottom: 14,
            textTransform: 'lowercase',
          }}>
            drifting back to the sea
          </div>
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
          }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 6, height: 6, borderRadius: 999,
                  background: 'rgba(255, 252, 240, 0.85)',
                  boxShadow: '0 0 8px rgba(255, 240, 200, 0.6)',
                  animation: `softPulse 1.6s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }
  if (!session) return <Navigate to="/register" replace />;
  return children;
}
