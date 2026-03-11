'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { LABELS } from '@totem/shared';

interface Offer {
  id: string;
  title: string;
  city: string;
  status: string;
  _count: { matches: number };
}

export default function EntrepriseOffresPage() {
  const user = useAuthStore((s) => s.user);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Offer[]>('/offers')
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes offres</h1>
        <p className="text-sm text-white/60 mt-1">Gérez vos offres d&apos;alternance</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-[14px] border border-white/10 overflow-hidden">
          <ul className="divide-y divide-white/10">
            {offers.map((o, i) => (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/entreprise/offres/${o.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
                >
                  <div>
                    <p className="font-medium text-white">{o.title}</p>
                    <p className="text-sm text-white/60">
                      {o.city} • {o._count.matches} candidat(s)
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      o.status === 'ACTIVE' ? 'bg-totem-accent/20 text-totem-accent' : 'bg-white/10 text-white/80'
                    }`}
                  >
                    {LABELS[o.status] ?? o.status}
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
          {offers.length === 0 && (
            <p className="p-8 text-center text-white/60">Aucune offre. Créez votre première offre.</p>
          )}
        </div>
      )}
    </div>
  );
}
