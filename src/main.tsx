import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Landing from './pages/Landing';
import Register from './pages/Register';
import ApplyInvite from './pages/ApplyInvite';
import ForgotPassword from './pages/ForgotPassword';
import Sea from './pages/Sea';
import Friends from './pages/Friends';
import Me from './pages/Me';
import Throw from './pages/Throw';
import Pick from './pages/Pick';
import Chat from './pages/Chat';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import RequireAuth from './components/RequireAuth';
import './index.css';

// 首页智能路由：未登录显示 Landing，已登录显示 Sea
function HomeRoute() {
  const { session, loading } = useAuth();
  if (loading) return <RequireAuth><Sea /></RequireAuth>;
  if (!session) return <Landing />;
  return <Sea />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<HomeRoute />} />
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
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
