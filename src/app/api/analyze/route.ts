import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { analyzePhoto, analyzeTextQuestion } from '@/lib/claude';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { saveUploadedFile } from '@/lib/storage';
import { getGuidelinePlainText, GUIDELINE_CATEGORIES } from '@/lib/guidelines';
import { validateImage, LIMITS, truncate, containsPromptInjection } from '@/lib/validate';
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

    // Sanitize text inputs
    const message = truncate(rawMessage, LIMITS.message);

    // Block prompt injection attempts
    if (containsPromptInjection(message)) {
      return NextResponse.json({ error: 'Message contains disallowed content.' }, { status: 400 });
    }

    // Validate guidelineSlug is a known slug (prevent arbitrary string injection)
    const guidelineSlug = GUIDELINE_CATEGORIES.find((c) => c.slug === rawSlug)?.slug ?? null;

    // Optionally inject full guideline text as Tier 2 context
    let guidelineContext: string | undefined;
    if (guidelineSlug) {
      const category = GUIDELINE_CATEGORIES.find((c) => c.slug === guidelineSlug)!;
      const text = getGuidelinePlainText(guidelineSlug);
      if (text) {
        guidelineContext = `FULL GUIDELINE TEXT — ${category.label}:\n\n${text}`;
      }
    }

    const db = getDb();
    const id = randomUUID();
    let analysis;
    let filePath: string | null = null;

    if (image) {
      // Photo submission: validate, save, run vision analysis
      const validation = await validateImage(image);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const saved = await saveUploadedFile(image, 'submissions', validation.mime);
      filePath = saved.filePath;

      const buffer = Buffer.from(await image.arrayBuffer());
      const imageBase64 = buffer.toString('base64');
      analysis = await analyzePhoto(imageBase64, validation.mime, message, guidelineContext);
    } else {
      // Text-only question: no photo required
      if (!message) {
        return NextResponse.json({ error: 'A message or image is required.' }, { status: 400 });
      }

      // Check cache before calling Claude
      const cached = getCachedResponse(message, guidelineSlug);
      if (cached) {
        analysis = cached;
      } else {
        const result = await analyzeTextQuestion(message, guidelineContext);
        // Force inconclusive status and clear visual-only fields for text-only sessions
        analysis = {
          ...result,
          compliance_status: 'inconclusive' as const,
          issues: [],
        };
        setCachedResponse(message, guidelineSlug, analysis);
      }
    }

    // Persist to database
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
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
