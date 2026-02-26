import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { saveUploadedFile } from '@/lib/storage';
import { validateImage, LIMITS, truncate } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawAddress = formData.get('address') as string;
    const rawDescription = formData.get('description') as string;
    const rawNotes = (formData.get('notes') as string) || '';
    const photo = formData.get('photo') as File | null;

    if (!rawAddress?.trim() || !rawDescription?.trim()) {
      return NextResponse.json(
        { error: 'Address and description are required.' },
        { status: 400 }
      );
    }

    // Enforce input length limits
    const address = truncate(rawAddress.trim(), LIMITS.address);
    const description = truncate(rawDescription.trim(), LIMITS.description);
    const notes = rawNotes ? truncate(rawNotes.trim(), LIMITS.notes) : null;

    let photoPath: string | null = null;
    if (photo && photo.size > 0) {
      const validation = await validateImage(photo);
      if (!validation.ok) {
        return NextResponse.json({ error: `Photo: ${validation.error}` }, { status: 400 });
      }
      const { filePath } = await saveUploadedFile(photo, 'reports', validation.mime);
      photoPath = filePath;
    }

    const db = getDb();
    const id = randomUUID();

    db.prepare(`
      INSERT INTO violation_reports (id, property_address, description, photo_path, reporter_notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, address, description, photoPath, notes);

    return NextResponse.json({ success: true, reportId: id });
  } catch (error) {
    console.error('Error in /api/report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report. Please try again.' },
      { status: 500 }
    );
  }
}
