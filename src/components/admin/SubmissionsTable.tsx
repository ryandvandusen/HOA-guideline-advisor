'use client';

import { useEffect, useState } from 'react';
import { Submission } from '@/types/submission';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  compliant: 'bg-green-100 text-green-800',
  needs_attention: 'bg-yellow-100 text-yellow-800',
  violation: 'bg-red-100 text-red-800',
  inconclusive: 'bg-gray-100 text-gray-700',
  pending: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  compliant: 'Compliant',
  needs_attention: 'Needs Attention',
  violation: 'Violation',
  inconclusive: 'Inconclusive',
  pending: 'Pending',
};

type Props = { token: string; onUnauthorized: () => void };

export function SubmissionsTable({ token, onUnauthorized }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Loading submissions...
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No homeowner submissions yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
      </div>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-2">
        {submissions.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.compliance_status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[s.compliance_status] || s.compliance_status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{s.ai_summary || '—'}</p>
              </div>
              {s.photo_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/uploads/submissions/${s.photo_path.split('/').pop()}`}
                  alt="Submission"
                  className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                />
              )}
            </div>
            <div className="mt-2">
              <Link href={`/admin/submissions/${s.id}`}>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  <Eye size={13} className="mr-1" /> View Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Summary</th>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.compliance_status] || STATUS_COLORS.pending}`}>
                    {STATUS_LABELS[s.compliance_status] || s.compliance_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs">
                  <span className="line-clamp-2">{s.ai_summary || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  {s.photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/uploads/submissions/${s.photo_path.split('/').pop()}`}
                      alt="Submission"
                      className="w-12 h-12 object-cover rounded border border-gray-200"
                    />
                  ) : (
                    <span className="text-gray-300 text-xs">No photo</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/submissions/${s.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye size={14} className="mr-1" /> View
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
