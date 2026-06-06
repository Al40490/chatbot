'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChalkboardUser,
  faGraduationCap,
  faIdCard,
  faLock,
  faRightToBracket,
  faUserGraduate
} from '@fortawesome/free-solid-svg-icons';

export type UserRole = 'student' | 'teacher';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [role, setRole] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      onLogin(role);
    }, 450);
  };

  return (
    <main className="h-svh overflow-hidden bg-[var(--app-bg)] p-2 text-[var(--text-main)] sm:p-4 lg:p-6">
      <div className="mx-auto grid h-full max-w-6xl grid-rows-[minmax(150px,32svh)_1fr] overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface)] shadow-[var(--shadow-soft)] lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-1">
        <section className="login-image-panel relative min-h-0 overflow-hidden">
          <Image
            src="/uganc-campus.jpg"
            alt="Façade de l'Université Gamal Abdel Nasser de Conakry"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8">
            <div className="max-w-lg translate-y-0 text-white">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-semibold backdrop-blur-sm sm:mb-4 sm:text-[11px]">
                <FontAwesomeIcon icon={faGraduationCap} className="h-3.5 w-3.5" />
                <span>Université Gamal Abdel Nasser de Conakry</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">MADTIME</h1>
              <p className="mt-1 hidden max-w-md text-sm leading-6 text-white/90 sm:block">
                Accès aux emplois du temps publiés, notifications académiques et informations de cours.
              </p>
            </div>
          </div>
        </section>

        <section className="login-form-panel flex min-h-0 items-center justify-center px-5 py-4 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-4 sm:mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Connexion</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)] sm:mt-2 sm:text-2xl">
                Accéder à MADTIME
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)] sm:mt-2 sm:text-sm sm:leading-6">
                Sélectionnez votre profil, puis renseignez vos identifiants universitaires.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface-muted)] p-1">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:py-2.5 ${
                    role === 'student'
                      ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <FontAwesomeIcon icon={faUserGraduate} className="h-3.5 w-3.5" />
                  <span>Élève</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:py-2.5 ${
                    role === 'teacher'
                      ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <FontAwesomeIcon icon={faChalkboardUser} className="h-3.5 w-3.5" />
                  <span>Professeur</span>
                </button>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--text-main)]">
                  Identifiant
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-2 transition-colors focus-within:border-[var(--accent)] sm:py-2.5">
                  <FontAwesomeIcon icon={faIdCard} className="h-4 w-4 text-[var(--text-soft)]" />
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={role === 'student' ? 'Matricule étudiant' : 'Identifiant professeur'}
                    className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)]"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--text-main)]">
                  Mot de passe
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-raised)] px-3 py-2 transition-colors focus-within:border-[var(--accent)] sm:py-2.5">
                  <FontAwesomeIcon icon={faLock} className="h-4 w-4 text-[var(--text-soft)]" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Mot de passe"
                    className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-soft)]"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-button flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
              >
                <FontAwesomeIcon icon={faRightToBracket} className="h-4 w-4" />
                <span>{isSubmitting ? 'Connexion...' : 'Se connecter'}</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
