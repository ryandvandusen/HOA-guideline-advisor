'use client';

import { useState, useEffect } from 'react';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('hoa_admin_token');
    if (stored) setToken(stored);
    setHydrated(true);
  }, []);

  function handleLogin(jwt: string) {
    localStorage.setItem('hoa_admin_token', jwt);
    setToken(jwt);
  }

  function handleLogout() {
    localStorage.removeItem('hoa_admin_token');
    setToken(null);
  }

  // Avoid SSR mismatch
  if (!hydrated) return null;

  if (!token) {
    return <AdminLoginForm onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
