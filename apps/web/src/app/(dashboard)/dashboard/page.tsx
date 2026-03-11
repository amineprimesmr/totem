'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, organisationApi, type OrganisationStats } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

interface Kpis {
  candidatesSearching: number;
  candidatesSigned: number;
  offersActive: number;
  matchesInProcess: number;
  companiesCount: number;
  signedThisMonth: number;
}

interface RoleKpis {
  candidatesCount?: number;
  companiesCount?: number;
  offersActive?: number;
  searching?: number;
  matchesInProcess: number;
  signedThisMonth: number;
}

interface FunnelStep {
  step: string;
  value: number;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [roleKpis, setRoleKpis] = useState<RoleKpis | null>(null);
  const [orgStats, setOrgStats] = useState<OrganisationStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadDemoData = async () => {
    setLoadingDemo(true);
    try {
      const res = await api<{ message: string; created: Record<string, number> }>('/demo/load', {
        method: 'POST',
      });
      toast.success(res.message);
      setLoading(true);
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors du chargement des données d'exemple";
      toast.error(msg);
    } finally {
      setLoadingDemo(false);
    }
  };

  useEffect(() => {
    const role = user?.role;
    setRoleKpis(null);
    setKpis(null);
    const promises: Promise<unknown>[] = [api<FunnelStep[]>('/dashboard/funnel')];

    if (role === 'COMMERCIAL') {
      promises.push(api<RoleKpis>('/dashboard/kpis/commercial').then(setRoleKpis));
    } else if (role === 'ADMISSION') {
      promises.push(api<RoleKpis>('/dashboard/kpis/admission').then(setRoleKpis));
    } else {
      promises.push(api<Kpis>('/dashboard/kpis').then(setKpis));
    }
    if (role === 'ADMIN') {
      promises.push(organisationApi.getStats().then(setOrgStats));
    }

    Promise.all(promises)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-[14px] animate-pulse border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const role = user?.role;
  const cards =
    role === 'COMMERCIAL' && roleKpis
      ? [
          { label: 'Mes entreprises', value: roleKpis.companiesCount ?? 0 },
          { label: 'Offres actives', value: roleKpis.offersActive ?? 0 },
          { label: 'Matchs en cours', value: roleKpis.matchesInProcess },
          { label: 'Signés ce mois', value: roleKpis.signedThisMonth },
        ]
      : role === 'ADMISSION' && roleKpis
        ? [
            { label: 'Mes candidats', value: roleKpis.candidatesCount ?? 0 },
            { label: 'En recherche', value: roleKpis.searching ?? 0 },
            { label: 'Matchs en cours', value: roleKpis.matchesInProcess },
            { label: 'Signés ce mois', value: roleKpis.signedThisMonth },
          ]
        : kpis
          ? [
              { label: 'Candidats en recherche', value: kpis.candidatesSearching },
              { label: 'Offres actives', value: kpis.offersActive },
              { label: 'Matchs en cours', value: kpis.matchesInProcess },
              { label: 'Signés ce mois', value: kpis.signedThisMonth },
              { label: 'Entreprises', value: kpis.companiesCount },
            ]
          : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
          <p className="text-sm text-slate-500 mt-1">Vos chiffres et indicateurs clés</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={loadDemoData}
            disabled={loadingDemo}
            className="px-4 py-2.5 rounded-xl font-medium bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loadingDemo ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-totem-accent border-t-transparent rounded-full animate-spin" />
                Chargement…
              </>
            ) : (
              <>Charger des données d&apos;exemple</>
            )}
          </button>
        )}
      </div>

      {/* Stats cards — style Fidelity app */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-[14px] border border-slate-200 p-5 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-extrabold text-totem-accent mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Shortcuts — style Fidelity */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/candidates"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Voir les candidats
        </Link>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          </svg>
          Voir les entreprises
        </Link>
        <Link
          href="/dashboard/offers"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          Voir les offres
        </Link>
        <Link
          href="/dashboard/map"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ouvrir la carte
        </Link>
        {user?.role === 'ADMIN' && (
          <Link
            href="/dashboard/organisation"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
            Organisation
          </Link>
        )}
      </div>

      {user?.role === 'ADMIN' && orgStats && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-[14px] border border-slate-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Organisation</h2>
            <Link href="/dashboard/organisation" className="text-sm font-medium text-totem-accent hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Formations actives</p>
              <p className="text-xl font-bold text-totem-accent">{orgStats.formationsCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Promotions</p>
              <p className="text-xl font-bold text-totem-accent">{orgStats.promotionsCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Conventions signées ce mois</p>
              <p className="text-xl font-bold text-totem-accent">{orgStats.conventionsSignedThisMonth}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Conventions (brouillon / envoyées)</p>
              <p className="text-xl font-bold text-slate-700">
                {(orgStats.conventionsByStatus?.DRAFT ?? 0) + (orgStats.conventionsByStatus?.SENT ?? 0)}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {/* Funnel — style Fidelity card */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[14px] border border-slate-200 p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4">Funnel candidats</h2>
        <div className="flex flex-wrap gap-4">
          {funnel.map((step) => (
            <div
              key={step.step}
              className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200"
            >
              <span className="text-sm font-medium text-slate-700">{step.step}</span>
              <span className="text-lg font-bold text-totem-accent">{step.value}</span>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
