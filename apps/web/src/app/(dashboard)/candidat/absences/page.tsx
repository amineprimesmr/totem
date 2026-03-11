'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { portailApi, type Absence } from '@/lib/api';

const ABSENCE_TYPES: Record<string, string> = {
  ABSENCE: 'Absence',
  LATE: 'Retard',
  EXCUSED: 'Justifiée',
};

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    portailApi
      .getMyAbsences(from || undefined, to || undefined)
      .then(setAbsences)
      .catch(() => setAbsences([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mes absences</h1>
        <p className="text-sm text-white/60 mt-1">Historique des absences et retards</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-white text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {absences.map((a) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-[14px] border p-4 ${
                a.justified
                  ? 'bg-[#1a1a1a] border-white/10'
                  : 'bg-amber-950/30 border-amber-500/30'
              }`}
            >
              <p className="font-medium text-white">
                {new Date(a.date).toLocaleDateString('fr-FR')} • {ABSENCE_TYPES[a.type] ?? a.type}
              </p>
              {a.justified && <p className="text-sm text-white/60 mt-1">Justifiée</p>}
              {a.notes && <p className="text-sm text-white/70 mt-1">{a.notes}</p>}
            </motion.li>
          ))}
        </ul>
      )}
      {!loading && absences.length === 0 && (
        <p className="text-white/60">Aucune absence enregistrée pour cette période.</p>
      )}
    </div>
  );
}
