'use client';

import { useState, useEffect } from 'react';
import { GuidelineCategory } from '@/types/guideline';
import { GuidelineViewer } from './GuidelineViewer';
import { Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function GuidelinesPanel() {
  const [categories, setCategories] = useState<GuidelineCategory[]>([]);
  const [selected, setSelected] = useState<GuidelineCategory | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/guidelines')
      .then((r) => r.json())
      .then((data: { categories: GuidelineCategory[] }) => {
        setCategories(data.categories);
        if (data.categories.length > 0) setSelected(data.categories[0]);
      })
      .catch(console.error);
  }, []);

  const filtered = categories.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
      {/* Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guidelines..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {filtered.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelected(cat)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                selected?.slug === cat.slug
                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText size={13} className="flex-shrink-0 opacity-60" />
              <span className="leading-tight">{cat.label}</span>
            </button>
          ))}

        </nav>
      </div>

      {/* Content */}
      <div className="lg:col-span-3 overflow-auto">
        <GuidelineViewer category={selected} />
      </div>
    </div>
  );
}
