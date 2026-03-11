'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function CandidatCandidaturesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const candidateId = user?.candidateId;
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    api<any[]>(`/matches/candidate/${candidateId}`)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (!candidateId && !loading) {
    router.replace('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Mes candidatures</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {matches.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Aucune candidature pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {matches.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="px-6 py-4"
                >
                  <p className="font-medium text-slate-800">{m.offer?.title}</p>
                  <p className="text-sm text-slate-500">{m.offer?.company?.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Score {m.score}% • Statut: {m.status}
                  </p>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
