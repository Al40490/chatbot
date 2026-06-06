'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faClock,
  faLocationDot,
  faPlay,
  faRotateRight,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

interface SimulationPanelProps {
  onSimulationTriggered: () => void;
  onClose?: () => void;
}

export default function SimulationPanel({ onSimulationTriggered, onClose }: SimulationPanelProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerSimulation = async (type: 'cancellation' | 'room_change' | 'time_change' | 'reset', courseId?: string, param?: string) => {
    const key = courseId ? `${type}-${courseId}` : type;
    setLoadingType(key);
    setToastMessage(null);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'reset' ? 'reset' : 'simulate',
          type,
          courseId,
          param
        })
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage(
          type === 'reset' 
            ? '🔄 Données réinitialisées avec succès !' 
            : `📢 Simulation activée : ${data.title}`
        );
        onSimulationTriggered();
        
        setTimeout(() => {
          setToastMessage(null);
        }, 4000);
      } else {
        throw new Error(data.error || 'Simulation trigger failed');
      }
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'La simulation a échoué';
      setToastMessage(`⚠️ Erreur : ${message}`);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 rounded-lg">
            <FontAwesomeIcon icon={faPlay} className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)]">Simulateur de Changements</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Modifiez la base de données en temps réel</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-all hover:scale-105 hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)] active:scale-95"
            title="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-xs font-bold text-[var(--text-main)]">Commandes de Test</span>
        <button
          onClick={() => triggerSimulation('reset')}
          disabled={loadingType !== null}
          className="flex items-center space-x-1 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1.5 text-[10px] font-bold text-[var(--text-main)] transition-all hover:bg-[var(--accent-soft)] disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faRotateRight} className="h-3.5 w-3.5" />
          <span>Réinitialiser tout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => triggerSimulation('cancellation', 'GL-301')}
          disabled={loadingType !== null}
          className="group flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] p-3.5 text-left transition-all hover:border-[var(--danger)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-lg group-hover:scale-105 transition-all">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[var(--text-main)]">Annuler GL-301</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Lundi 08:30 (Nelson Mandela)</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Simuler</span>
        </button>

        <button
          onClick={() => triggerSimulation('room_change', 'BD-303', 'Salle 405 (Bâtiment Principal)')}
          disabled={loadingType !== null}
          className="group flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] p-3.5 text-left transition-all hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 rounded-lg group-hover:scale-105 transition-all">
              <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[var(--text-main)]">Déplacer BD-303</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Salle 202 ➔ Salle 405</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Simuler</span>
        </button>

        <button
          onClick={() => triggerSimulation('time_change', 'IA-304', '16:00-17:30')}
          disabled={loadingType !== null}
          className="group flex items-center justify-between rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] p-3.5 text-left transition-all hover:border-[var(--warning)] hover:bg-[var(--surface-muted)] disabled:opacity-50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg group-hover:scale-105 transition-all">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-[11px] font-bold text-[var(--text-main)]">Décaler IA-304</span>
              <span className="block text-[9px] text-[var(--text-muted)]">Mercredi 08:30 ➔ 16:00</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Simuler</span>
        </button>
      </div>

      {toastMessage && (
        <div className="animate-in fade-in slide-in-from-bottom-2 flex items-center space-x-2 rounded-xl border border-[var(--border-soft)] bg-[var(--text-main)] p-3 text-xs text-[var(--surface)] shadow-lg duration-300">
          <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 shrink-0 text-[var(--accent)]" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
