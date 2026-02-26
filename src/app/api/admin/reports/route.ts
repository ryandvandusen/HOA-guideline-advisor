import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return requireAdmin(req, async () => {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM violation_reports ORDER BY created_at DESC')
      .all();
    return NextResponse.json(rows);
  });
}
