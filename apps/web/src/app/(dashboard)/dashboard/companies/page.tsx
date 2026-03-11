'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, downloadExport } from '@/lib/api';
import { LABELS } from '@/lib/labels';

interface Company {
  id: string;
  name: string;
  sector: string;
  city: string;
  status: string;
  _count: { offers: number };
}

export default function CompaniesPage() {
  const [list, setList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = () => {
    setExporting(true);
    const params = new URLSearchParams();
    params.set('format', 'csv');
    if (filter) params.set('status', filter);
    downloadExport(`/companies/export?${params.toString()}`, `entreprises-${new Date().toISOString().slice(0, 10)}.csv`)
      .catch(() => {})
      .finally(() => setExporting(false));
  };

  useEffect(() => {
    const q = filter ? `?status=${filter}` : '';
    api<Company[]>(`/companies${q}`)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Entreprises</h1>
          <p className="text-sm text-slate-500 mt-1">Liste des entreprises partenaires</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm focus:outline-none focus:border-totem-accent"
          >
            <option value="">Tous les statuts</option>
            <option value="PROSPECT">Prospect</option>
            <option value="PARTNER">Partenaire</option>
            <option value="INACTIVE">Inactif</option>
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-4 py-2.5 rounded-xl bg-totem-accent text-white text-sm font-medium hover:bg-totem-accent-hover disabled:opacity-60 transition-all"
          >
            {exporting ? 'Export…' : 'Exporter CSV'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {list.map((c, i) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/dashboard/companies/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">
                      {c.sector} • {c.city} • {c._count.offers} offre(s)
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                    {LABELS[c.status] ?? c.status}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
          {list.length === 0 && (
            <p className="p-8 text-center text-slate-500">Aucune entreprise</p>
          )}
        </div>
      )}
    </div>
  );
}
