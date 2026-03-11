'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { LABELS } from '@/lib/labels';
import toast from 'react-hot-toast';

interface CandidateDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  formation: string;
  city: string;
  status: string;
  user: { email: string };
  matches: Array<{
    id: string;
    score: number;
    status: string;
    offer: { id: string; title: string; company: { name: string } };
  }>;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<CandidateDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ offerId: string; score: number; distanceKm: number | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CandidateDetail>(`/candidates/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api<Array<{ offerId: string; score: number; distanceKm: number | null }>>(
      `/matches/suggestions/candidate/${id}`,
    )
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [id]);

  async function proposeOffer(offerId: string) {
    try {
      await api('/matches/propose', {
        method: 'POST',
        body: JSON.stringify({ candidateId: id, offerId }),
      });
      toast.success('Candidat proposé à l\'offre');
      setSuggestions((s) => s.filter((x) => x.offerId !== offerId));
      if (data) setData({ ...data, matches: [...data.matches, { id: '', score: 0, status: 'PROPOSED', offer: { id: offerId, title: '', company: { name: '' } } }] });
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    }
  }

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
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/candidates"
          className="text-slate-500 hover:text-slate-700"
        >
          ← Candidats
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {data.firstName} {data.lastName}
            </h1>
            <p className="text-slate-600">{data.user.email}</p>
            <p className="text-sm text-slate-500 mt-1">
              {data.formation} • {data.city}
            </p>
            <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {LABELS[data.status] ?? data.status}
            </span>
          </div>
        </div>
      </motion.div>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Matchs / Candidatures</h2>
        <ul className="space-y-2">
          {data.matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div>
                <Link href={`/dashboard/offers/${m.offer.id}`} className="font-medium text-primary-600 hover:underline">
                  {m.offer.title}
                </Link>
                <p className="text-sm text-slate-500">{m.offer.company.name}</p>
              </div>
              <span className="text-sm text-slate-600">
                Score {m.score}% • {LABELS[m.status] ?? m.status}
                {(m as any).candidateResponse === 'YES' && (
                  <span className="ml-2 text-green-600">• Réponse : Oui</span>
                )}
                {(m as any).candidateResponse === 'NO' && (
                  <span className="ml-2 text-slate-500">• Réponse : Non</span>
                )}
                {(m as any).candidateNotifiedAt && !(m as any).candidateResponse && (
                  <span className="ml-2 text-amber-600">• En attente de réponse</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {data.matches.length === 0 && (
          <p className="text-slate-500">Aucun match pour le moment.</p>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Offres suggérées</h2>
          <p className="text-sm text-slate-500 mb-4">
            Proposer ce candidat à une offre pour créer un match.
          </p>
          <ul className="space-y-2">
            {suggestions.slice(0, 10).map((s) => (
              <li
                key={s.offerId}
                className="flex items-center justify-between py-2 border-b border-slate-100"
              >
                <span className="text-slate-600">Offre {s.offerId.slice(0, 8)}…</span>
                <span className="text-sm text-slate-500">Score {s.score}%</span>
                <button
                  type="button"
                  onClick={() => proposeOffer(s.offerId)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Proposer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
