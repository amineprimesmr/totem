'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { LABELS } from '@/lib/labels';

interface OfferDetail {
  id: string;
  title: string;
  description: string;
  city: string;
  sector: string;
  status: string;
  company: { name: string };
  matches: Array<{
    id: string;
    score: number;
    status: string;
    candidate: { id: string; firstName: string; lastName: string; formation: string; user: { email: string } };
  }>;
}

export default function EntrepriseOfferDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<OfferDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<OfferDetail>(`/offers/${id}`)
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
        <Link href="/entreprise" className="text-slate-500 hover:text-slate-700">
          ← Mes offres
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <h1 className="text-2xl font-bold text-slate-800">{data.title}</h1>
        <p className="text-slate-600 mt-1">{data.company.name} • {data.city}</p>
        <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {LABELS[data.status] ?? data.status}
        </span>
        <p className="mt-4 text-slate-600 whitespace-pre-wrap">{data.description}</p>
      </motion.div>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Candidats proposés</h2>
        <ul className="space-y-3">
          {data.matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {m.candidate.firstName} {m.candidate.lastName}
                </p>
                <p className="text-sm text-slate-500">{m.candidate.formation}</p>
                <p className="text-xs text-slate-400">{m.candidate.user.email}</p>
              </div>
              <span className="text-sm text-slate-600">
                Score {m.score}% • {LABELS[m.status] ?? m.status}
              </span>
            </li>
          ))}
        </ul>
        {data.matches.length === 0 && (
          <p className="text-slate-500">Aucun candidat proposé pour cette offre.</p>
        )}
      </section>
    </div>
  );
}
