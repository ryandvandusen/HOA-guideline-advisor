'use client';

import { useEffect, useState } from 'react';
import { GuidelineCategory } from '@/types/guideline';

type Props = {
  category: GuidelineCategory | null;
};

export function GuidelineViewer({ category }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    setError(null);
    setHtml(null);

    fetch(`/api/guidelines/${category.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load guideline');
        return res.json();
      })
      .then((data) => setHtml(data.html))
      .catch(() => setError('Failed to load this guideline. Please try again.'))
      .finally(() => setLoading(false));
  }, [category]);

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">Select a guideline from the sidebar to view it.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-gray-500 text-sm">Loading {category.label}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-lg text-sm">{error}</div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{category.label}</h2>
      <div
        className="prose prose-sm prose-gray max-w-none guideline-content"
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
    </div>
  );
}
