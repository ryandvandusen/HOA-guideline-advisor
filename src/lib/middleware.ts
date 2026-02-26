import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from './auth';

export function requireAdmin(
  req: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || !verifyAdminToken(token)) {
    return Promise.resolve(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
  }

  return handler();
}
