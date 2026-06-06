import { NextResponse } from 'next/server';
import { 
  getNotifications, 
  addNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  db,
  resetDatabase
} from '@/lib/db';

export async function GET() {
  try {
    const notifications = getNotifications();
    return NextResponse.json(notifications);
  } catch (error: unknown) {
    console.error('Failed to get notifications:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, type, courseId, param } = body;

    // Handle database reset
    if (action === 'reset') {
      resetDatabase();
      return NextResponse.json({ success: true, message: 'Database reset to initial state' });
    }

    if (action === 'simulate') {
      let title = '';
      let message = '';
      
      db.transaction(() => {
        if (type === 'cancellation') {
          // Find if there is a class to cancel
          const entry = db.prepare('SELECT t.id, c.name FROM timetable t JOIN courses c ON t.course_id = c.id WHERE t.course_id = ?').get(courseId) as { id: number, name: string } | undefined;
          
          if (entry) {
            // Delete the class from timetable
            db.prepare('DELETE FROM timetable WHERE id = ?').run(entry.id);
            title = `❌ Annulation - ${courseId}`;
            message = `Le cours de "${entry.name}" (${courseId}) a été annulé par l'enseignant pour cette semaine.`;
            addNotification(title, message);
          } else {
            title = `Alerte d'Annulation`;
            message = `Aucune classe programmée trouvée pour le cours ${courseId} à annuler.`;
            addNotification(title, message);
          }
        } 
        
        else if (type === 'room_change') {
          const entry = db.prepare('SELECT t.id, c.name, t.room FROM timetable t JOIN courses c ON t.course_id = c.id WHERE t.course_id = ?').get(courseId) as { id: number, name: string, room: string } | undefined;
          
          if (entry) {
            const newRoom = param || 'Salle 301 (Bâtiment Principal)';
            db.prepare('UPDATE timetable SET room = ? WHERE id = ?').run(newRoom, entry.id);
            title = `🚪 Changement de Salle - ${courseId}`;
            message = `Le cours de "${entry.name}" (${courseId}) est déplacé de la ${entry.room} vers la ${newRoom}.`;
            addNotification(title, message);
          } else {
            title = `Alerte de Changement de Salle`;
            message = `Aucune classe programmée trouvée pour le cours ${courseId} pour modifier la salle.`;
            addNotification(title, message);
          }
        } 
        
        else if (type === 'time_change') {
          const entry = db.prepare('SELECT t.id, c.name, t.start_time, t.end_time FROM timetable t JOIN courses c ON t.course_id = c.id WHERE t.course_id = ?').get(courseId) as { id: number, name: string, start_time: string, end_time: string } | undefined;
          
          if (entry) {
            const [newStart = '16:00', newEnd = '17:30'] = typeof param === 'string' ? param.split('-') : [];
            db.prepare('UPDATE timetable SET start_time = ?, end_time = ? WHERE id = ?').run(newStart, newEnd, entry.id);
            title = `⏰ Changement d'Horaire - ${courseId}`;
            message = `Le cours de "${entry.name}" (${courseId}) a été déplacé. Nouvel horaire : ${newStart} - ${newEnd}.`;
            addNotification(title, message);
          } else {
            title = `Alerte de Changement d'Horaire`;
            message = `Aucune classe programmée trouvée pour le cours ${courseId} pour modifier l'horaire.`;
            addNotification(title, message);
          }
        }
      })();

      return NextResponse.json({ success: true, title, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Simulation failed:', error);
    const message = error instanceof Error ? error.message : 'Simulation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, all } = body;

    if (all) {
      markAllNotificationsAsRead();
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (id) {
      markNotificationAsRead(parseInt(id, 10));
      return NextResponse.json({ success: true, message: `Notification ${id} marked as read` });
    }

    return NextResponse.json({ error: 'Missing id or all parameter' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to update notification:', error);
    const message = error instanceof Error ? error.message : 'Failed to update notification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
