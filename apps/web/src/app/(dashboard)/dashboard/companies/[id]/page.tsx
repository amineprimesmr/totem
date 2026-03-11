'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { LABELS } from '@/lib/labels';

interface CompanyDetail {
  id: string;
  name: string;
  sector: string;
  address: string;
  city: string;
  status: string;
  offers: Array<{ id: string; title: string; status: string; _count: { matches: number } }>;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CompanyDetail>(`/companies/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/companies" className="text-slate-500 hover:text-slate-700">
          ← Entreprises
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h1 className="text-2xl font-bold text-slate-800">{data.name}</h1>
        <p className="text-slate-600 mt-1">{data.sector} • {data.city}</p>
        <p className="text-sm text-slate-500 mt-1">{data.address}</p>
        <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {LABELS[data.status] ?? data.status}
        </span>
      </motion.div>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Offres</h2>
        <ul className="space-y-2">
          {data.offers.map((o) => (
            <li key={o.id}>
              <Link
                href={`/dashboard/offers/${o.id}`}
                className="flex items-center justify-between py-2 border-b border-slate-100 hover:bg-slate-50 rounded px-2 -mx-2"
              >
                <span className="font-medium text-slate-800">{o.title}</span>
                <span className="text-sm text-slate-500">
                  {LABELS[o.status] ?? o.status} • {o._count.matches} match(s)
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {data.offers.length === 0 && (
          <p className="text-slate-500">Aucune offre pour cette entreprise.</p>
        )}
      </section>
    </div>
  );
}
