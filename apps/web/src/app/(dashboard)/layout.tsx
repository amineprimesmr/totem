'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { motion } from 'framer-motion';
import { NotificationsBell } from '@/components/NotificationsBell';
import { BrandLogo } from '@/components/BrandLogo';
import { api, type AuthUser } from '@/lib/api';

const SCHOOL_ROLES = ['ADMIN', 'COMMERCIAL', 'ADMISSION'];

const schoolNav = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: 'grid' },
  { href: '/dashboard/candidates', label: 'Candidats', icon: 'users' },
  { href: '/dashboard/companies', label: 'Entreprises', icon: 'building' },
  { href: '/dashboard/offers', label: 'Offres', icon: 'briefcase' },
  { href: '/dashboard/organisation', label: 'Organisation', icon: 'school' },
  { href: '/dashboard/schooling', label: 'Scolarité', icon: 'calendar' },
  { href: '/dashboard/migration', label: 'Migration Galia', icon: 'upload' },
  { href: '/dashboard/map', label: 'Carte', icon: 'map' },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: 'user-cog' },
];

const iconSvg = (icon: string) => {
  switch (icon) {
    case 'grid':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'building':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case 'map':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'school':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'upload':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    case 'user-cog':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setAuth } = useAuthStore();

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      if (typeof window === 'undefined') return;
      if (user) {
        setHasCheckedAuth(true);
        return;
      }
      const token = localStorage.getItem('totem_token');
      if (!token) {
        setHasCheckedAuth(true);
        return;
      }

      try {
        setIsRestoringSession(true);
        const me = await api<AuthUser>('/users/me');
        if (cancelled) return;
        setAuth(me, token);
      } catch {
        if (cancelled) return;
        localStorage.removeItem('totem_token');
        setAuth(null, null);
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
          setHasCheckedAuth(true);
        }
      }
    };

    bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, [user, setAuth]);

  useEffect(() => {
    if (!hasCheckedAuth || isRestoringSession) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    // Candidat : accès uniquement à /candidat/*
    if (pathname.startsWith('/candidat')) {
      if (user.role !== 'CANDIDATE') router.replace('/dashboard');
      return;
    }
    // Entreprise : accès uniquement à /entreprise/*
    if (pathname.startsWith('/entreprise')) {
      if (user.role !== 'COMPANY') router.replace('/dashboard');
      return;
    }
    // Dashboard école : accès réservé aux rôles staff
    if (pathname.startsWith('/dashboard') && !SCHOOL_ROLES.includes(user.role)) {
      if (user.role === 'CANDIDATE') router.replace('/candidat');
      else if (user.role === 'COMPANY') router.replace('/entreprise');
      else router.replace('/login');
    }
  }, [user, pathname, router, hasCheckedAuth, isRestoringSession]);

  if (!hasCheckedAuth || isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="h-8 w-48 bg-[#2a2a2a] rounded-xl animate-pulse" />
      </div>
    );
  }
  if (!user) return null;

  const isCandidat = user.role === 'CANDIDATE';
  const candidatNav = [
    { href: '/candidat', label: 'Offres & Candidatures', icon: 'briefcase' },
    { href: '/candidat/profil', label: 'Mon profil', icon: 'users' },
    { href: '/candidat/emploi-du-temps', label: 'Emploi du temps', icon: 'calendar' },
    { href: '/candidat/notes', label: 'Mes notes', icon: 'grid' },
    { href: '/candidat/absences', label: 'Mes absences', icon: 'users' },
    { href: '/candidat/documents', label: 'Mes documents', icon: 'briefcase' },
  ];
  const nav = isCandidat
    ? candidatNav
    : SCHOOL_ROLES.includes(user.role)
      ? schoolNav.filter(
          (item) =>
            (item.href !== '/dashboard/users' && item.href !== '/dashboard/migration') || user.role === 'ADMIN',
        )
      : [];

  return (
    <div className="min-h-screen flex bg-black font-outfit">
      {/* Sidebar — style Fidelity app (fond noir) */}
      <aside className="w-[272px] min-w-[272px] bg-black border-r border-white/10 flex flex-col fixed top-0 left-0 bottom-0 z-[90]">
        <div className="p-5 border-b border-white/10">
          <Link
            href={isCandidat ? '/candidat' : '/dashboard'}
            aria-label="Totem"
            className="no-underline flex items-center"
          >
            <BrandLogo width={170} height={46} className="h-auto w-auto max-h-11" />
          </Link>
          <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white/55">
            {isCandidat ? 'Espace apprenant' : 'Tableau de bord interne'}
          </p>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {nav.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && item.href !== '/candidat' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-[10px] mb-0.5 text-[0.8125rem] font-medium transition-all relative ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-white/55 hover:bg-white/5 hover:text-white/90'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[56%] min-h-[20px] bg-totem-accent rounded-r"
                    aria-hidden
                  />
                )}
                <span className="flex-shrink-0 opacity-85">{iconSvg(item.icon)}</span>
                <span className="flex-1 min-w-0">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[0.7rem] text-white/55 mb-2 break-all">{user.email}</p>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2.5 px-3.5 text-[0.8rem] font-medium text-white/55 bg-white/5 border border-white/10 rounded-[10px] cursor-pointer hover:bg-white/10 hover:text-white/90 transition-all"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[272px] min-h-screen bg-black p-3 md:p-4">
        <div className="flex min-h-[calc(100vh-1.5rem)] md:min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#f7f8fa] shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
          {(SCHOOL_ROLES.includes(user.role) || isCandidat) && (
            <header className="flex items-center justify-end gap-2 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
              <NotificationsBell />
            </header>
          )}
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="p-6 md:p-8 flex-1 bg-[#f7f8fa]"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
