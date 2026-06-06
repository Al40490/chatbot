import { NextResponse } from 'next/server';
import { getTimetable, addTimetableEntry, deleteTimetableEntry, deleteTimetableEntryByCourseId } from '@/lib/db';

export async function GET() {
  try {
    const timetable = getTimetable();
    return NextResponse.json(timetable);
  } catch (error: unknown) {
    console.error('Failed to get timetable:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch timetable';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, dayOfWeek, startTime, endTime, room, instructor } = body;
    
    if (!courseId || !dayOfWeek || !startTime || !endTime || !room || !instructor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newId = addTimetableEntry(courseId, dayOfWeek, startTime, endTime, room, instructor);
    return NextResponse.json({ success: true, id: newId });
  } catch (error: unknown) {
    console.error('Failed to add timetable entry:', error);
    const message = error instanceof Error ? error.message : 'Failed to add timetable entry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const courseId = searchParams.get('courseId');

    if (id) {
      deleteTimetableEntry(parseInt(id, 10));
      return NextResponse.json({ success: true, message: `Deleted entry ${id}` });
    } else if (courseId) {
      deleteTimetableEntryByCourseId(courseId);
      return NextResponse.json({ success: true, message: `Deleted entries for course ${courseId}` });
    }

    return NextResponse.json({ error: 'Missing id or courseId parameter' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to delete timetable entry:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete timetable entry';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
