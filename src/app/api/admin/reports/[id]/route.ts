import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/middleware';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAdmin(req, async () => {
    const { id } = await params;
    const { status, admin_notes } = await req.json();

    const validStatuses = ['pending', 'investigating', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare('SELECT id FROM violation_reports WHERE id = ?')
      .get(id);

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    db.prepare(
      'UPDATE violation_reports SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes) WHERE id = ?'
    ).run(status ?? null, admin_notes ?? null, id);

    const updated = db
      .prepare('SELECT * FROM violation_reports WHERE id = ?')
      .get(id);
    return NextResponse.json(updated);
  });
}
