import { NextResponse } from 'next/server';
import { GUIDELINE_CATEGORIES, PDF_APPENDICES } from '@/lib/guidelines';

export async function GET() {
  return NextResponse.json({
    categories: GUIDELINE_CATEGORIES,
    appendices: PDF_APPENDICES,
  });
}
