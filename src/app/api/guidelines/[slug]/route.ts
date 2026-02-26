import { NextRequest, NextResponse } from 'next/server';
import { getGuidelineHtml } from '@/lib/guidelines';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const html = await getGuidelineHtml(slug);

    if (!html) {
      return NextResponse.json({ error: 'Guideline not found' }, { status: 404 });
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error loading guideline:', error);
    return NextResponse.json({ error: 'Failed to load guideline' }, { status: 500 });
  }
}
