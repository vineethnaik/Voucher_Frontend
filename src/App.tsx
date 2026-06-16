/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import AdminPage from './components/AdminPage';
import {
  getStoredSession,
  saveSession,
  clearSession,
  getCurrentUser,
  UserSession,
} from './services/authApi';

function getRoute(): string {
  return window.location.hash || '#/';
}

export default function App() {
  const [route, setRoute] = useState<string>(getRoute);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const session = getStoredSession();
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser(session.token);
        const restored: UserSession = {
          name: user.name,
          email: user.email,
          token: session.token,
          role: user.role ?? session.role ?? 'USER',
        };
        saveSession(restored);
        setUserName(restored.name);
        setUserEmail(restored.email);
        setAuthToken(restored.token);
        setIsAuthenticated(true);
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleAuthSuccess = (session: UserSession) => {
    saveSession(session);
    setUserEmail(session.email);
    setUserName(session.name);
    setAuthToken(session.token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setUserName('');
    setAuthToken('');
    clearSession();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0058be] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Warming Up VoucherPro...</span>
        </div>
      </div>
    );
  }

  if (route === '#/admin') {
    return <AdminPage />;
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard
          userEmail={userEmail}
          userName={userName}
          authToken={authToken}
          onLogout={handleLogout}
        />
      ) : (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
