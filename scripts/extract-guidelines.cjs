/**
 * One-time script to extract guideline sections from the PDF into clean .txt files.
 * Run with: node scripts/extract-guidelines.cjs
 *
 * Output files are committed to src/data/guidelines/ and read at runtime.
 * Re-run this script whenever the PDF is updated, then review and commit the output.
 */

const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Read GUIDELINES_PATH from .env.local manually (avoids dotenv dependency)
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const guidelinesPathMatch = envContent.match(/^GUIDELINES_PATH=(.+)$/m);
const GUIDELINES_PATH = guidelinesPathMatch ? guidelinesPathMatch[1].trim() : '';

const PDF_PATH = path.join(GUIDELINES_PATH, '2023-MOA-Design-Guidelines.pdf');
const OUT_DIR = path.join(__dirname, '../src/data/guidelines');

const SECTION_MARKERS = {
  'general':          [['General Conditions', 'Design Review Fees']],
  'review-process':   [['Design Review Fees', 'General Architectural Guidelines']],
  'paint-siding':     [['General Architectural Guidelines', 'Fencing Guidelines']],
  'roofing':          [['General Architectural Guidelines', 'Fencing Guidelines']],
  'doors-windows':    [['General Architectural Guidelines', 'Fencing Guidelines']],
  'lighting':         [['General Architectural Guidelines', 'Fencing Guidelines']],
  'decks-patios':     [['General Architectural Guidelines', 'Fencing Guidelines']],
  'signs':            [['General Architectural Guidelines', 'Fencing Guidelines']],
  'other-structures': [['General Architectural Guidelines', 'Fencing Guidelines']],
  'new-construction': [['General Architectural Guidelines', 'Fencing Guidelines']],
  'fencing':          [['Fencing Guidelines', 'Landscaping Applications']],
  'solar': [
    ['Solar Installation Review', 'What to Include with a Construction Application'],
    ['General Architectural Guidelines', 'Fencing Guidelines'],
  ],
  'landscaping':      [['Landscaping Applications', 'Flagpole Installation Standards']],
  'trees':            [['Landscaping Standards', 'Flagpole Installation Standards']],
  'flagpoles':        [['Flagpole Installation Standards', 'Satellite Dishes']],
  'satellites':       [['Satellite Dishes', 'Amendments']],
};

function cleanPdfText(text) {
  return text
    // Remove page number lines
    .replace(/\nPage \d+\s*\n/g, '\n')
    // Remove running headers
    .replace(/\nMurrayhill Design Guidelines[^\n]*\n/g, '\n')
    // Remove table of contents entries (lines with 5+ underscores, e.g. "General Conditions ___ 3")
    .replace(/[^\n]*_{5,}[^\n]*\n/g, '')
    // Re-join hyphenated words broken across lines (e.g. "con-\ntractor" → "contractor")
    .replace(/-\n([a-z])/g, '$1')
    // Re-join lines that are clearly mid-sentence continuations:
    // previous line ends with lowercase letter/comma/semicolon, next starts lowercase
    .replace(/([a-z,;:])\n([a-z])/g, '$1 $2')
    // Collapse 3+ blank lines to a single blank line
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSection(text, startMarker, endMarker) {
  // Match the marker only when it appears as its own line (not mid-sentence)
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startPattern = new RegExp(`(^|\\n)${esc(startMarker)}\\s*\\n`);
  const startMatch = startPattern.exec(text);
  if (!startMatch) return '';
  const startIdx = startMatch.index + (startMatch[1] === '\n' ? 1 : 0);
  const fromStart = text.substring(startIdx);
  const endPattern = new RegExp(`(^|\\n)${esc(endMarker)}\\s*\\n`);
  const endMatch = endPattern.exec(fromStart);
  if (!endMatch) return fromStart.trim();
  return fromStart.substring(0, endMatch.index).trim();
}

async function main() {
  console.log('Reading PDF:', PDF_PATH);
  const buffer = fs.readFileSync(PDF_PATH);
  const result = await pdfParse(buffer);
  const cleaned = cleanPdfText(result.text);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [slug, markers] of Object.entries(SECTION_MARKERS)) {
    const sections = markers
      .map(([start, end]) => extractSection(cleaned, start, end))
      .filter(Boolean);

    if (sections.length === 0) {
      console.warn(`  WARNING: no content found for "${slug}"`);
      continue;
    }

    const content = sections.join('\n\n---\n\n');
    const outPath = path.join(OUT_DIR, `${slug}.txt`);
    fs.writeFileSync(outPath, content, 'utf-8');
    console.log(`  ✓ ${slug} (${content.length} chars)`);
  }

  console.log('\nDone. Review files in src/data/guidelines/ then commit.');
}

main().catch((e) => { console.error(e); process.exit(1); });
