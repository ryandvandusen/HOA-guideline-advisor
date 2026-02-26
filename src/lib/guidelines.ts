import fs from 'fs';
import path from 'path';
import { GuidelineCategory } from '@/types/guideline';

export const GUIDELINE_CATEGORIES: GuidelineCategory[] = [
  { slug: 'intro', label: 'Introduction', file: '0-Intro-Guidelines.docx' },
  { slug: 'general', label: 'General Conditions', file: '1- General Conditions-Guidelines.docx' },
  { slug: 'review-process', label: 'Review Process & Fees', file: '2- Review Process & Fees - Guidelines.docx' },
  { slug: 'paint-siding', label: 'Paint, Siding, Brick & Stone', file: '3-Paint-Siding-Brick-Stone-Guidelines.docx' },
  { slug: 'fencing', label: 'Fencing', file: '4-Fencing-Guidelines.docx' },
  { slug: 'roofing', label: 'Roofing', file: '5-Roofing-Guildlines.docx' },
  { slug: 'doors-windows', label: 'Doors & Windows', file: '6-Door&Windows-Guidelines.docx' },
  { slug: 'lighting', label: 'Exterior Lighting', file: '7-Exterior-Lighting_Guidelines.docx' },
  { slug: 'decks-patios', label: 'Decks, Patios & Flatwork', file: '8-Decks-Patios-Flatwork-Guidelines.docx' },
  { slug: 'signs', label: 'Signs', file: '9-Sign-Guidelines.docx' },
  { slug: 'solar', label: 'Solar Panels', file: '10-Solar-Guidelines.docx' },
  { slug: 'landscaping', label: 'Landscaping', file: '11-Landscaping Guidelines.docx' },
  { slug: 'trees', label: 'Trees', file: '12-Tree-Guidelines.docx' },
  { slug: 'satellites', label: 'Satellite Dishes', file: '13-Satelite-Guidelines.docx' },
  { slug: 'flagpoles', label: 'Flagpoles', file: '14-Flagpole-Guidelines.docx' },
  { slug: 'other-structures', label: 'Other Structures', file: '15-Other Structures.docx' },
  { slug: 'new-construction', label: 'New Construction', file: '16-New Construction - Guidlines.docx' },
  { slug: 'arc-charter', label: 'ARC Charter', file: 'ARC Charter - Draft 05.09.25.docx' },
  { slug: 'moa-design', label: 'MOA Design Guidelines (2023)', file: '!-2023-MOA-Design-Guidelines.docx' },
];

// PDF appendices — exposed as download links only
export const PDF_APPENDICES = [
  { label: 'Appendix A — Fence Construction Details (PDF)', file: 'Appendix A - Fences.pdf' },
  { label: 'Appendix B — Property Plat Maps (PDF)', file: 'Appendix B - MH Plats.pdf' },
];

export async function getGuidelineHtml(slug: string): Promise<string | null> {
  const category = GUIDELINE_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return null;

  const cacheDir = process.env.GUIDELINES_CACHE_PATH!;
  const cachePath = path.join(cacheDir, `${slug}.html`);

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf-8');
  }

  const docxPath = path.join(process.env.GUIDELINES_PATH!, category.file);
  if (!fs.existsSync(docxPath)) return null;

  // Dynamic import to avoid issues with module resolution
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml(
    { path: docxPath },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h2.guideline-h2:fresh",
        "p[style-name='Heading 2'] => h3.guideline-h3:fresh",
        "p[style-name='Heading 3'] => h4.guideline-h4:fresh",
        "p[style-name='Heading 4'] => h5.guideline-h5:fresh",
      ],
    }
  );

  const html = result.value;
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath, html, 'utf-8');

  return html;
}

export async function getGuidelinePlainText(slug: string): Promise<string | null> {
  const category = GUIDELINE_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return null;

  const docxPath = path.join(process.env.GUIDELINES_PATH!, category.file);
  if (!fs.existsSync(docxPath)) return null;

  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ path: docxPath });
  return result.value;
}

export function getPdfDownloadPath(filename: string): string | null {
  const appendix = PDF_APPENDICES.find((a) => a.file === filename);
  if (!appendix) return null;
  return path.join(process.env.GUIDELINES_PATH!, appendix.file);
}
