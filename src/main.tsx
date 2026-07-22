import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import RequireAuth from './components/RequireAuth';
import BgVideo from './components/BgVideo';
import './index.css';

// 主 tab 直接导入：海 / 瓶友 / 我 —— 用户必切，去掉 lazy 避免全屏 spinner
import Sea           from './pages/Sea';
import Friends       from './pages/Friends';
import Me            from './pages/Me';

// 次要页面保留 code splitting
const Landing        = lazy(() => import('./pages/Landing'));
const Register       = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Throw          = lazy(() => import('./pages/Throw'));
const Pick           = lazy(() => import('./pages/Pick'));
const Chat           = lazy(() => import('./pages/Chat'));
const BottleDetail   = lazy(() => import('./pages/BottleDetail'));
const Download       = lazy(() => import('./pages/Download'));

// 预加载次要页面的 chunk（空闲时触发）
function prefetchChunks() {
  void import('./pages/Landing');
  void import('./pages/Register');
  void import('./pages/ForgotPassword');
  void import('./pages/Throw');
  void import('./pages/Pick');
  void import('./pages/Chat');
  void import('./pages/BottleDetail');
}

// 首页智能路由：未登录显示 Landing，已登录显示 Sea
function HomeRoute() {
  const { session, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!session) return <Landing />;
  return <Sea />;
}

function App() {
  // 页面稳定后预加载其余 chunk
  React.useEffect(() => {
    const id = requestIdleCallback ? requestIdleCallback(prefetchChunks) : setTimeout(prefetchChunks, 2000);
    return () => { cancelIdleCallback?.(id); clearTimeout(id); };
  }, []);

  return (
    <>
      {/* 背景视频：单例，永远不卸载 */}
      <BgVideo />

      {/* 路由内容 */}
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="register" element={<Register />} />
          <Route path="download" element={<Download />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="sea" element={<RequireAuth><Sea /></RequireAuth>} />
          <Route path="friends" element={<RequireAuth><Friends /></RequireAuth>} />
          <Route path="me" element={<RequireAuth><Me /></RequireAuth>} />
          <Route path="throw" element={<RequireAuth><Throw /></RequireAuth>} />
          <Route path="pick" element={<RequireAuth><Pick /></RequireAuth>} />
          <Route path="chat/:conversationId" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="bottle/:id" element={<RequireAuth><BottleDetail /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

// 轻量 CSS 加载 spinner（仅用于次要页面首次加载）
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
