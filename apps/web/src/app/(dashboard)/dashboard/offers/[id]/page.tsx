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
  company: { id: string; name: string };
  matches: Array<{
    id: string;
    score: number;
    status: string;
    candidate: { id: string; firstName: string; lastName: string; user: { email: string } };
  }>;
}

export default function OfferDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<OfferDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ candidateId: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<OfferDetail>(`/offers/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api<Array<{ candidateId: string; score: number }>>(`/matches/suggestions/offer/${id}`)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
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
        <Link href="/dashboard/offers" className="text-slate-500 hover:text-slate-700">
          ← Offres
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
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Candidats proposés / matchs</h2>
        <ul className="space-y-2">
          {data.matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-2 border-b border-slate-100"
            >
              <Link
                href={`/dashboard/candidates/${m.candidate.id}`}
                className="font-medium text-primary-600 hover:underline"
              >
                {m.candidate.firstName} {m.candidate.lastName}
              </Link>
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

      {suggestions.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Candidats suggérés</h2>
          <ul className="space-y-2">
            {suggestions.slice(0, 10).map((s) => (
              <li
                key={s.candidateId}
                className="flex items-center justify-between py-2 border-b border-slate-100"
              >
                <span className="text-slate-600">Candidat {s.candidateId.slice(0, 8)}…</span>
                <span className="text-primary-600 font-medium">Score {s.score}%</span>
                <Link
                  href={`/dashboard/candidates/${s.candidateId}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Voir
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
