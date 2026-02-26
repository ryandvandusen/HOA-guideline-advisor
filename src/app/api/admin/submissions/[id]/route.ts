import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(req, async () => {
    const { id } = await params;
    const db = getDb();
    const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);

    if (!row) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(row);
  });
}
