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

  // Load guideline categories for the dropdown
  // Exclude procedural/non-visual docs that aren't checkable from a photo
  const EXCLUDE_FROM_DROPDOWN = new Set(['intro', 'general', 'review-process', 'arc-charter']);

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
      // Clear/reset
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
  }

  async function handleSubmit() {
    const trimmed = input.trim();
    if (isLoading) return;
    if (!submissionId && !uploadedFile && !trimmed) return;
    setError(null);
    setIsLoading(true);

    try {
      if (!submissionId) {
        // First message: send image + optional text + optional guideline context
        const form = new FormData();
        form.append('image', uploadedFile!);
        form.append('message', trimmed || 'Please analyze this photo of my property for HOA compliance.');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: photo + results */}
      <div className="lg:col-span-1 space-y-4">
        <PhotoUploader
          onFileSelect={handleFileSelect}
          preview={uploadedPreview}
          disabled={!!submissionId}
        />

        {/* Guideline category selector — only shown before first analysis */}
        {!submissionId && categories.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Relevant Guideline <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <Select value={selectedSlug} onValueChange={setSelectedSlug}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a guideline category…" />
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
                Full guideline text will be included for a more precise analysis.
              </p>
            )}
          </div>
        )}

        {/* Show selected guideline label after submission */}
        {submissionId && selectedSlug && (
          <div className="text-xs text-gray-400">
            Analyzed against: <span className="font-medium text-gray-600">{categories.find(c => c.slug === selectedSlug)?.label}</span>
          </div>
        )}

        {complianceStatus && (
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

      {/* Right column: chat */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[420px] flex flex-col gap-3 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
              <p className="text-sm font-medium text-gray-500">
                {uploadedFile ? 'Ready — hit Send to analyze your photo.' : 'Ask a question or upload a photo to get started.'}
              </p>
              <p className="text-xs mt-1 max-w-xs">
                {uploadedFile
                  ? 'You can also type a specific question before sending.'
                  : 'You can ask about HOA guidelines directly, or upload a photo of your property for a visual compliance check.'}
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
        <p className="text-xs text-gray-400 text-center">
          This is a preliminary AI assessment only. Contact the ARC for official determinations.
        </p>
      </div>
    </div>
  );
}
