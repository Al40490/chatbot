'use client';

import React, { useState } from 'react';
import { TimetableEntry } from '@/lib/db';
import { exportTimetableToPdf } from '@/lib/pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faClock,
  faDownload,
  faLocationDot,
  faUser
} from '@fortawesome/free-solid-svg-icons';

interface TimetableGridProps {
  entries: TimetableEntry[];
  isLoading: boolean;
}

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DEPT_COLORS: Record<string, string> = {
  GL:   'border-l-[var(--accent)]',
  BD:   'border-l-zinc-500',
  IA:   'border-l-indigo-500',
  RS:   'border-l-sky-500',
  SEC:  'border-l-rose-500',
  WEB:  'border-l-[var(--accent)]',
  RO:   'border-l-amber-500',
  COMP: 'border-l-amber-500',
  ARCH: 'border-l-amber-500',
  SE:   'border-l-[var(--accent)]',
  AG:   'border-l-[var(--accent)]',
  IHM:  'border-l-[var(--accent)]',
  ET:   'border-l-[var(--text-soft)]',
  ANG:  'border-l-[var(--text-soft)]',
};

function getAccent(courseId: string) {
  const prefix = courseId.split('-')[0].toUpperCase();
  return DEPT_COLORS[prefix] || 'border-l-[var(--text-soft)]';
}

export default function TimetableGrid({ entries, isLoading }: TimetableGridProps) {
  const [view, setView] = useState<'day' | 'week'>('week');
  const [dayIdx, setDayIdx] = useState(0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
            <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Mon emploi du temps</h2>
            <p className="text-[10px] text-[var(--text-muted)]">UGANC · Licence 3 Génie Logiciel</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Day / Week toggle */}
          <div className="flex rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] p-0.5">
            {(['day', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  view === v
                    ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {v === 'day' ? 'Jour' : 'Semaine'}
              </button>
            ))}
          </div>

          {/* Export PDF button */}
          <button
            onClick={() => exportTimetableToPdf(entries)}
            disabled={entries.length === 0}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-soft)] border-t-[var(--accent)]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-6 text-center">
          <FontAwesomeIcon icon={faBookOpen} className="mb-3 h-8 w-8 text-[var(--text-soft)]" />
          <p className="text-sm font-medium text-[var(--text-main)]">Aucun cours programmé</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Aucun cours n&apos;est disponible dans l&apos;emploi du temps publié.</p>
        </div>
      ) : view === 'day' ? (
        /* ─── DAY VIEW ─── */
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4">
          <div className="flex shrink-0 items-center justify-between">
            <button onClick={() => setDayIdx(p => (p - 1 + 5) % 5)} className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]">
              <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-semibold text-[var(--text-main)]">{DAYS_FR[dayIdx]}</h3>
            <button onClick={() => setDayIdx(p => (p + 1) % 5)} className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]">
              <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
            </button>
          </div>

          {entries.filter(t => t.day_of_week === DAYS_EN[dayIdx]).length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--text-muted)]">Aucun cours ce jour.</p>
          ) : (
            <div className="custom-scrollbar mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {entries.filter(t => t.day_of_week === DAYS_EN[dayIdx]).map(e => (
                <CourseCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── WEEK VIEW ─── */
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-5">
          {DAYS_EN.map((dayEn, i) => {
            const dayClasses = entries.filter(t => t.day_of_week === dayEn);
            const isToday = new Date().getDay() === i + 1;
            return (
              <div key={dayEn} className={`flex min-h-0 flex-col rounded-xl border bg-[var(--surface)] p-3 shadow-sm transition-colors ${
                isToday ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)]' : 'border-[var(--border-soft)]'
              }`}>
                <div className="mb-2 flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-main)]">{DAYS_FR[i]}</span>
                  {isToday && <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-extrabold text-[var(--accent)]">Auj.</span>}
                </div>

                <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {dayClasses.length === 0 ? (
                    <p className="pt-10 text-center text-[10px] font-medium text-[var(--text-soft)]">—</p>
                  ) : (
                    dayClasses.map(e => (
                      <div key={e.id} className={`group relative rounded-r-md border-l-3 ${getAccent(e.course_id)} py-1.5 pl-2.5 transition-colors hover:bg-[var(--surface-muted)]`}>
                        <p className="text-[9px] font-extrabold uppercase text-[var(--text-soft)]">{e.course_id}</p>
                        <p className="mt-0.5 text-[11px] font-bold leading-tight text-[var(--text-main)]">{e.course_name}</p>
                        <p className="mt-1 text-[10px] font-medium text-[var(--text-muted)]">{e.start_time} – {e.end_time}</p>
                        <p className="text-[10px] font-semibold text-[var(--text-soft)]">{e.room}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Day view course card ─── */
function CourseCard({ entry }: { entry: TimetableEntry }) {
  const accent = getAccent(entry.course_id);
  return (
    <div className={`group flex items-start justify-between rounded-lg border border-[var(--border-soft)] border-l-3 ${accent} p-3 transition-colors hover:bg-[var(--surface-muted)]`}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">{entry.course_id}</span>
          <span className="text-sm font-semibold text-[var(--text-main)]">{entry.course_name}</span>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faClock} className="h-3 w-3" />{entry.start_time} – {entry.end_time}</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />{entry.room}</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faUser} className="h-3 w-3" />{entry.instructor}</span>
        </div>
      </div>
    </div>
  );
}
