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
  { slug: 'design-construction', label: 'Design & Construction Guidelines' },
  { slug: 'paint-siding', label: '↳ Paint, Siding, Brick & Stone' },
  { slug: 'roofing', label: '↳ Roofing' },
  { slug: 'doors-windows', label: '↳ Doors & Windows' },
  { slug: 'lighting', label: '↳ Exterior Lighting' },
  { slug: 'decks-patios', label: '↳ Decks, Patios & Flatwork' },
  { slug: 'signs', label: '↳ Signs' },
  { slug: 'other-structures', label: '↳ Other Structures' },
  { slug: 'new-construction', label: '↳ New Construction' },
  { slug: 'fencing', label: 'Fencing' },
  { slug: 'solar', label: 'Solar Panels' },
  { slug: 'landscaping', label: 'Landscaping' },
  { slug: 'trees', label: 'Trees' },
  { slug: 'satellites', label: 'Satellite Dishes' },
  { slug: 'flagpoles', label: 'Flagpoles' },
];

// These slugs share the same underlying text file (the PDF doesn't have
// separate sections for them — they're all in General Architectural Guidelines)
const SLUG_FILE_ALIASES: Record<string, string> = {
  'design-construction': 'architectural',
  'paint-siding':  'architectural',
  'roofing':       'architectural',
  'doors-windows': 'architectural',
  'lighting':      'architectural',
  'decks-patios':  'architectural',
  'signs':         'architectural',
  'other-structures': 'architectural',
  'new-construction': 'architectural',
};

export function getGuidelinePlainText(slug: string): string | null {
  const resolvedSlug = SLUG_FILE_ALIASES[slug] ?? slug;
  const filePath = path.join(DATA_DIR, `${resolvedSlug}.txt`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}


export function getPdfPath(): string {
  return path.join(process.env.GUIDELINES_PATH!, PDF_FILENAME);
}
