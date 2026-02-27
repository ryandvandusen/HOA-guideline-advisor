import { NextResponse } from 'next/server';
import fs from 'fs';
import { getPdfPath } from '@/lib/guidelines';

export async function GET() {
  const pdfPath = getPdfPath();

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(pdfPath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="HOA-Design-Guidelines.pdf"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
