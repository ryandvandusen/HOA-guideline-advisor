import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { analyzePhoto } from '@/lib/claude';
import { saveUploadedFile } from '@/lib/storage';
import { getGuidelinePlainText, GUIDELINE_CATEGORIES } from '@/lib/guidelines';
import { validateImage, LIMITS, truncate } from '@/lib/validate';
import { checkRateLimit } from '@/lib/rateLimit';

export const maxDuration = 60;

// 10 photo submissions per IP per hour
const RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  // Rate limiting — keyed by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`analyze:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const rawMessage = (formData.get('message') as string) || '';
    const rawSlug = (formData.get('guidelineSlug') as string) || null;

    if (!image) {
      return NextResponse.json({ error: 'Image is required.' }, { status: 400 });
    }

    // Server-side image validation (magic bytes + size)
    const validation = await validateImage(image);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Sanitize text inputs
    const message = truncate(rawMessage, LIMITS.message);

    // Validate guidelineSlug is a known slug (prevent arbitrary string injection)
    const guidelineSlug = GUIDELINE_CATEGORIES.find((c) => c.slug === rawSlug)?.slug ?? null;

    // Optionally inject full guideline text as Tier 2 context
    let guidelineContext: string | undefined;
    if (guidelineSlug) {
      const category = GUIDELINE_CATEGORIES.find((c) => c.slug === guidelineSlug)!;
      const text = await getGuidelinePlainText(guidelineSlug);
      if (text) {
        guidelineContext = `FULL GUIDELINE TEXT — ${category.label}:\n\n${text}`;
      }
    }

    // Save image using server-validated MIME type (not client-supplied)
    const { filePath } = await saveUploadedFile(image, 'submissions', validation.mime);

    // Convert to base64 for Claude
    const buffer = Buffer.from(await image.arrayBuffer());
    const imageBase64 = buffer.toString('base64');

    // Run Claude vision analysis
    const analysis = await analyzePhoto(imageBase64, validation.mime, message, guidelineContext);

    // Persist to database
    const db = getDb();
    const id = randomUUID();
    const initialMessages = JSON.stringify([
      { role: 'user', content: message || 'Please analyze this photo for HOA compliance.' },
      { role: 'assistant', content: analysis.message },
    ]);

    db.prepare(`
      INSERT INTO submissions (id, photo_path, session_messages, compliance_status, ai_summary, issues_found, guideline_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      filePath,
      initialMessages,
      analysis.compliance_status,
      analysis.summary,
      JSON.stringify(analysis.issues),
      guidelineSlug
    );

    return NextResponse.json({ submissionId: id, analysis });
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}
