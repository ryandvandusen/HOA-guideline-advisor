'use client';

import { useEffect, useState } from 'react';
import { SubmissionDetail } from '@/components/admin/SubmissionDetail';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { use } from 'react';

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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

  if (!hydrated) return null;

  if (!token) {
    return <AdminLoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <SubmissionDetail id={id} token={token} />
    </div>
  );
}
