import fs from 'fs';
import path from 'path';
import { GuidelineCategory } from '@/types/guideline';

export const PDF_FILENAME = '2023-MOA-Design-Guidelines.pdf';

// Pre-extracted static text files live in src/data/guidelines/{slug}.txt
// Regenerate them by running: node scripts/extract-guidelines.cjs
const DATA_DIR = path.join(process.cwd(), 'src/data/guidelines');

export const GUIDELINE_CATEGORIES: GuidelineCategory[] = [
  { slug: 'general', label: 'General Conditions' },
  { slug: 'review-process', label: 'Review Process & Fees' },
  { slug: 'paint-siding', label: 'Paint, Siding, Brick & Stone' },
  { slug: 'fencing', label: 'Fencing' },
  { slug: 'roofing', label: 'Roofing' },
  { slug: 'doors-windows', label: 'Doors & Windows' },
  { slug: 'lighting', label: 'Exterior Lighting' },
  { slug: 'decks-patios', label: 'Decks, Patios & Flatwork' },
  { slug: 'signs', label: 'Signs' },
  { slug: 'solar', label: 'Solar Panels' },
  { slug: 'landscaping', label: 'Landscaping' },
  { slug: 'trees', label: 'Trees' },
  { slug: 'satellites', label: 'Satellite Dishes' },
  { slug: 'flagpoles', label: 'Flagpoles' },
  { slug: 'other-structures', label: 'Other Structures' },
  { slug: 'new-construction', label: 'New Construction' },
];

export function getGuidelinePlainText(slug: string): string | null {
  const filePath = path.join(DATA_DIR, `${slug}.txt`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getNumberedItem(line: string): { level: number; num: string; content: string } | null {
  const m = line.match(/^(\d+(?:\.\d+)*)\.\s+(.+)/);
  if (!m) return null;
  const level = m[1].split('.').length;
  return { level, num: m[1], content: m[2] };
}

function isHeading(line: string): boolean {
  return (
    line.length >= 8 &&
    line.length < 75 &&
    !/^\d/.test(line) &&
    !/\.$/.test(line) &&
    !/,/.test(line) &&
    line.trim().split(/\s+/).length <= 7
  );
}

export async function getGuidelineHtml(slug: string): Promise<string | null> {
  const text = getGuidelinePlainText(slug);
  if (!text) return null;

  const lines = text.split('\n');
  const out: string[] = ['<div class="pdf-guideline">'];
  let paraLines: string[] = [];

  function flushPara() {
    if (paraLines.length === 0) return;
    out.push(`<p>${paraLines.map(escHtml).join(' ')}</p>`);
    paraLines = [];
  }

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushPara();
      continue;
    }

    const item = getNumberedItem(line);
    if (item) {
      flushPara();
      const indent = Math.min(item.level - 1, 3);
      out.push(
        `<div class="gl-item gl-item-l${indent}">` +
        `<span class="gl-num">${escHtml(item.num)}.</span>` +
        `<span>${escHtml(item.content)}</span>` +
        `</div>`
      );
      continue;
    }

    if (isHeading(line)) {
      flushPara();
      out.push(`<h3 class="gl-heading">${escHtml(line)}</h3>`);
      continue;
    }

    paraLines.push(line);
  }

  flushPara();
  out.push('</div>');
  return out.join('\n');
}

export function getPdfPath(): string {
  return path.join(process.env.GUIDELINES_PATH!, PDF_FILENAME);
}
