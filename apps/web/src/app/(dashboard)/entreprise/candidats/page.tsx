'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function EntrepriseCandidatsPage() {
  const user = useAuthStore((s) => s.user);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>('/offers')
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Candidats proposés</h1>
      <p className="text-slate-600">
        Consultez les candidats pour chaque offre depuis la page de détail de l&apos;offre.
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {offers.map((o) => (
              <li key={o.id}>
                <a
                  href={`/entreprise/offres/${o.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <p className="font-medium text-slate-800">{o.title}</p>
                  <span className="text-sm text-slate-500">{o._count?.matches ?? 0} candidat(s)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
