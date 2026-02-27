'use client';

import { useState } from 'react';
import { SubmissionsTable } from './SubmissionsTable';
import { ReportsTable } from './ReportsTable';
import { Button } from '@/components/ui/button';
import { LogOut, Home, FileWarning } from 'lucide-react';

type Tab = 'submissions' | 'reports';

type Props = {
  token: string;
  onLogout: () => void;
};

export function AdminDashboard({ token, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('submissions');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">HOA Admin Portal</h1>
            <p className="text-xs text-gray-400">Murrayhill HOA Board</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-gray-500">
            <LogOut size={15} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-fit mb-6">
          <button
            onClick={() => setTab('submissions')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === 'submissions'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home size={14} className="flex-shrink-0" />
            <span className="sm:hidden">Submissions</span>
            <span className="hidden sm:inline">Homeowner Submissions</span>
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              tab === 'reports'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileWarning size={14} className="flex-shrink-0" />
            <span className="sm:hidden">Reports</span>
            <span className="hidden sm:inline">Violation Reports</span>
          </button>
        </div>

        {tab === 'submissions' ? (
          <SubmissionsTable token={token} onUnauthorized={onLogout} />
        ) : (
          <ReportsTable token={token} onUnauthorized={onLogout} />
        )}
      </div>
    </div>
  );
}
