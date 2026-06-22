import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import RequireAuth from './components/RequireAuth';
import BgVideo from './components/BgVideo';
import './index.css';

// 路由级 code splitting：每个 tab 独立 chunk
const Landing       = React.lazy(() => import('./pages/Landing'));
const Register      = React.lazy(() => import('./pages/Register'));
const ApplyInvite  = React.lazy(() => import('./pages/ApplyInvite'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Sea           = React.lazy(() => import('./pages/Sea'));
const Friends       = React.lazy(() => import('./pages/Friends'));
const Me            = React.lazy(() => import('./pages/Me'));
const Throw         = React.lazy(() => import('./pages/Throw'));
const Pick          = React.lazy(() => import('./pages/Pick'));
const Chat          = React.lazy(() => import('./pages/Chat'));

// 首页智能路由：未登录显示 Landing，已登录显示 Sea
function HomeRoute() {
  const { session, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!session) return <Landing />;
  return <Sea />;
}

function App() {
  return (
    <>
      {/* 背景视频：单例，永远不卸载 */}
      <BgVideo />

      {/* 路由内容（带 code splitting） */}
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="register" element={<Register />} />
          <Route path="apply" element={<ApplyInvite />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="sea" element={<RequireAuth><Sea /></RequireAuth>} />
          <Route path="friends" element={<RequireAuth><Friends /></RequireAuth>} />
          <Route path="me" element={<RequireAuth><Me /></RequireAuth>} />
          <Route path="throw" element={<RequireAuth><Throw /></RequireAuth>} />
          <Route path="pick" element={<RequireAuth><Pick /></RequireAuth>} />
          <Route path="chat/:conversationId" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

// 轻量 CSS 加载 spinner（不重新加载视频）
function PageSpinner() {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
