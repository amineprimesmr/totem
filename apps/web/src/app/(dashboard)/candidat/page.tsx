'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LABELS } from '@totem/shared';

interface Suggestion {
  offerId: string;
  score: number;
  distanceKm: number | null;
}

interface Match {
  id: string;
  score: number;
  status: string;
  offer?: { title: string; company?: { name: string } };
}

export default function CandidatOffresPage() {
  const user = useAuthStore((s) => s.user);
  const candidateId = user?.candidateId;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) return;
    Promise.all([
      api<Suggestion[]>(`/matches/suggestions/candidate/${candidateId}`),
      api<Match[]>(`/matches/candidate/${candidateId}`),
    ])
      .then(([sug, mat]) => {
        setSuggestions(sug);
        setMatches(mat);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (!candidateId) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Offres qui me correspondent</h1>
        <p className="text-sm text-white/60 mt-1">Vos candidatures et suggestions</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <>
          <section className="bg-[#1a1a1a] rounded-[14px] border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Mes candidatures</h2>
            {matches.length === 0 ? (
              <p className="text-white/60">Vous n&apos;avez pas encore de candidatures.</p>
            ) : (
              <ul className="space-y-3">
                {matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-white">{m.offer?.title}</p>
                      <p className="text-sm text-white/60">{m.offer?.company?.name}</p>
                    </div>
                    <span className="text-sm text-white/80">
                      Score {m.score}% • {LABELS[m.status] ?? m.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-[#1a1a1a] rounded-[14px] border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Offres suggérées</h2>
            {suggestions.length === 0 ? (
              <p className="text-white/60">Aucune offre suggérée pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {suggestions.slice(0, 15).map((s) => (
                  <li
                    key={s.offerId}
                    className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                  >
                    <span className="text-white/80">Offre (ID: {s.offerId.slice(0, 8)}…)</span>
                    <span className="text-totem-accent font-medium">Score {s.score}%</span>
                    {s.distanceKm != null && (
                      <span className="text-sm text-white/60">{Math.round(s.distanceKm)} km</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
