import { NextResponse } from 'next/server';
import { getCourses } from '@/lib/db';

export async function GET() {
  try {
    const courses = getCourses();
    return NextResponse.json(courses);
  } catch (error: unknown) {
    console.error('Failed to fetch courses:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch courses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
