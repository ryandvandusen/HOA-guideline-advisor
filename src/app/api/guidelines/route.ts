import { NextResponse } from 'next/server';
import { GUIDELINE_CATEGORIES } from '@/lib/guidelines';

export async function GET() {
  return NextResponse.json({ categories: GUIDELINE_CATEGORIES });
}
