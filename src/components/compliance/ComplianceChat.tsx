'use client';

import { useState, useRef, useEffect } from 'react';
import { PhotoUploader } from './PhotoUploader';
import { ChatMessage } from './ChatMessage';
import { ComplianceBadge } from './ComplianceBadge';
import { IssuesList } from './IssuesList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, RotateCcw } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  function handleFileSelect(file: File, preview: string) {
    if (!file.name) {
      setUploadedFile(null);
      setUploadedPreview(null);
      return;
    }
    setUploadedFile(file);
    setUploadedPreview(preview);
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
  }

  async function handleSubmit() {
    const trimmed = input.trim();
    if (isLoading) return;
    if (!submissionId && !uploadedFile && !trimmed) return;
    setError(null);
    setIsLoading(true);

    try {
      if (!submissionId) {
        // First message: send image (if any) + text + optional guideline context
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
          {
            role: 'user',
            content: trimmed || 'Please analyze this photo of my property for HOA compliance.',
          },
          { role: 'assistant', content: data.analysis.message },
        ]);
      } else {
        // Follow-up: text only
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
    (submissionId ? input.trim().length > 0 : input.trim().length > 0 || !!uploadedFile);

  const showIntro = !submissionId && messages.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: photo upload + results */}
      <div className="lg:col-span-1 space-y-4">
        {!submissionId && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Upload a Photo <span className="font-normal text-gray-400 normal-case">(optional)</span>
            </p>
            <p className="text-xs text-gray-400 mb-2">
              For a visual compliance check of your property's exterior.
            </p>
          </div>
        )}

        <PhotoUploader
          onFileSelect={handleFileSelect}
          preview={uploadedPreview}
          disabled={!!submissionId}
        />

        {/* After submission: selected guideline context label */}
        {submissionId && selectedSlug && (
          <div className="text-xs text-gray-400">
            Analyzed against:{' '}
            <span className="font-medium text-gray-600">
              {categories.find((c) => c.slug === selectedSlug)?.label}
            </span>
          </div>
        )}

        {/* Compliance badge — only for photo analyses (not text-only) */}
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

        {submissionId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full text-gray-500"
          >
            <RotateCcw size={14} className="mr-2" />
            Start New Check
          </Button>
        )}
      </div>

      {/* Right column: intro cards + chat + controls */}
      <div className="lg:col-span-2 flex flex-col gap-3">

        {/* Two-path intro — only shown before any interaction */}
        {showIntro && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Planning a project?</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Ask about HOA rules before you start — no photo needed. Just type your question below.
              </p>
              <p className="text-xs text-blue-400 mt-2 italic">
                e.g. "Can I paint my house olive green?" or "What fence materials are allowed?"
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-1">Checking your property?</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload a photo of your home's exterior from the left panel for a visual compliance check.
              </p>
              <p className="text-xs text-gray-400 mt-2 italic">
                e.g. fencing, paint color, landscaping, roofing, signs
              </p>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[340px] flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center py-8">
              <p className="text-sm text-gray-400">
                {uploadedFile
                  ? 'Photo ready — add a question or hit Send to analyze.'
                  : 'Your conversation will appear here.'}
              </p>
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

        {/* Guideline category selector — in right column, visible before submission */}
        {!submissionId && categories.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Guideline Category{' '}
              <span className="text-gray-400 font-normal normal-case">
                (optional — for more precise answers)
              </span>
            </label>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a category to focus the analysis…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSlug && (
              <p className="text-xs text-blue-600 mt-1">
                Full guideline text will be included for a more precise response.
              </p>
            )}
          </div>
        )}

        {/* Chat input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              submissionId
                ? 'Ask a follow-up question…'
                : uploadedFile
                ? 'Optional: describe your property or ask a specific question…'
                : 'Ask a question about HOA guidelines, or upload a photo for a compliance check…'
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
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="self-end px-4"
          >
            <Send size={16} />
          </Button>
        </div>
        {submissionId && !isLoading && (
          <div className="flex items-center justify-center gap-1.5">
            <RotateCcw size={11} className="text-gray-400" />
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              Start a new conversation
            </button>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-xs text-gray-400">Change guideline category</span>
          </div>
        )}
        <p className="text-xs text-gray-400 text-center">
          This is a preliminary AI assessment only. Contact the ARC for official determinations.
        </p>
      </div>
    </div>
  );
}
