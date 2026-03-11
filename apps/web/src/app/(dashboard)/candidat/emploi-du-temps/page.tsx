'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { portailApi, type Session } from '@/lib/api';

const SESSION_TYPES: Record<string, string> = {
  COURSE: 'Cours',
  EXAM: 'Examen',
  WORKSHOP: 'Atelier',
  MEETING: 'Réunion',
  OTHER: 'Autre',
};

export default function EmploiDuTempsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const fromDate = from || undefined;
    const toDate = to || undefined;
    portailApi
      .getMySchedule(fromDate, toDate)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mon emploi du temps</h1>
        <p className="text-sm text-white/60 mt-1">Sessions de ma promotion</p>
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#1a1a1a] rounded-xl animate-pulse border border-white/10" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1a1a1a] rounded-[14px] border border-white/10 p-4"
            >
              <p className="font-medium text-white">{s.title}</p>
              <p className="text-sm text-white/60 mt-1">
                {new Date(s.startAt).toLocaleString('fr-FR')} → {new Date(s.endAt).toLocaleString('fr-FR')}
                {s.room && ` • ${s.room.name}`}
                {' • '}
                {SESSION_TYPES[s.type] ?? s.type}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
      {!loading && sessions.length === 0 && (
        <p className="text-white/60">Aucune session planifiée pour cette période.</p>
      )}
    </div>
  );
}
