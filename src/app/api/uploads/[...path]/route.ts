import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
};

const UPLOADS_ROOT = process.env.UPLOADS_PATH!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;

  // Reject any segment containing traversal sequences before joining
  if (pathSegments.some((seg) => seg.includes('..') || seg.includes('\0'))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const filePath = path.resolve(UPLOADS_ROOT, ...pathSegments);

  // Enforce that the resolved path stays within UPLOADS_ROOT (path traversal guard)
  if (!filePath.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // Only serve known image types
  if (!MIME_TYPES[ext]) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
