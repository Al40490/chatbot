'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Notification } from '@/lib/db';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheck, faCircleInfo, faClock, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: number) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
}

export default function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getAlertIcon = (title: string) => {
    const text = title.toLowerCase();
    if (text.includes('annulation') || text.includes('annulé') || text.includes('❌')) {
      return <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0 text-[var(--danger)]" />;
    }
    if (text.includes('horaire') || text.includes('⏰')) {
      return <FontAwesomeIcon icon={faClock} className="h-4 w-4 shrink-0 text-[var(--warning)]" />;
    }
    return <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4 shrink-0 text-[var(--accent)]" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-2.5 text-[var(--text-muted)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)] focus:outline-none"
        title="Notifications"
      >
        <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-bold text-white ring-2 ring-[var(--surface)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2.5 w-[320px] overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-xl sm:w-[360px]">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[var(--text-main)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent)]">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => onMarkAllAsRead()}
                className="flex items-center space-x-1 text-[10px] font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)]"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          <div className="max-h-[300px] divide-y divide-[var(--border-soft)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-[var(--text-muted)]">
                <FontAwesomeIcon icon={faBell} className="mb-2 h-8 w-8 text-[var(--text-soft)] opacity-50" />
                <p className="text-xs font-semibold">Aucune notification</p>
                <p className="text-[10px] mt-0.5">Votre emploi du temps est à jour.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => notification.is_read === 0 && onMarkAsRead(notification.id)}
                  className={`p-4 text-left transition-all cursor-pointer flex items-start space-x-3 ${
                    notification.is_read === 0 
                      ? 'bg-[var(--accent-soft)] hover:bg-[var(--surface-muted)]' 
                      : 'hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getAlertIcon(notification.title)}
                  </div>

                  <div className="flex-grow space-y-1">
                    <div className="flex items-start justify-between space-x-2">
                      <h4 className={`text-xs font-bold ${
                        notification.is_read === 0 ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'
                      }`}>
                        {notification.title}
                      </h4>
                      {notification.is_read === 0 && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                    <p className="text-[10px] leading-normal text-[var(--text-muted)]">
                      {notification.message}
                    </p>
                    <span className="block text-[8px] text-[var(--text-soft)]">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-2 text-center">
              <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                Historique des modifications de cours (UGANC)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
