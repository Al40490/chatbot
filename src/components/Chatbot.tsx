'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleInfo,
  faClock,
  faExclamationTriangle,
  faMessage,
  faPaperPlane,
  faRotateRight,
  faUser
} from '@fortawesome/free-solid-svg-icons';

interface Course {
  id: string;
  name: string;
  department: string;
  description: string;
  credits: number;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: number;
}

interface TimetableEntry {
  id: number;
  course_id: string;
  course_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
  instructor: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  data?: MessageData;
}

type MessageData =
  | { type: 'courses'; list: Course[] }
  | { type: 'notifications'; list: Notification[] }
  | { type: 'timetable'; list: TimetableEntry[]; day?: string }
  | { type: 'reset' };

interface ChatbotProps {
  onRefreshTimetable: () => void;
  onRefreshNotifications: () => void;
  onDownloadPdf: () => void;
  audience?: 'student' | 'teacher';
}

function formatTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot({ 
  onRefreshTimetable, 
  onRefreshNotifications, 
  onDownloadPdf,
  audience = 'student'
}: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    sender: 'bot',
    text: audience === 'teacher'
      ? `Bienvenue sur MADTIME.\n\nJe peux vous aider à consulter le planning publié de la classe Génie Logiciel, vérifier les alertes et générer le PDF enseignant.\n\nVous pouvez écrire simplement : "planning de lundi", "planning de la semaine", "alertes" ou "export pdf".`
      : `Bienvenue sur MADTIME.\n\nJe peux vous aider à consulter le planning par jour ou par semaine, suivre les alertes de modifications et télécharger l'emploi du temps en PDF.\n\nVous pouvez écrire simplement : "cours de lundi", "planning de la semaine", "alertes" ou "export pdf".`,
    time: formatTime()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const messagesEl = messagesRef.current;
    if (!messagesEl) return;

    messagesEl.scrollTo({
      top: messagesEl.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text, time: formatTime() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, audience })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          sender: 'bot', 
          text: data.text, 
          time: formatTime(),
          data: data.data 
        }]);
        
        if (data.action === 'download_pdf') onDownloadPdf();
        else if (data.action === 'refresh_timetable') onRefreshTimetable();
        else if (data.action === 'refresh_notifications') onRefreshNotifications();
        else if (data.action === 'refresh_all') { onRefreshTimetable(); onRefreshNotifications(); }
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: '⚠️ Erreur de connexion. Réessayez.', time: formatTime() }]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Aujourd’hui', q: "cours d'aujourd'hui" },
    { label: 'Planning semaine', q: 'planning de la semaine' },
    { label: 'Alertes', q: 'alertes de modifications' },
    { label: audience === 'teacher' ? 'PDF enseignant' : 'Export PDF', q: 'export pdf' },
    { label: audience === 'teacher' ? 'Lundi classe' : 'Cours lundi', q: 'cours de lundi' },
  ];

  const normalizedInput = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const contextualActions = (() => {
    if (!normalizedInput.trim()) return quickActions;

    if (/(pdf|export|telecharg|document|imprim)/.test(normalizedInput)) {
      return [
        { label: audience === 'teacher' ? 'PDF enseignant' : 'Télécharger PDF', q: 'export pdf' },
        { label: 'Planning semaine', q: 'planning de la semaine' },
      ];
    }

    if (/(alerte|notif|changement|modif|annulation|rattrapage)/.test(normalizedInput)) {
      return [
        { label: 'Voir alertes', q: 'alertes de modifications' },
        { label: 'Notifications', q: 'notifications' },
      ];
    }

    if (/(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd)/.test(normalizedInput)) {
      return [
        { label: 'Ce jour', q: input },
        { label: 'Aujourd’hui', q: "cours d'aujourd'hui" },
        { label: 'Planning semaine', q: 'planning de la semaine' },
      ];
    }

    if (/(semaine|planning|emploi|horaire|programme|cours)/.test(normalizedInput)) {
      return [
        { label: 'Planning semaine', q: 'planning de la semaine' },
        { label: 'Cours lundi', q: 'cours de lundi' },
        { label: 'Cours demain', q: 'cours de demain' },
      ];
    }

    return quickActions;
  })();

  const renderText = (text: string, sender: Message['sender']) => {
    return text.split('\n').map((line, i) => {
      const cleanLine = line
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/_/g, '')
        .replace(/^###\s*/, '')
        .trimStart();

      return (
        <p key={i} className={`min-h-[0.75rem] ${sender === 'user' ? 'text-white' : 'text-[var(--text-main)]'}`}>
          {cleanLine}
        </p>
      );
    });
  };

  return (
    <div className="assistant-focus flex h-[560px] min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[var(--accent)] bg-[var(--surface)] shadow-[0_18px_45px_color-mix(in_srgb,var(--accent)_18%,transparent)] lg:h-full">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] bg-[linear-gradient(135deg,var(--accent-soft),var(--surface))] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="assistant-focus-icon flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--accent)] bg-[var(--accent)]">
            <FontAwesomeIcon icon={faMessage} className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wide text-[var(--text-main)]">MADTIME</p>
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                Assistant
              </span>
            </div>
            <p className="text-[10px] font-semibold text-[var(--accent)]">Planning · alertes · PDF</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([{ id: 'reset', sender: 'bot', text: 'Discussion réinitialisée. Comment puis-je vous aider ?', time: formatTime() }])}
          className="rounded-lg p-2 text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--accent-hover)]"
          title="Vider la discussion"
        >
          <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2">
        <span className="text-[10px] font-semibold text-[var(--text-main)]">
          {audience === 'teacher' ? 'Posez une question sur le planning de la classe' : 'Posez une question sur votre emploi du temps'}
        </span>
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      </div>

      {/* Messages area */}
      <div ref={messagesRef} className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--surface-muted)] p-4 xl:p-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs border ${
                msg.sender === 'user'
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
            }`}>
              <FontAwesomeIcon icon={msg.sender === 'user' ? faUser : faMessage} className="h-3.5 w-3.5" />
            </div>

            {/* Bubble */}
            <div className="flex max-w-[92%] flex-col space-y-2">
              <div className={`rounded-xl px-4 py-3 text-xs font-medium leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'rounded-tr-sm bg-[var(--accent)] text-white'
                  : 'rounded-tl-sm border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-main)]'
              }`}>
                <div className="space-y-1">{renderText(msg.text, msg.sender)}</div>
                
                <span className={`mt-2 block text-right text-[9px] ${
                  msg.sender === 'user' ? 'text-white/80' : 'text-[var(--accent)]'
                }`}>{msg.time}</span>
              </div>

              {/* Structured interactive data rendering */}
              {msg.sender === 'bot' && msg.data && (
                <div className="w-full mt-1.5 animate-pop-in">
                  {msg.data.type === 'courses' && msg.data.list && (
                    <InteractiveCoursesList 
                      courses={msg.data.list} 
                    />
                  )}

                  {msg.data.type === 'notifications' && msg.data.list && (
                    <InteractiveNotificationsList 
                      notifications={msg.data.list}
                      onRefresh={onRefreshNotifications}
                    />
                  )}

                  {msg.data.type === 'timetable' && msg.data.list && (
                    <InteractiveTimetableList
                      entries={msg.data.list}
                      day={msg.data.day}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] shadow-sm">
              <FontAwesomeIcon icon={faMessage} className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3.5 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent)]" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions slider */}
      <div className="scrollbar-none flex shrink-0 gap-2 overflow-x-auto border-t border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2">
        {contextualActions.map(a => (
          <button
            key={a.label}
            onClick={() => send(a.q)}
            className="shrink-0 cursor-pointer rounded-md border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-1.5 text-[10px] font-semibold text-[var(--text-main)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--accent-soft)]"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form 
        onSubmit={e => { e.preventDefault(); send(input); }} 
        className="flex shrink-0 items-center gap-2.5 border-t border-[var(--border-soft)] bg-[var(--surface)] p-4"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={audience === 'teacher' ? 'Ex. planning lundi, alertes, export pdf...' : 'Ex. cours de lundi, liste des cours, export pdf...'}
          className="flex-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--text-main)] outline-none transition-all placeholder:font-medium placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent)] text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

const DAY_LABELS: Record<string, string> = {
  Monday: 'Lundi',
  Tuesday: 'Mardi',
  Wednesday: 'Mercredi',
  Thursday: 'Jeudi',
  Friday: 'Vendredi',
  Saturday: 'Samedi',
  Sunday: 'Dimanche'
};

function InteractiveTimetableList({ entries, day }: { entries: TimetableEntry[]; day?: string }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-[10px] font-semibold text-[var(--text-main)] shadow-sm">
        Aucun cours publié pour cette demande.
      </div>
    );
  }

  const groups = entries.reduce<Record<string, TimetableEntry[]>>((acc, entry) => {
    const key = entry.day_of_week;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  return (
    <div className="custom-scrollbar max-h-[340px] space-y-2 overflow-y-auto p-1">
      {Object.entries(groups).map(([dayEn, dayEntries]) => (
        <div key={dayEn} className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)]">
              {day || DAY_LABELS[dayEn] || dayEn}
            </span>
            <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-bold text-[var(--accent)]">
              {dayEntries.length} cours
            </span>
          </div>

          <div className="space-y-2">
            {dayEntries.map(entry => (
              <div key={entry.id} className="border-l-3 border-l-[var(--accent)] py-1 pl-2.5">
                <p className="text-[9px] font-bold uppercase text-[var(--accent)]">
                  {entry.start_time} - {entry.end_time} · {entry.course_id}
                </p>
                <p className="mt-0.5 text-[11px] font-bold leading-tight text-[var(--text-main)]">
                  {entry.course_name}
                </p>
                <p className="mt-1 text-[10px] font-medium text-[var(--text-main)]">
                  {entry.room} · {entry.instructor}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: InteractiveCoursesList
   ───────────────────────────────────────────────────────────────────────────── */
interface InteractiveCoursesListProps {
  courses: Course[];
}

function InteractiveCoursesList({ courses }: InteractiveCoursesListProps) {
  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
      {courses.map(course => {
        return (
          <div 
            key={course.id}
            className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-left shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="rounded border border-[var(--border-soft)] bg-[var(--surface-muted)] px-2 py-0.5 text-[9px] font-extrabold text-[var(--text-main)]">
                {course.id}
              </span>
              <span className="text-[9px] font-bold text-[var(--accent)]">
                {course.credits} Cr.
              </span>
            </div>

            <h4 className="mt-1.5 text-xs font-bold leading-snug text-[var(--text-main)]">
              {course.name}
            </h4>
            <p className="mt-1 line-clamp-2 text-[10px] text-[var(--text-main)]">
              {course.description}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-[var(--border-soft)] pt-2">
              <span className="text-[9px] font-semibold text-[var(--accent)]">{course.department}</span>
              
              <span className="text-[9px] font-semibold text-[var(--text-main)]">{course.credits} crédits</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENT: InteractiveNotificationsList
   ───────────────────────────────────────────────────────────────────────────── */
interface InteractiveNotificationsListProps {
  notifications: Notification[];
  onRefresh: () => void;
}

function InteractiveNotificationsList({ notifications, onRefresh }: InteractiveNotificationsListProps) {
  
  const handleRead = async (id: number) => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) onRefresh();
  };

  const getIcon = (title: string) => {
    const text = title.toLowerCase();
    if (text.includes('annulation') || text.includes('annulé')) {
      return <FontAwesomeIcon icon={faExclamationTriangle} className="h-3.5 w-3.5 text-[var(--danger)]" />;
    }
    if (text.includes('horaire')) {
      return <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-[var(--warning)]" />;
    }
    return <FontAwesomeIcon icon={faCircleInfo} className="h-3.5 w-3.5 text-[var(--accent)]" />;
  };

  return (
    <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
      {notifications.map(n => (
        <div 
          key={n.id}
          onClick={() => n.is_read === 0 && handleRead(n.id)}
          className={`flex gap-2.5 rounded-xl border bg-[var(--accent-soft)] p-3 text-left shadow-sm transition-all ${
            n.is_read === 0 
              ? 'cursor-pointer border-[var(--accent)] hover:bg-[var(--accent-soft)]'
              : 'border-[var(--accent)]'
          }`}
        >
          <div className="mt-0.5 shrink-0">{getIcon(n.title)}</div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-main)]">
                {n.title}
              </span>
              {n.is_read === 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />}
            </div>
            <p className="text-[9px] font-medium leading-normal text-[var(--text-main)]">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
