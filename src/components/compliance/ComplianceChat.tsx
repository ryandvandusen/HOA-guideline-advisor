'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ComplianceBadge } from './ComplianceBadge';
import { IssuesList } from './IssuesList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, RotateCcw, ImagePlus, X } from 'lucide-react';
import { ClaudeAnalysisResponse } from '@/lib/claude';
import { GuidelineCategory } from '@/types/guideline';

type Message = { role: 'user' | 'assistant'; content: string };
type ComplianceStatus = 'compliant' | 'needs_attention' | 'violation' | 'inconclusive' | 'pending';

// Procedural docs that aren't visually checkable — exclude from dropdown
const EXCLUDE_FROM_DROPDOWN = new Set(['intro', 'general', 'review-process', 'arc-charter']);

export function ComplianceChat() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [categories, setCategories] = useState<GuidelineCategory[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [issues, setIssues] = useState<ClaudeAnalysisResponse['issues']>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetch('/api/guidelines')
      .then((r) => r.json())
      .then((data) => {
        const all: GuidelineCategory[] = data.categories || [];
        setCategories(all.filter((c) => !EXCLUDE_FROM_DROPDOWN.has(c.slug)));
      })
      .catch(console.error);
  }, []);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile(file);
      setUploadedPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setUploadedFile(null);
    setUploadedPreview(null);
    setPhotoKey((k) => k + 1);
  }

  function handleReset() {
    setUploadedFile(null);
    setUploadedPreview(null);
    setMessages([]);
    setInput('');
    setSubmissionId(null);
    setComplianceStatus(null);
    setIssues([]);
    setRecommendations([]);
    setError(null);
    setSelectedSlug('');
    setPhotoKey((k) => k + 1);
  }

  async function handleSubmit() {
    const trimmed = input.trim();
    if (isLoading) return;
    if (!submissionId && !uploadedFile && !trimmed) return;
    setError(null);
    setIsLoading(true);

    try {
      if (!submissionId) {
        const form = new FormData();
        if (uploadedFile) form.append('image', uploadedFile);
        form.append('message', trimmed || (uploadedFile ? 'Please analyze this photo of my property for HOA compliance.' : ''));
        if (selectedSlug) form.append('guidelineSlug', selectedSlug);

        const res = await fetch('/api/analyze', { method: 'POST', body: form });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Analysis failed');
        }
        const data = await res.json();

        setSubmissionId(data.submissionId);
        setComplianceStatus(data.analysis.compliance_status);
        setIssues(data.analysis.issues || []);
        setRecommendations(data.analysis.recommendations || []);
        setMessages([
          { role: 'user', content: trimmed || 'Please analyze this photo of my property for HOA compliance.' },
          { role: 'assistant', content: data.analysis.message },
        ]);
      } else {
        if (!trimmed) return;
        setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, message: trimmed }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Chat failed');
        }
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      }

      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit =
    !isLoading &&
    (submissionId
      ? input.trim().length > 0
      : (input.trim().length > 0 || !!uploadedFile) && !!selectedSlug);

  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">

      {/* Guideline category — required before first submission */}
      {!submissionId && categories.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Guideline Category <span className="text-red-400">*</span>
          </label>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Select a guideline category to continue…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* After submission: context label */}
      {submissionId && selectedSlug && (
        <div className="text-xs text-gray-400">
          Analyzed against:{' '}
          <span className="font-medium text-gray-600">
            {categories.find((c) => c.slug === selectedSlug)?.label}
          </span>
        </div>
      )}

      {/* Chat messages */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[380px] flex flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-2">
            <p className="text-sm font-medium text-gray-500">
              {selectedSlug
                ? uploadedFile
                  ? 'Photo ready — add a question or hit Send to analyze.'
                  : 'Ask a question, or attach a photo for a visual check.'
                : 'Select a guideline category above to get started.'}
            </p>
            {selectedSlug && !uploadedFile && (
              <p className="text-xs text-gray-400 max-w-sm">
                e.g. &quot;Can I paint my house olive green?&quot; or &quot;What fence materials are allowed?&quot;
              </p>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="bg-blue-50 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-500 italic">
              Analyzing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
      )}

      {/* Photo thumbnail preview */}
      {uploadedPreview && !submissionId && (
        <div className="flex items-center gap-2">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedPreview}
              alt="Attached photo"
              className="h-16 w-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              onClick={handleRemovePhoto}
              className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:bg-gray-50"
              aria-label="Remove photo"
            >
              <X size={12} className="text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Photo attached</p>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        {!submissionId && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach a photo"
              className={`flex-shrink-0 self-end p-2.5 rounded-lg border transition-colors ${
                uploadedFile
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-300 bg-white text-gray-400 hover:text-gray-600 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <ImagePlus size={18} />
            </button>
            <input
              key={photoKey}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isLoading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            submissionId
              ? 'Ask a follow-up question…'
              : selectedSlug
              ? 'Ask a question, or attach a photo for a visual check…'
              : 'Select a category above, then ask your question…'
          }
          className="resize-none"
          rows={2}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button onClick={handleSubmit} disabled={!canSubmit} className="self-end px-4">
          <Send size={16} />
        </Button>
      </div>

      {submissionId && !isLoading && (
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full text-gray-500">
          <RotateCcw size={14} className="mr-2" />
          Start New Check
        </Button>
      )}

      {/* Results — shown after photo submission */}
      {complianceStatus && complianceStatus !== 'inconclusive' && (
        <ComplianceBadge status={complianceStatus} />
      )}

      {issues.length > 0 && <IssuesList issues={issues} />}

      {recommendations.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Recommendations
          </h3>
          <ul className="space-y-1">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-600 bg-blue-50 rounded px-3 py-2 leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        This is a preliminary AI assessment only. Contact the ARC for official determinations.
      </p>
    </div>
  );
}
