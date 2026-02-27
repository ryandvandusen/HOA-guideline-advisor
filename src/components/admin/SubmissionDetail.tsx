'use client';

import { useEffect, useState } from 'react';
import { Submission, ChatMessage, ComplianceIssue } from '@/types/submission';
import { ComplianceBadge } from '@/components/compliance/ComplianceBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, User } from 'lucide-react';
import Link from 'next/link';

type Props = { id: string; token: string };

export function SubmissionDetail({ id, token }: Props) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setSubmission)
      .catch(() => setError('Failed to load submission.'))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  if (error || !submission) {
    return <div className="p-6 text-red-600 text-sm">{error || 'Submission not found.'}</div>;
  }

  const messages: ChatMessage[] = JSON.parse(submission.session_messages || '[]');
  const issues: ComplianceIssue[] = JSON.parse(submission.issues_found || '[]');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={15} className="mr-1" /> Back
          </Button>
        </Link>
        <h2 className="text-lg font-semibold text-gray-800">Submission Detail</h2>
        <span className="text-xs text-gray-400 w-full sm:w-auto">{new Date(submission.created_at).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: photo + status */}
        <div className="space-y-4">
          {submission.photo_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/uploads/submissions/${submission.photo_path.split('/').pop()}`}
              alt="Submitted property photo"
              className="w-full rounded-xl border border-gray-200 object-cover max-h-48 sm:max-h-64"
            />
          ) : (
            <div className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
              No photo
            </div>
          )}

          <ComplianceBadge status={submission.compliance_status as 'compliant' | 'needs_attention' | 'violation' | 'inconclusive' | 'pending'} />

          {submission.ai_summary && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{submission.ai_summary}</p>
            </div>
          )}

          {issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issues Found</p>
              {issues.map((issue, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-3 text-sm">
                  <span className="font-medium text-gray-700">{issue.element}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className={`text-xs font-medium ${
                    issue.status === 'violation' ? 'text-red-600' :
                    issue.status === 'needs_attention' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{issue.status.replace('_', ' ')}</span>
                  <p className="text-gray-600 mt-1 text-xs leading-relaxed">{issue.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: chat history */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Chat History</p>
          <div className="space-y-3 bg-white border border-gray-200 rounded-xl p-4 max-h-[300px] sm:max-h-[500px] overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === 'assistant' ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {m.role === 'assistant' ? <Bot size={12} /> : <User size={12} />}
                </div>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'assistant' ? 'bg-brand-50 text-gray-800' : 'bg-gray-800 text-white'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
