'use client';

import React, { useMemo, useState } from 'react';
import { Notification, TimetableEntry } from '@/lib/db';
import { exportTeacherTimetableToPdf } from '@/lib/pdf';
import Chatbot from '@/components/Chatbot';
import NotificationCenter from '@/components/NotificationCenter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBookOpen,
  faCalendarDay,
  faCalendarWeek,
  faChalkboardUser,
  faDoorOpen,
  faDownload,
  faLocationDot,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TeacherDashboardProps {
  entries: TimetableEntry[];
  notifications: Notification[];
  isLoading: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onMarkAsRead: (id: number) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onRefreshTimetable: () => void;
  onRefreshNotifications: () => void;
}

export default function TeacherDashboard({
  entries,
  notifications,
  isLoading,
  isDark,
  onToggleTheme,
  onLogout,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefreshTimetable,
  onRefreshNotifications
}: TeacherDashboardProps) {
  const [view, setView] = useState<'week' | 'day'>('week');
  const [dayIdx, setDayIdx] = useState(0);

  const dayEntries = entries.filter(entry => entry.day_of_week === DAYS_EN[dayIdx]);
  const uniqueCourses = useMemo(() => new Set(entries.map(entry => entry.course_id)).size, [entries]);
  const uniqueRooms = useMemo(() => new Set(entries.map(entry => entry.room)).size, [entries]);
  const unreadCount = notifications.filter(notification => notification.is_read === 0).length;

  const groupedEntries = DAYS_EN.map((dayEn, index) => ({
    dayEn,
    dayFr: DAYS_FR[index],
    courses: entries.filter(entry => entry.day_of_week === dayEn)
  }));

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-main)]">
      <header className="shrink-0 border-b border-[var(--border-soft)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-sm">
              <FontAwesomeIcon icon={faChalkboardUser} className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight text-[var(--text-main)]">MADTIME</h1>
              <p className="text-[10px] font-semibold text-[var(--accent)]">Classe Génie Logiciel</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1.5 md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                PR
              </div>
              <div>
                <p className="text-[10px] font-semibold leading-tight text-[var(--text-main)]">Enseignant MADTIME</p>
                <p className="text-[9px] font-medium leading-tight text-[var(--text-muted)]">Classe Génie Logiciel</p>
              </div>
            </div>

            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
            />

            <button
              onClick={onToggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="h-4 w-4" />
            </button>

            <button
              onClick={onLogout}
              className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border-soft)] px-3 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)] sm:flex"
              title="Déconnexion"
            >
              <FontAwesomeIcon icon={faDoorOpen} className="h-3.5 w-3.5" />
              <span>Sortir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <div className="shrink-0 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-3 shadow-sm">
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">Classe Génie Logiciel</p>
                <h2 className="mt-1 text-lg font-bold text-[var(--text-main)]">Emploi du temps publié</h2>
                <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">Vue enseignant de la classe, des salles et des alertes associées.</p>
              </div>

              <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap">
                <div className="flex rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] p-1">
                  <button
                    onClick={() => setView('week')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      view === 'week' ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCalendarWeek} className="h-3.5 w-3.5" />
                    <span>Semaine</span>
                  </button>
                  <button
                    onClick={() => setView('day')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      view === 'day' ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <FontAwesomeIcon icon={faCalendarDay} className="h-3.5 w-3.5" />
                    <span>Jour</span>
                  </button>
                </div>

                <button
                  onClick={() => exportTeacherTimetableToPdf(entries)}
                  disabled={entries.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
                  <span>PDF enseignant</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3">
            <StatCard icon={faBookOpen} label="Cours" value={uniqueCourses.toString()} />
            <StatCard icon={faLocationDot} label="Salles" value={uniqueRooms.toString()} />
            <StatCard icon={faBell} label="Alertes" value={unreadCount.toString()} />
          </div>

          <div className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto">
            {DAYS_FR.map((day, index) => {
              const count = entries.filter(entry => entry.day_of_week === DAYS_EN[index]).length;
              return (
                <button
                  key={day}
                  onClick={() => {
                    setView(view === 'day' && dayIdx === index ? 'week' : 'day');
                    setDayIdx(index);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    view === 'day' && dayIdx === index
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-main)]'
                      : 'border-[var(--border-soft)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <span>{day}</span>
                  <span className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 text-[9px] text-[var(--accent)]">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 shadow-sm">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-soft)] border-t-[var(--accent)]" />
              </div>
            ) : view === 'day' ? (
              <DayAgenda day={DAYS_FR[dayIdx]} entries={dayEntries} />
            ) : (
              <WeekAgenda groups={groupedEntries} />
            )}
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden">
          <Chatbot
            audience="teacher"
            onRefreshTimetable={onRefreshTimetable}
            onRefreshNotifications={onRefreshNotifications}
            onDownloadPdf={() => exportTeacherTimetableToPdf(entries)}
          />
        </aside>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: typeof faBookOpen; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold text-[var(--text-main)]">{value}</p>
    </div>
  );
}

function WeekAgenda({ groups }: { groups: Array<{ dayFr: string; courses: TimetableEntry[] }> }) {
  return (
    <div className="space-y-4">
      {groups.map(group => (
        <section key={group.dayFr}>
          <div className="mb-2 flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--accent)]">{group.dayFr}</h3>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">{group.courses.length} cours</span>
          </div>
          {group.courses.length === 0 ? (
            <p className="text-xs font-medium text-[var(--text-muted)]">Aucun cours publié.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {group.courses.map(entry => <TeacherCourseCard key={entry.id} entry={entry} />)}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function DayAgenda({ day, entries }: { day: string; entries: TimetableEntry[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-[var(--text-main)]">{day}</h3>
      {entries.length === 0 ? (
        <p className="text-xs font-medium text-[var(--text-muted)]">Aucun cours publié ce jour.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => <TeacherCourseCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </section>
  );
}

function TeacherCourseCard({ entry }: { entry: TimetableEntry }) {
  return (
    <article className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] p-3 transition-colors hover:bg-[var(--surface-muted)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-[var(--accent)]">{entry.course_id}</p>
          <h4 className="mt-1 text-xs font-bold leading-tight text-[var(--text-main)]">{entry.course_name}</h4>
        </div>
        <span className="shrink-0 rounded-lg bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-bold text-[var(--accent)]">
          {entry.start_time} - {entry.end_time}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-medium text-[var(--text-muted)]">
        <span>{entry.room}</span>
        <span>{entry.instructor}</span>
      </div>
    </article>
  );
}
