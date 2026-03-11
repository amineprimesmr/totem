'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { organisationApi, type Formation, type Promotion, type Convention } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import toast from 'react-hot-toast';

const CONVENTION_STATUS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  SIGNED: 'Signée',
  CANCELLED: 'Annulée',
};

type Tab = 'formations' | 'promotions' | 'conventions';

export default function OrganisationPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('formations');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [stats, setStats] = useState<{ formationsCount: number; promotionsCount: number; conventionsByStatus: Record<string, number>; conventionsSignedThisMonth: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [formationIdFilter, setFormationIdFilter] = useState('');
  const [conventionStatusFilter, setConventionStatusFilter] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  const load = () => {
    setLoading(true);
    const promises: Promise<unknown>[] = [
      organisationApi.getFormations().then(setFormations),
      organisationApi.getPromotions().then(setPromotions),
      organisationApi.getConventions().then(setConventions),
      organisationApi.getStats().then(setStats),
    ];
    Promise.all(promises).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const promotionsFiltered = formationIdFilter
    ? promotions.filter((p) => p.formationId === formationIdFilter)
    : promotions;
  const conventionsFiltered = conventionStatusFilter
    ? conventions.filter((c) => c.status === conventionStatusFilter)
    : conventions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organisation</h1>
        <p className="text-sm text-slate-500 mt-1">Formations, promotions et conventions</p>
      </div>

      {/* Stats rapides */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Formations</p>
            <p className="text-xl font-bold text-totem-accent">{stats.formationsCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Promotions</p>
            <p className="text-xl font-bold text-totem-accent">{stats.promotionsCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Conventions signées ce mois</p>
            <p className="text-xl font-bold text-totem-accent">{stats.conventionsSignedThisMonth}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Par statut</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(stats.conventionsByStatus).map(([s, n]) => (
                <span key={s} className="text-xs font-medium text-slate-600">
                  {CONVENTION_STATUS[s] ?? s}: {n}
                </span>
              ))}
              {Object.keys(stats.conventionsByStatus).length === 0 && (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['formations', 'promotions', 'conventions'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition ${
              tab === t ? 'bg-white border border-slate-200 border-b-0 -mb-px text-totem-accent' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {t === 'formations' && 'Formations'}
            {t === 'promotions' && 'Promotions'}
            {t === 'conventions' && 'Conventions'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-[14px] border border-slate-200 p-8">
          <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="mt-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {tab === 'formations' && (
            <FormationsTab formations={formations} isAdmin={isAdmin} onRefresh={load} />
          )}
          {tab === 'promotions' && (
            <PromotionsTab
              promotions={promotionsFiltered}
              formations={formations}
              formationIdFilter={formationIdFilter}
              setFormationIdFilter={setFormationIdFilter}
              isAdmin={isAdmin}
              onRefresh={load}
            />
          )}
          {tab === 'conventions' && (
            <ConventionsTab
              conventions={conventionsFiltered}
              statusFilter={conventionStatusFilter}
              setStatusFilter={setConventionStatusFilter}
              onRefresh={load}
            />
          )}
        </>
      )}
    </div>
  );
}

function FormationsTab({
  formations,
  isAdmin,
  onRefresh,
}: {
  formations: Formation[];
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [contractType, setContractType] = useState('APPRENTICESHIP');
  const [durationMonths, setDurationMonths] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await organisationApi.createFormation({
        name: name.trim(),
        level: level.trim() || undefined,
        contractType,
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : undefined,
      });
      toast.success('Formation créée');
      setName('');
      setLevel('');
      setDurationMonths('');
      setCreating(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
      {isAdmin && (
        <div className="p-4 border-b border-slate-200 flex justify-end">
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-xl bg-totem-accent text-white text-sm font-medium hover:bg-totem-accent-hover"
            >
              Nouvelle formation
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom formation"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                required
              />
              <input
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Niveau (ex. Bac+2)"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-28"
              />
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="APPRENTICESHIP">Apprentissage</option>
                <option value="PROFESSIONAL">Pro</option>
              </select>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                placeholder="Durée (mois)"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-24"
              />
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-totem-accent text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Création…' : 'Créer'}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm">
                Annuler
              </button>
            </form>
          )}
        </div>
      )}
      <ul className="divide-y divide-slate-200">
        {formations.map((f) => (
          <li key={f.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{f.name}</p>
              <p className="text-sm text-slate-500">
                {f.level ?? '—'} • {f.contractType === 'APPRENTICESHIP' ? 'Apprentissage' : 'Pro'}
                {f.durationMonths != null && ` • ${f.durationMonths} mois`}
              </p>
            </div>
            <span className="text-sm text-slate-500">{f._count?.promotions ?? 0} promotion(s)</span>
          </li>
        ))}
      </ul>
      {formations.length === 0 && <p className="p-8 text-center text-slate-500">Aucune formation</p>}
    </div>
  );
}

function PromotionsTab({
  promotions,
  formations,
  formationIdFilter,
  setFormationIdFilter,
  isAdmin,
  onRefresh,
}: {
  promotions: Promotion[];
  formations: Formation[];
  formationIdFilter: string;
  setFormationIdFilter: (v: string) => void;
  isAdmin: boolean;
  onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [formationId, setFormationId] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formationId || !name.trim()) return;
    setSaving(true);
    try {
      await organisationApi.createPromotion({ formationId, name: name.trim(), year });
      toast.success('Promotion créée');
      setFormationId('');
      setName('');
      setCreating(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
        <select
          value={formationIdFilter}
          onChange={(e) => setFormationIdFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="">Toutes les formations</option>
          {formations.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        {isAdmin && (
          !creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-xl bg-totem-accent text-white text-sm font-medium hover:bg-totem-accent-hover"
            >
              Nouvelle promotion
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <select
                value={formationId}
                onChange={(e) => setFormationId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                required
              >
                <option value="">Formation</option>
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom (ex. Promo 2024)"
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                required
              />
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-20"
              />
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-totem-accent text-white text-sm font-medium disabled:opacity-60">
                {saving ? 'Création…' : 'Créer'}
              </button>
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl border border-slate-300 text-sm">
                Annuler
              </button>
            </form>
          )
        )}
      </div>
      <ul className="divide-y divide-slate-200">
        {promotions.map((p) => (
          <li key={p.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{p.name}</p>
              <p className="text-sm text-slate-500">
                {p.formation?.name ?? p.formationId} • {p.year}
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {p._count?.candidates ?? 0} candidat(s) • {p._count?.conventions ?? 0} convention(s)
            </span>
          </li>
        ))}
      </ul>
      {promotions.length === 0 && <p className="p-8 text-center text-slate-500">Aucune promotion</p>}
    </div>
  );
}

function ConventionsTab({
  conventions,
  statusFilter,
  setStatusFilter,
  onRefresh,
}: {
  conventions: Convention[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(CONVENTION_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <ul className="divide-y divide-slate-200">
        {conventions.map((c) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">
                {c.candidate ? `${c.candidate.firstName} ${c.candidate.lastName}` : c.candidateId}
                {' → '}
                {c.company?.name ?? c.companyId}
              </p>
              <p className="text-sm text-slate-500">
                {c.offer?.title ?? c.offerId}
                {c.promotion && ` • ${c.promotion.name} ${c.promotion.year}`}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
              c.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
              c.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
              c.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
            }`}>
              {CONVENTION_STATUS[c.status] ?? c.status}
            </span>
          </motion.li>
        ))}
      </ul>
      {conventions.length === 0 && <p className="p-8 text-center text-slate-500">Aucune convention</p>}
    </div>
  );
}
