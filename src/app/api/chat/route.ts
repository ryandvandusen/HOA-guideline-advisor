import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { continueChat } from '@/lib/claude';
import { ChatMessage } from '@/types/submission';
import { getGuidelinePlainText, GUIDELINE_CATEGORIES } from '@/lib/guidelines';
import { LIMITS, truncate } from '@/lib/validate';
import { checkRateLimit } from '@/lib/rateLimit';

export const maxDuration = 30;

// 60 chat messages per IP per hour
const RATE_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`chat:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { submissionId, message: rawMessage } = await req.json();

    if (!submissionId || !rawMessage?.trim()) {
      return NextResponse.json(
        { error: 'submissionId and message are required' },
        { status: 400 }
      );
    }

    const message = truncate(rawMessage.trim(), LIMITS.message);

    const db = getDb();
    const submission = db
      .prepare('SELECT * FROM submissions WHERE id = ?')
      .get(submissionId) as { session_messages: string; guideline_slug: string | null } | undefined;

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const history: ChatMessage[] = JSON.parse(submission.session_messages);

    // Inject full guideline text if the submission has a selected guideline
    let guidelineContext: string | undefined;
    if (submission.guideline_slug) {
      const category = GUIDELINE_CATEGORIES.find((c) => c.slug === submission.guideline_slug);
      if (category) {
        const text = await getGuidelinePlainText(submission.guideline_slug);
        if (text) {
          guidelineContext = `FULL GUIDELINE TEXT — ${category.label}:\n\n${text}`;
        }
      }
    }

    const reply = await continueChat(history, message, guidelineContext);

    // Update conversation history in DB
    const updatedMessages: ChatMessage[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ];

    db.prepare('UPDATE submissions SET session_messages = ? WHERE id = ?').run(
      JSON.stringify(updatedMessages),
      submissionId
    );

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
