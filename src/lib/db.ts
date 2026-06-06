import Database from 'better-sqlite3';
import path from 'path';

// Define TS interfaces for our database objects
export interface Course {
  id: string;
  name: string;
  department: string;
  description: string;
  credits: number;
}

export interface TimetableEntry {
  id: number;
  course_id: string;
  course_name?: string;
  day_of_week: string; // 'Monday', 'Tuesday', etc.
  start_time: string;  // 'HH:MM'
  end_time: string;    // 'HH:MM'
  room: string;
  instructor: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: number; // 0 or 1
}

const DB_PATH = path.join(process.cwd(), 'timetable.db');

// Database singleton pattern for Next.js hot-reloads
declare global {
  var _sqliteDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'production') {
    return new Database(DB_PATH);
  } else {
    if (!global._sqliteDb) {
      global._sqliteDb = new Database(DB_PATH);
    }
    return global._sqliteDb;
  }
}

export const db = getDb();

// Initialize schema and seed data
export function initDb() {
  // Create tables if they do not exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT NOT NULL,
      credits INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      instructor TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER DEFAULT 0
    );
  `);

  // Check if we need to seed the database
  const courseCountRow = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (courseCountRow.count === 0) {
    seedData();
  }
}

function seedData() {
  console.log('Seeding database with university data (UGANC-style)...');

  // 1. Seed courses (15+ courses)
  const insertCourse = db.prepare(`
    INSERT INTO courses (id, name, department, description, credits)
    VALUES (?, ?, ?, ?, ?)
  `);

  const coursesList = [
    ['GL-301', 'Génie Logiciel I', 'Génie Logiciel', 'Principes fondamentaux du cycle de vie du logiciel, spécifications et conception.', 4],
    ['GL-302', 'Conception Orientée Objet', 'Génie Logiciel', 'Patrons de conception (Design Patterns), programmation orientée objet avancée en Java/C++.', 3],
    ['BD-303', 'Systèmes de Gestion de Bases de Données', 'Informatique', 'Conception de bases de données relationnelles, SQL avancé, indexation et optimisation des requêtes.', 4],
    ['IA-304', 'Introduction à l\'Intelligence Artificielle', 'Informatique', 'Algorithmes de recherche, réseaux de neurones, logique floue et apprentissage automatique.', 3],
    ['RS-305', 'Réseaux Informatiques et Télécoms', 'Télécoms', 'Modèle OSI, protocoles TCP/IP, routage, commutation et administration réseau.', 3],
    ['SEC-306', 'Sécurité Informatique', 'Informatique', 'Cryptographie, sécurité des réseaux, vulnérabilités Web et gestion de la sécurité.', 3],
    ['WEB-307', 'Programmation Web Avancée', 'Génie Logiciel', 'Architecture des applications web, frameworks modernes (React, Next.js, Node.js), API RESTful.', 3],
    ['RO-308', 'Recherche Opérationnelle', 'Mathématiques', 'Programmation linéaire, théorie des graphes, méthodes d\'optimisation et gestion de projet (PERT/CPM).', 2],
    ['SE-309', 'Systèmes d\'Exploitation', 'Informatique', 'Gestion des processus, de la mémoire, des fichiers, threads, et programmation système sous Linux.', 3],
    ['COMP-310', 'Compilation et Langages', 'Informatique', 'Analyse lexicale, analyse syntaxique, grammaires hors-contexte et génération de code.', 3],
    ['ARCH-311', 'Architecture des Ordinateurs', 'Télécoms', 'Organisation des microprocesseurs, assembleur x86/ARM, mémoires caches et pipeline.', 3],
    ['AG-312', 'Méthodologies Agiles', 'Génie Logiciel', 'Scrum, Kanban, Extreme Programming (XP), gestion de projet moderne et DevOps.', 2],
    ['BD-313', 'Big Data et Analytics', 'Informatique', 'Écosystème Hadoop, MapReduce, Apache Spark, NoSQL et analyse de données massives.', 3],
    ['IHM-314', 'Interface Homme-Machine (IHM)', 'Informatique', 'Principes ergonomiques, utilisabilité, prototypage d\'interfaces et expérience utilisateur (UX).', 2],
    ['ET-315', 'Éthique et Droit Informatique', 'Général', 'Propriété intellectuelle en Guinée, droit du numérique, RGPD/protection des données et éthique de l\'IA.', 1],
    ['ANG-301', 'Anglais Technique', 'Langues', 'Communication écrite et orale appliquée aux sciences informatiques et technologies.', 2]
  ];

  for (const c of coursesList) {
    insertCourse.run(c[0], c[1], c[2], c[3], c[4]);
  }

  // 2. Seed timetable entries for Mamadou Diallo (UGANC L3 Génie Logiciel)
  const insertTimetable = db.prepare(`
    INSERT INTO timetable (course_id, day_of_week, start_time, end_time, room, instructor)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const timetableList = [
    // Lundi
    ['GL-301', 'Monday', '08:30', '10:00', 'Amphi Nelson Mandela', 'Dr. Alpha Bah'],
    ['BD-303', 'Monday', '10:30', '12:00', 'Salle 202', 'Prof. Fodé Diallo'],
    ['RS-305', 'Monday', '14:00', '15:30', 'Labo Réseaux', 'Dr. Fatoumata Camara'],
    // Mardi
    ['GL-302', 'Tuesday', '08:30', '10:00', 'Salle 204', 'M. Lansana Barry'],
    ['WEB-307', 'Tuesday', '10:30', '12:00', 'Labo Informatique', 'M. Sékou Sylla'],
    ['SE-309', 'Tuesday', '14:00', '15:30', 'Salle 105', 'Dr. Ousmane Touré'],
    // Mercredi
    ['IA-304', 'Wednesday', '08:30', '10:00', 'Amphi Nelson Mandela', 'Prof. Djénabou Keita'],
    ['RO-308', 'Wednesday', '10:30', '12:00', 'Salle 202', 'Mme. Mariama Condé'],
    ['AG-312', 'Wednesday', '14:00', '15:30', 'Salle 103', 'M. Amadou Cissé'],
    // Jeudi
    ['SEC-306', 'Thursday', '08:30', '10:00', 'Labo Réseaux', 'Dr. Alpha Sow'],
    ['COMP-310', 'Thursday', '10:30', '12:00', 'Salle 204', 'Prof. Bangoura'],
    ['IHM-314', 'Thursday', '14:00', '15:30', 'Salle 105', 'Mme. Soumah'],
    // Vendredi
    ['ARCH-311', 'Friday', '08:30', '10:00', 'Salle 103', 'Dr. Kourouma'],
    ['BD-313', 'Friday', '10:30', '12:00', 'Labo Informatique', 'M. Sékou Sylla'],
    ['ET-315', 'Friday', '14:00', '15:30', 'Amphi Nelson Mandela', 'Mme. Aïssatou Diallo']
  ];

  for (const t of timetableList) {
    insertTimetable.run(t[0], t[1], t[2], t[3], t[4], t[5]);
  }

  // 3. Seed initial notifications
  const insertNotification = db.prepare(`
    INSERT INTO notifications (title, message, created_at, is_read)
    VALUES (?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const notificationsList = [
    ['Changement de salle - GL-301', 'Le cours de Génie Logiciel I du lundi à 08:30 (Amphi Nelson Mandela) est exceptionnellement déplacé au Labo Informatique pour la séance pratique.', now, 0],
    ['Rattrapage - Réseaux Informatiques', 'Le cours de Réseaux Informatiques (RS-305) aura une séance de rattrapage le samedi à 09:00 en Salle 202.', now, 0]
  ];

  for (const n of notificationsList) {
    insertNotification.run(n[0], n[1], n[2], n[3]);
  }

  console.log('Seeding completed.');
}

// Database helper functions
export function getCourses(): Course[] {
  return db.prepare('SELECT * FROM courses ORDER BY id ASC').all() as Course[];
}

export function searchCourses(query: string): Course[] {
  return db.prepare(`
    SELECT * FROM courses 
    WHERE id LIKE ? OR name LIKE ? OR description LIKE ? OR department LIKE ?
    ORDER BY id ASC
  `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`) as Course[];
}

export function getTimetable(): TimetableEntry[] {
  return db.prepare(`
    SELECT t.*, c.name as course_name 
    FROM timetable t
    JOIN courses c ON t.course_id = c.id
    ORDER BY 
      CASE day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
      END ASC,
      start_time ASC
  `).all() as TimetableEntry[];
}

export function addTimetableEntry(
  courseId: string, 
  dayOfWeek: string, 
  startTime: string, 
  endTime: string, 
  room: string, 
  instructor: string
): number | bigint {
  const result = db.prepare(`
    INSERT INTO timetable (course_id, day_of_week, start_time, end_time, room, instructor)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(courseId, dayOfWeek, startTime, endTime, room, instructor);
  return result.lastInsertRowid;
}

export function deleteTimetableEntry(id: number): boolean {
  db.prepare('DELETE FROM timetable WHERE id = ?').run(id);
  return true;
}

export function deleteTimetableEntryByCourseId(courseId: string): boolean {
  db.prepare('DELETE FROM timetable WHERE course_id = ?').run(courseId);
  return true;
}

export function getNotifications(): Notification[] {
  return db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all() as Notification[];
}

export function addNotification(title: string, message: string): number | bigint {
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO notifications (title, message, created_at, is_read)
    VALUES (?, ?, ?, 0)
  `).run(title, message, now);
  return result.lastInsertRowid;
}

export function markNotificationAsRead(id: number): boolean {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  return true;
}

export function markAllNotificationsAsRead(): boolean {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  return true;
}

export function resetDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS timetable;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS courses;
  `);
  initDb();
}

// Initialize on import
initDb();
