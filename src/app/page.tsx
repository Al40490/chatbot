'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { TimetableEntry, Notification } from '@/lib/db';
import { exportTimetableToPdf } from '@/lib/pdf';
import TimetableGrid from '@/components/TimetableGrid';
import Chatbot from '@/components/Chatbot';
import LoginScreen, { UserRole } from '@/components/LoginScreen';
import NotificationCenter from '@/components/NotificationCenter';
import TeacherDashboard from '@/components/TeacherDashboard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBookOpen,
  faClock,
  faDoorOpen,
  faGraduationCap,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

export default function Home() {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const fetchTimetable = useCallback(async () => {
    setIsLoadingTimetable(true);
    try {
      const res = await fetch('/api/timetable');
      if (res.ok) setTimetableEntries(await res.json());
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setIsLoadingTimetable(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedRole = localStorage.getItem('madtime_role');
      setRole(savedRole === 'student' || savedRole === 'teacher' ? savedRole : null);
      setIsAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTimetable();
      fetchNotifications();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchTimetable, fetchNotifications]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleMarkAsRead = async (id: number) => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    });
    if (res.ok) fetchNotifications();
  };

  const handleDownloadPdf = () => exportTimetableToPdf(timetableEntries);

  const handleLogin = (nextRole: UserRole) => {
    localStorage.setItem('madtime_role', nextRole);
    setRole(nextRole);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('madtime_role');
    setRole(null);
  };

  const uniqueCourses = Array.from(new Set(timetableEntries.map(e => e.course_id)));

  const totalHours = (() => {
    let mins = 0;
    timetableEntries.forEach(e => {
      const [sh, sm] = e.start_time.split(':').map(Number);
      const [eh, em] = e.end_time.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) mins += diff;
    });
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  })();

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (!isAuthReady) {
    return (
      <div className="flex h-svh items-center justify-center bg-[var(--app-bg)] text-[var(--text-main)]">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] px-5 py-4 shadow-sm">
          <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--accent)]" />
          <span className="text-sm font-semibold">Chargement de MADTIME...</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (role === 'teacher') {
    return (
      <>
        <TeacherDashboard
          entries={timetableEntries}
          notifications={notifications}
          isLoading={isLoadingTimetable}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onLogout={() => setShowLogoutConfirm(true)}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onRefreshTimetable={fetchTimetable}
          onRefreshNotifications={fetchNotifications}
        />

        {showLogoutConfirm && (
          <LogoutConfirmModal
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--text-main)] transition-colors duration-300">
      {/* ─── NAVBAR ─── */}
      <header className="z-40 shrink-0 border-b border-[var(--border-soft)] bg-[var(--surface)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)] shadow-sm">
              <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-[var(--text-main)]">
                MADTIME
              </h1>
              <p className="text-[10px] font-medium leading-tight text-[var(--text-muted)]">
                Emploi du temps · UGANC
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            {/* Profile chip — desktop only */}
            <div className="hidden items-center gap-2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1.5 md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent)]">
                MD
              </div>
              <div>
                <p className="text-[10px] font-semibold leading-tight text-[var(--text-main)]">Mamadou Diallo</p>
                <p className="text-[9px] font-medium leading-tight text-[var(--text-muted)]">L3 Génie Logiciel</p>
              </div>
            </div>

            <NotificationCenter 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--text-muted)] shadow-xs transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              <FontAwesomeIcon icon={isDark ? faSun : faMoon} className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="hidden h-10 items-center gap-2 rounded-lg border border-[var(--border-soft)] px-3 text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)] sm:flex"
              title="Déconnexion"
            >
              <FontAwesomeIcon icon={faDoorOpen} className="h-3.5 w-3.5" />
              <span>Sortir</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 grid-cols-1 gap-4 overflow-hidden px-4 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          {/* Mobile profile & stats bar */}
          <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-3 shadow-xs md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent)]">
                MD
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--text-main)]">Mamadou Diallo</p>
                <p className="text-[10px] text-[var(--text-muted)]">Licence 3 Génie Logiciel · UGANC</p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-soft)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)] sm:hidden"
                title="Déconnexion"
              >
                <FontAwesomeIcon icon={faDoorOpen} className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Minimalist Stats Pill Row */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 text-[10px] font-semibold shadow-xs">
              <span className="flex items-center gap-1.5 text-[var(--text-main)]">
                <FontAwesomeIcon icon={faBookOpen} className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{uniqueCourses.length} Matières</span>
              </span>
              <span className="text-[var(--border-strong)]">|</span>
              <span className="flex items-center gap-1.5 text-[var(--text-main)]">
                <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{totalHours} / semaine</span>
              </span>
              <span className="text-[var(--border-strong)]">|</span>
              <span className="flex items-center gap-1.5 text-[var(--text-main)]">
                <FontAwesomeIcon icon={faBell} className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span>{unreadCount} Alertes non lues</span>
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <TimetableGrid 
              entries={timetableEntries}
              isLoading={isLoadingTimetable}
            />
          </div>
        </section>

        <aside className="min-h-0 overflow-hidden">
          <Chatbot
            onRefreshTimetable={fetchTimetable}
            onRefreshNotifications={fetchNotifications}
            onDownloadPdf={handleDownloadPdf}
          />
        </aside>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="animate-pop-in w-full max-w-sm rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <FontAwesomeIcon icon={faDoorOpen} className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-main)]">
                  Confirmer la déconnexion
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  Voulez-vous vraiment quitter votre session MADTIME ?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]"
              >
                Annuler
              </button>
              <button
                onClick={confirmLogout}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogoutConfirmModal({
  onCancel,
  onConfirm
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <FontAwesomeIcon icon={faDoorOpen} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">
              Confirmer la déconnexion
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Voulez-vous vraiment quitter votre session MADTIME ?
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--border-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
