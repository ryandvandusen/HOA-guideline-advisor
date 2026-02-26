'use client';

import { useEffect, useState } from 'react';
import { ViolationReport } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  investigating: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

type Props = { token: string; onUnauthorized: () => void };

export function ReportsTable({ token, onUnauthorized }: Props) {
  const [reports, setReports] = useState<ViolationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      setReports(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function updateReport(id: string, status: string, admin_notes?: string) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, admin_notes }),
      });
      if (res.status === 401) { onUnauthorized(); return; }
      const updated = await res.json();
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-400 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Loading reports...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No violation reports submitted yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</span>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw size={13} className="mr-1" /> Refresh
        </Button>
      </div>
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              onClick={() => setExpanded(expanded === report.id ? null : report.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
                <span className="text-sm font-medium text-gray-700 truncate">{report.property_address}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              {expanded === report.id ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {expanded === report.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
                </div>

                {report.reporter_notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Reporter Notes</p>
                    <p className="text-sm text-gray-600">{report.reporter_notes}</p>
                  </div>
                )}

                {report.photo_path && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Photo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/reports/${report.photo_path.split('/').pop()}`}
                      alt="Report photo"
                      className="rounded-lg max-h-48 object-cover border border-gray-200"
                    />
                  </div>
                )}

                <div className="flex gap-3 items-start pt-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <Select
                      value={report.status}
                      onValueChange={(val) => updateReport(report.id, val, editNotes[report.id] ?? report.admin_notes ?? undefined)}
                    >
                      <SelectTrigger className="w-36 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                    <Textarea
                      rows={2}
                      className="text-sm resize-none"
                      placeholder="Internal notes (not visible to reporter)..."
                      defaultValue={report.admin_notes ?? ''}
                      onChange={(e) => setEditNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  disabled={saving === report.id}
                  onClick={() => updateReport(report.id, report.status, editNotes[report.id] ?? report.admin_notes ?? undefined)}
                >
                  {saving === report.id ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
