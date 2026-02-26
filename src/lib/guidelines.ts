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

export async function getGuidelineHtml(slug: string): Promise<string | null> {
  const text = getGuidelinePlainText(slug);
  if (!text) return null;

  const html = text
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');

  return `<div class="pdf-guideline">${html}</div>`;
}

export function getPdfPath(): string {
  return path.join(process.env.GUIDELINES_PATH!, PDF_FILENAME);
}
